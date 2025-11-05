const { app, BrowserWindow, ipcMain, protocol } = require('electron');
const path = require('path');
const JsSIP = require('jssip');

let mainWindow;
let sipUA = null;
let currentSession = null;
let pendingConfig = null; // Конфигурация из URL

// Регистрация custom protocol
const PROTOCOL = 'besedkiphone';

if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient(PROTOCOL, process.execPath, [path.resolve(process.argv[1])]);
  }
} else {
  app.setAsDefaultProtocolClient(PROTOCOL);
}

// Обработка single instance (чтобы не открывалось несколько окон)
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    // Кто-то пытался открыть второй экземпляр, активируем существующее окно
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();

      // Обработка URL из commandLine
      const url = commandLine.find(arg => arg.startsWith(`${PROTOCOL}://`));
      if (url) {
        handleDeepLink(url);
      }
    }
  });

  // Обработка deep link на macOS
  app.on('open-url', (event, url) => {
    event.preventDefault();
    handleDeepLink(url);
  });
}

// Парсинг и обработка deep link URL
function handleDeepLink(url) {
  console.log('Handling deep link:', url);

  // Формат: besedkiphone://connect?server=192.168.1.100&user=1001&password=pass&port=5060
  try {
    const urlObj = new URL(url);
    if (urlObj.protocol === `${PROTOCOL}:` && urlObj.hostname === 'connect') {
      const params = urlObj.searchParams;
      const config = {
        server: params.get('server'),
        user: params.get('user'),
        password: params.get('password'),
        port: parseInt(params.get('port')) || 5060,
        displayName: params.get('displayName') || 'Besedki Phone'
      };

      if (config.server && config.user && config.password) {
        if (mainWindow && mainWindow.webContents) {
          // Окно уже открыто, отправляем конфиг
          mainWindow.webContents.send('auto-connect', config);
        } else {
          // Окно еще не открыто, сохраняем конфиг
          pendingConfig = config;
        }
      }
    }
  } catch (error) {
    console.error('Error parsing deep link:', error);
  }
}

// Создание главного окна
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 400,
    height: 700,
    resizable: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    title: 'Besedki EMIN Phone',
    icon: path.join(__dirname, 'assets/icon.png'),
  });

  mainWindow.loadFile('index.html');

  // Открыть DevTools для отладки (закомментируйте в продакшене)
  // mainWindow.webContents.openDevTools();

  mainWindow.webContents.on('did-finish-load', () => {
    // Если есть отложенная конфигурация, отправляем её
    if (pendingConfig) {
      mainWindow.webContents.send('auto-connect', pendingConfig);
      pendingConfig = null;
    }
  });

  mainWindow.on('closed', () => {
    if (sipUA) {
      sipUA.stop();
    }
    mainWindow = null;
  });
}

// Инициализация SIP
ipcMain.on('sip-register', (event, config) => {
  try {
    console.log('Registering SIP with config:', {
      server: config.server,
      user: config.user,
      port: config.port || 5060
    });

    // Создаем SIP URI
    const sipUri = `sip:${config.user}@${config.server}`;

    // Yeastar S100 поддерживает WebSocket на порту 8089
    // JsSIP требует WebSocket транспорт
    const wsPort = config.wsPort || 8089; // WebSocket порт для Yeastar
    const socket = new JsSIP.WebSocketInterface(`ws://${config.server}:${wsPort}`);

    const configuration = {
      sockets: [socket],
      uri: sipUri,
      password: config.password,
      display_name: config.displayName || 'Besedki Phone',
      register: true,
      register_expires: 600,
      session_timers: false,
      connection_recovery_max_interval: 30,
      connection_recovery_min_interval: 2,
    };

    sipUA = new JsSIP.UA(configuration);

    // События регистрации
    sipUA.on('registered', () => {
      console.log('✅ SIP Registered on UDP port', config.port || 5060);
      event.reply('sip-status', {
        status: 'registered',
        message: `Зарегистрирован на ${config.server}:${config.port || 5060} (UDP)`
      });
    });

    sipUA.on('unregistered', () => {
      console.log('SIP Unregistered');
      event.reply('sip-status', {
        status: 'unregistered',
        message: 'Не зарегистрирован'
      });
    });

    sipUA.on('registrationFailed', (data) => {
      console.error('SIP Registration Failed:', data.cause);
      event.reply('sip-status', {
        status: 'error',
        message: `Ошибка регистрации: ${data.cause}`
      });
    });

    // События звонков
    sipUA.on('newRTCSession', (data) => {
      currentSession = data.session;

      if (currentSession.direction === 'incoming') {
        console.log('Incoming call from:', currentSession.remote_identity.uri.user);
        event.reply('incoming-call', {
          from: currentSession.remote_identity.uri.user,
          displayName: currentSession.remote_identity.display_name
        });

        // События сессии
        currentSession.on('accepted', () => {
          event.reply('call-status', { status: 'accepted' });
        });

        currentSession.on('ended', () => {
          event.reply('call-status', { status: 'ended' });
          currentSession = null;
        });

        currentSession.on('failed', (data) => {
          event.reply('call-status', {
            status: 'failed',
            message: data.cause
          });
          currentSession = null;
        });
      } else {
        // Исходящий звонок
        currentSession.on('progress', () => {
          event.reply('call-status', { status: 'ringing' });
        });

        currentSession.on('accepted', () => {
          event.reply('call-status', { status: 'accepted' });
        });

        currentSession.on('ended', () => {
          event.reply('call-status', { status: 'ended' });
          currentSession = null;
        });

        currentSession.on('failed', (data) => {
          event.reply('call-status', {
            status: 'failed',
            message: data.cause
          });
          currentSession = null;
        });
      }
    });

    sipUA.start();

  } catch (error) {
    console.error('SIP Registration Error:', error);
    event.reply('sip-status', {
      status: 'error',
      message: error.message
    });
  }
});

// Совершить звонок
ipcMain.on('make-call', (event, phoneNumber) => {
  if (!sipUA || !sipUA.isRegistered()) {
    event.reply('call-status', {
      status: 'error',
      message: 'SIP не зарегистрирован'
    });
    return;
  }

  try {
    const eventHandlers = {
      progress: () => {
        event.reply('call-status', { status: 'calling' });
      },
      failed: (data) => {
        event.reply('call-status', {
          status: 'failed',
          message: data.cause
        });
      },
      ended: () => {
        event.reply('call-status', { status: 'ended' });
      },
      confirmed: () => {
        event.reply('call-status', { status: 'connected' });
      }
    };

    const options = {
      eventHandlers: eventHandlers,
      mediaConstraints: {
        audio: true,
        video: false
      }
    };

    sipUA.call(phoneNumber, options);
  } catch (error) {
    console.error('Call Error:', error);
    event.reply('call-status', {
      status: 'error',
      message: error.message
    });
  }
});

// Завершить звонок
ipcMain.on('hangup-call', () => {
  if (currentSession) {
    currentSession.terminate();
    currentSession = null;
  }
});

// Ответить на звонок
ipcMain.on('answer-call', () => {
  if (currentSession) {
    const options = {
      mediaConstraints: {
        audio: true,
        video: false
      }
    };
    currentSession.answer(options);
  }
});

// Отклонить звонок
ipcMain.on('reject-call', () => {
  if (currentSession) {
    currentSession.terminate();
    currentSession = null;
  }
});

// Отключиться от SIP
ipcMain.on('sip-unregister', () => {
  if (sipUA) {
    sipUA.stop();
    sipUA = null;
  }
});

// События приложения
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('before-quit', () => {
  if (sipUA) {
    sipUA.stop();
  }
});

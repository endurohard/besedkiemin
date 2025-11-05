import { Injectable, HttpException } from '@nestjs/common';
import axios from 'axios';

interface YeastarConfig {
  host: string; // IP адрес Yeastar S100
  username: string; // API username
  password: string; // API password
  extension: string; // Extension для звонков
}

interface YeastarCallResponse {
  callid: string;
  status: string;
}

@Injectable()
export class YeastarService {
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;

  /**
   * Получить токен доступа к Yeastar API
   */
  async getAccessToken(config: YeastarConfig): Promise<string> {
    // Проверяем, не истек ли токен
    if (this.accessToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      const response = await axios.post(
        `https://${config.host}/api/v2.0.0/login`,
        {
          username: config.username,
          password: config.password,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          // Отключаем проверку SSL для локальных сертификатов
          httpsAgent: new (require('https').Agent)({
            rejectUnauthorized: false,
          }),
        }
      );

      this.accessToken = response.data.access_token;
      // Токен действителен 30 минут
      this.tokenExpiry = new Date(Date.now() + 30 * 60 * 1000);

      return this.accessToken;
    } catch (error: any) {
      console.error('Yeastar login error:', error.response?.data || error.message);
      throw new HttpException(
        'Не удалось подключиться к Yeastar API',
        error.response?.status || 500
      );
    }
  }

  /**
   * Совершить исходящий звонок через Yeastar API
   * @param config - конфигурация Yeastar
   * @param phoneNumber - номер для звонка
   */
  async makeCall(config: YeastarConfig, phoneNumber: string): Promise<YeastarCallResponse> {
    const token = await this.getAccessToken(config);

    try {
      const response = await axios.post(
        `https://${config.host}/api/v2.0.0/extension/dial`,
        {
          caller: config.extension, // Extension который звонит
          callee: phoneNumber, // Номер получателя
          autoanswer: 'yes', // Автоответ на extension
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          httpsAgent: new (require('https').Agent)({
            rejectUnauthorized: false,
          }),
        }
      );

      return {
        callid: response.data.callid,
        status: 'calling',
      };
    } catch (error: any) {
      console.error('Yeastar call error:', error.response?.data || error.message);
      throw new HttpException(
        'Не удалось совершить звонок через Yeastar',
        error.response?.status || 500
      );
    }
  }

  /**
   * Завершить звонок
   */
  async hangupCall(config: YeastarConfig, callid: string): Promise<void> {
    const token = await this.getAccessToken(config);

    try {
      await axios.post(
        `https://${config.host}/api/v2.0.0/call/hangup`,
        {
          callid: callid,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          httpsAgent: new (require('https').Agent)({
            rejectUnauthorized: false,
          }),
        }
      );
    } catch (error: any) {
      console.error('Yeastar hangup error:', error.response?.data || error.message);
      throw new HttpException(
        'Не удалось завершить звонок',
        error.response?.status || 500
      );
    }
  }

  /**
   * Получить активные звонки
   */
  async getActiveCalls(config: YeastarConfig): Promise<any[]> {
    const token = await this.getAccessToken(config);

    try {
      const response = await axios.get(
        `https://${config.host}/api/v2.0.0/call/query`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          httpsAgent: new (require('https').Agent)({
            rejectUnauthorized: false,
          }),
        }
      );

      return response.data.calls || [];
    } catch (error: any) {
      console.error('Yeastar query error:', error.response?.data || error.message);
      return [];
    }
  }

  /**
   * Подписаться на события звонков через WebSocket (опционально)
   * Можно использовать для получения входящих звонков
   */
  async subscribeToEvents(config: YeastarConfig): Promise<void> {
    // Здесь можно реализовать подписку на события через Yeastar Event API
    // Это позволит получать уведомления о входящих звонках
    console.log('Subscribe to Yeastar events not implemented yet');
  }
}

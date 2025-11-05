import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import TelegramBot from 'node-telegram-bot-api';
import { PrismaService } from '../prisma/prisma.service';
import { TaskStatus } from '@prisma/client';

@Injectable()
export class TelegramService implements OnModuleInit {
  private readonly logger = new Logger(TelegramService.name);
  private bot: TelegramBot;
  private readonly botToken = '8406603601:AAEdJDXar7oTYkxyFPW6Gn-m5bXwFZrQX9U';

  // Хранилище состояний пользователей для обработки фото
  private userStates = new Map<number, {
    action: 'reject_task';
    taskId: string;
    reason: string;
    quantity: number;
  }>();

  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    this.logger.log('Initializing Telegram Bot...');
    this.bot = new TelegramBot(this.botToken, { polling: true });
    this.logger.log('Telegram Bot is running!');
    this.registerCommands();
  }

  private registerCommands() {
    // Команда /start с параметром userId для привязки через QR
    this.bot.onText(/\/start (.+)/, async (msg, match) => {
      const chatId = msg.chat.id;
      const telegramId = msg.from?.id.toString();
      const userId = match?.[1];

      if (!telegramId) {
        await this.bot.sendMessage(chatId, '❌ Ошибка определения Telegram ID');
        return;
      }

      if (userId) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
          await this.bot.sendMessage(chatId, '❌ Пользователь не найден');
          return;
        }

        await this.prisma.user.update({
          where: { id: userId },
          data: { telegramId },
        });

        await this.bot.sendMessage(
          chatId,
          \`✅ Telegram успешно привязан!\n\n👤 \${user.firstName} \${user.lastName}\n🏢 Роль: \${user.role}\n\nТеперь вы будете получать уведомления.\`
        );
      }
    });

    // /start без параметров
    this.bot.onText(/\/start$/, async (msg) => {
      const chatId = msg.chat.id;
      const telegramId = msg.from?.id.toString();
      if (!telegramId) return;

      const user = await this.prisma.user.findFirst({ where: { telegramId } });
      if (user) {
        await this.bot.sendMessage(
          chatId,
          \`✅ Аккаунт привязан:\n👤 \${user.firstName} \${user.lastName}\n🏢 \${user.role}\n\nИспользуйте /tasks\`
        );
      } else {
        await this.bot.sendMessage(
          chatId,
          \`👋 Для привязки отсканируйте QR код в профиле.\n\n📝 Telegram ID: \\\`\${telegramId}\\\`\`,
          { parse_mode: 'Markdown' }
        );
      }
    });

    // /tasks
    this.bot.onText(/\/tasks/, async (msg) => {
      const chatId = msg.chat.id;
      const telegramId = msg.from?.id.toString();
      if (!telegramId) return;

      const user = await this.prisma.user.findFirst({ where: { telegramId } });
      if (!user) {
        await this.bot.sendMessage(chatId, '❌ Аккаунт не привязан');
        return;
      }

      const tasks = await this.prisma.task.findMany({
        where: {
          assignedToId: user.id,
          status: { in: [TaskStatus.NEW, TaskStatus.ACCEPTED] },
        },
        include: { product: { include: { order: true, productType: true } } },
        orderBy: { createdAt: 'desc' },
      });

      if (tasks.length === 0) {
        await this.bot.sendMessage(chatId, '📋 Нет активных задач');
        return;
      }

      let message = '📋 *Активные задачи:*\n\n';
      tasks.forEach((task, i) => {
        const emoji = task.status === TaskStatus.NEW ? '🆕' : '⏳';
        message += \`\${i + 1}. \${emoji} \${task.title}\n\`;
        message += \`   📦 \${task.product?.order?.orderNumber}\n\`;
        message += \`   📊 \${task.quantity} шт.\n\n\`;
      });

      await this.bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    });

    // Обработка фото для браковки
    this.bot.on('photo', async (msg) => {
      const chatId = msg.chat.id;
      const state = this.userStates.get(msg.from!.id);

      if (!state || state.action !== 'reject_task') {
        await this.bot.sendMessage(chatId, '❌ Нет активной браковки');
        return;
      }

      const photo = msg.photo![msg.photo!.length - 1];
      const file = await this.bot.getFile(photo.file_id);
      const fileUrl = \`https://api.telegram.org/file/bot\${this.botToken}/\${file.file_path}\`;

      this.logger.log(\`Photo received for task \${state.taskId}: \${fileUrl}\`);

      await this.bot.sendMessage(
        chatId,
        \`✅ Фото получено!\n📦 Задача: \${state.taskId}\n📝 \${state.reason}\n📊 \${state.quantity} шт.\`
      );

      this.userStates.delete(msg.from!.id);
    });

    // Текстовые сообщения
    this.bot.on('text', async (msg) => {
      if (msg.text?.startsWith('/')) return;
      await this.bot.sendMessage(msg.chat.id, 'ℹ️ /tasks - задачи\n/start - привязка');
    });
  }

  async notifyNewTask(userId: string, taskTitle: string, orderNumber: string, quantity: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.telegramId) return;

    try {
      await this.bot.sendMessage(
        parseInt(user.telegramId),
        \`🆕 *Новая задача!*\n📋 \${taskTitle}\n📦 \${orderNumber}\n📊 \${quantity} шт.\`,
        { parse_mode: 'Markdown' }
      );
    } catch (error) {
      this.logger.error(\`Failed to notify user \${userId}\`, error);
    }
  }

  async requestDefectPhoto(userId: string, taskId: string, reason: string, quantity: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.telegramId) return false;

    const chatId = parseInt(user.telegramId);
    this.userStates.set(chatId, { action: 'reject_task', taskId, reason, quantity });

    try {
      await this.bot.sendMessage(
        chatId,
        \`📸 *Фото брака*\n📝 \${reason}\n📊 \${quantity} шт.\n\nОтправьте фото.\`,
        { parse_mode: 'Markdown' }
      );
      return true;
    } catch (error) {
      this.logger.error(\`Failed to request photo from \${userId}\`, error);
      return false;
    }
  }

  generateTelegramLink(userId: string): string {
    return \`https://t.me/BesedkiEminBot?start=\${userId}\`;
  }
}

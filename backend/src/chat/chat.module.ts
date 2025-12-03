import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { ChatController } from './chat.controller';
import { CallbackService } from './callback.service';
import { CallbackController } from './callback.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { TelegramModule } from '../telegram/telegram.module';

@Module({
  imports: [PrismaModule, TelegramModule],
  controllers: [ChatController, CallbackController],
  providers: [ChatService, CallbackService, ChatGateway],
  exports: [ChatService, CallbackService],
})
export class ChatModule {}

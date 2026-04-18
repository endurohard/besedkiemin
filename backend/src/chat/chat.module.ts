import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { ChatService } from "./chat.service";
import { ChatGateway } from "./chat.gateway";
import { ChatController } from "./chat.controller";
import { CallbackService } from "./callback.service";
import { CallbackController } from "./callback.controller";
import { PrismaModule } from "../prisma/prisma.module";
import { TelegramModule } from "../telegram/telegram.module";

@Module({
  imports: [
    PrismaModule,
    TelegramModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get("JWT_SECRET"),
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [ChatController, CallbackController],
  providers: [ChatService, CallbackService, ChatGateway],
  exports: [ChatService, CallbackService],
})
export class ChatModule {}

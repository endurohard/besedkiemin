import { Module } from "@nestjs/common";
import { QualityChecksService } from "./quality-checks.service";
import { QualityChecksController } from "./quality-checks.controller";
import { PrismaModule } from "../prisma/prisma.module";
import { UploadModule } from "../upload/upload.module";
import { TelegramModule } from "../telegram/telegram.module";

@Module({
  imports: [PrismaModule, UploadModule, TelegramModule],
  controllers: [QualityChecksController],
  providers: [QualityChecksService],
  exports: [QualityChecksService],
})
export class QualityChecksModule {}

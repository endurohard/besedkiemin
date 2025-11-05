import { Module } from '@nestjs/common';
import { CatalogOrdersService } from './catalog-orders.service';
import { CatalogOrdersController } from './catalog-orders.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { TelegramModule } from '../telegram/telegram.module';

@Module({
  imports: [PrismaModule, TelegramModule],
  providers: [CatalogOrdersService],
  controllers: [CatalogOrdersController],
  exports: [CatalogOrdersService],
})
export class CatalogOrdersModule {}

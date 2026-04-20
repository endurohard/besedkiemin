import { Module } from "@nestjs/common";
import { ProductsService } from "./products.service";
import { ProductsController } from "./products.controller";
import { PrismaModule } from "../prisma/prisma.module";
import { TelegramModule } from "../telegram/telegram.module";
import { InventoryModule } from "../inventory/inventory.module";

@Module({
  imports: [PrismaModule, TelegramModule, InventoryModule],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}

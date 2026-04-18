import { Module } from "@nestjs/common";
import { CatalogProductsService } from "./catalog-products.service";
import { CatalogProductsController } from "./catalog-products.controller";
import { PrismaModule } from "../prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  providers: [CatalogProductsService],
  controllers: [CatalogProductsController],
  exports: [CatalogProductsService],
})
export class CatalogProductsModule {}

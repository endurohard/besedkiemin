import { Module } from "@nestjs/common";
import { CatalogCategoriesService } from "./catalog-categories.service";
import { CatalogCategoriesController } from "./catalog-categories.controller";
import { PrismaModule } from "../prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  providers: [CatalogCategoriesService],
  controllers: [CatalogCategoriesController],
  exports: [CatalogCategoriesService],
})
export class CatalogCategoriesModule {}

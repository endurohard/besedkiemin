import { PartialType } from "@nestjs/swagger";
import { CreateCatalogCategoryDto } from "./create-catalog-category.dto";

export class UpdateCatalogCategoryDto extends PartialType(
  CreateCatalogCategoryDto,
) {}

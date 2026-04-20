import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";

import { InventoryService } from "./inventory.service";

@ApiTags("Inventory")
@Controller("inventory")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post()
  @Roles("OWNER", "MANAGER")
  @ApiOperation({ summary: "Добавить товар на склад вручную" })
  createInventoryItem(
    @Body("name") name: string,
    @Body("productTypeId") productTypeId: string,
    @Body("quantity") quantity: number,
    @Body("notes") notes: string,
  ) {
    return this.inventoryService.createInventoryItem({
      name,
      productTypeId,
      quantity,
      notes,
    });
  }

  @Get()
  @Roles("OWNER", "MANAGER", "WAREHOUSE")
  @ApiOperation({ summary: "Получить все складские остатки" })
  @ApiQuery({
    name: "productTypeId",
    required: false,
    type: String,
    description: "Фильтр по типу продукта",
  })
  getAllInventory(@Query("productTypeId") productTypeId?: string) {
    return this.inventoryService.getAllInventory({
      productTypeId,
    });
  }

  @Get("summary")
  @Roles("OWNER", "MANAGER", "WAREHOUSE")
  @ApiOperation({
    summary: "Получить сводку по остаткам (группировка по типам)",
  })
  getInventorySummary() {
    return this.inventoryService.getInventorySummary();
  }

  @Get("type/:productTypeId")
  @Roles("OWNER", "MANAGER", "WAREHOUSE")
  @ApiOperation({ summary: "Получить остатки по типу продукта" })
  getInventoryByType(@Param("productTypeId") productTypeId: string) {
    return this.inventoryService.getInventoryByType(productTypeId);
  }

  @Get("order/:orderId")
  @Roles("OWNER", "MANAGER", "WAREHOUSE")
  @ApiOperation({ summary: "Получить остатки по заказу" })
  getInventoryByOrder(@Param("orderId") orderId: string) {
    return this.inventoryService.getInventoryByOrder(orderId);
  }

  @Get("availability/lookup")
  @Roles("OWNER", "MANAGER", "WAREHOUSE")
  @ApiOperation({
    summary: "Проверить доступное количество на складе по типу и названию",
  })
  @ApiQuery({ name: "productTypeId", required: true })
  @ApiQuery({ name: "name", required: true })
  getAvailability(
    @Query("productTypeId") productTypeId: string,
    @Query("name") name: string,
  ) {
    return this.inventoryService.getAvailability(productTypeId, name);
  }

  @Get(":id")
  @Roles("OWNER", "MANAGER", "WAREHOUSE")
  @ApiOperation({ summary: "Получить детали складского остатка" })
  getInventoryItem(@Param("id") id: string) {
    return this.inventoryService.getInventoryItem(id);
  }
}

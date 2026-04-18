import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { ContactRequestsService } from "./contact-requests.service";
import { CreateContactRequestDto } from "./dto/create-contact-request.dto";
import { UpdateContactRequestDto } from "./dto/update-contact-request.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";

@ApiTags("Contact Requests")
@Controller("contact-requests")
export class ContactRequestsController {
  constructor(
    private readonly contactRequestsService: ContactRequestsService,
  ) {}

  @Post()
  @ApiOperation({ summary: "Создать запрос обратной связи (публичный доступ)" })
  create(@Body() createDto: CreateContactRequestDto) {
    return this.contactRequestsService.create(createDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("OWNER", "MANAGER")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Получить все запросы (только OWNER/MANAGER)" })
  findAll(@Query("onlyUnprocessed") onlyUnprocessed?: string) {
    return this.contactRequestsService.findAll(onlyUnprocessed === "true");
  }

  @Get(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("OWNER", "MANAGER")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Получить запрос по ID (только OWNER/MANAGER)" })
  findOne(@Param("id") id: string) {
    return this.contactRequestsService.findOne(id);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("OWNER", "MANAGER")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Обновить запрос (только OWNER/MANAGER)" })
  update(@Param("id") id: string, @Body() updateDto: UpdateContactRequestDto) {
    return this.contactRequestsService.update(id, updateDto);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("OWNER")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Удалить запрос (только OWNER)" })
  remove(@Param("id") id: string) {
    return this.contactRequestsService.remove(id);
  }
}

import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Query,
  Request,
  BadRequestException,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
  ApiQuery,
} from "@nestjs/swagger";
import { QualityChecksService } from "./quality-checks.service";
import { CreateQualityCheckDto } from "./dto/create-quality-check.dto";
import { UpdateQualityCheckDto } from "./dto/update-quality-check.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { QualityStatus } from "@prisma/client";
import { UploadService } from "../upload/upload.service";
import { diskStorage } from "multer";
import { extname } from "path";

@ApiTags("quality-checks")
@ApiBearerAuth()
@Controller("quality-checks")
@UseGuards(JwtAuthGuard, RolesGuard)
export class QualityChecksController {
  constructor(
    private readonly qualityChecksService: QualityChecksService,
    private readonly uploadService: UploadService,
  ) {}

  @Post()
  @Roles("WAREHOUSE")
  @UseInterceptors(
    FileInterceptor("photo", {
      storage: diskStorage({
        destination: "./uploads",
        filename: (req, file, callback) => {
          const uniqueSuffix =
            Date.now() + "-" + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          callback(null, `defect-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, callback) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp|heic|heif)$/i)) {
          return callback(
            new BadRequestException(
              "Разрешены только изображения (jpg, png, gif, webp, heic)",
            ),
            false,
          );
        }
        callback(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
  )
  @ApiConsumes("multipart/form-data")
  @ApiOperation({ summary: "Создать проверку качества (только складист)" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        productId: { type: "string", format: "uuid" },
        status: { type: "string", enum: ["PENDING", "APPROVED", "REJECTED"] },
        notes: { type: "string" },
        photo: { type: "string", format: "binary" },
      },
      required: ["productId", "status"],
    },
  })
  create(
    @Body() createQualityCheckDto: CreateQualityCheckDto,
    @UploadedFile() file: Express.Multer.File,
    @Request() req,
  ) {
    return this.qualityChecksService.create(
      createQualityCheckDto,
      req.user.userId,
      file,
    );
  }

  @Get()
  @ApiOperation({ summary: "Получить все проверки качества" })
  @ApiQuery({ name: "productId", required: false })
  @ApiQuery({ name: "status", required: false, enum: QualityStatus })
  findAll(
    @Query("productId") productId?: string,
    @Query("status") status?: QualityStatus,
  ) {
    return this.qualityChecksService.findAll({ productId, status });
  }

  @Get("rejected")
  @ApiOperation({ summary: "Получить все забракованные продукты" })
  getRejected() {
    return this.qualityChecksService.getRejected();
  }

  @Get("product/:productId")
  @ApiOperation({ summary: "Получить проверки качества для продукта" })
  getByProduct(@Param("productId") productId: string) {
    return this.qualityChecksService.getByProduct(productId);
  }

  @Get(":id")
  @ApiOperation({ summary: "Получить проверку качества по ID" })
  findOne(@Param("id") id: string) {
    return this.qualityChecksService.findOne(id);
  }

  @Patch(":id")
  @Roles("WAREHOUSE")
  @UseInterceptors(
    FileInterceptor("photo", {
      storage: diskStorage({
        destination: "./uploads",
        filename: (req, file, callback) => {
          const uniqueSuffix =
            Date.now() + "-" + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          callback(null, `defect-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, callback) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp|heic|heif)$/i)) {
          return callback(
            new BadRequestException(
              "Разрешены только изображения (jpg, png, gif, webp, heic)",
            ),
            false,
          );
        }
        callback(null, true);
      },
    }),
  )
  @ApiConsumes("multipart/form-data")
  @ApiOperation({ summary: "Обновить проверку качества (только складист)" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        status: { type: "string", enum: ["PENDING", "APPROVED", "REJECTED"] },
        notes: { type: "string" },
        photo: { type: "string", format: "binary" },
      },
    },
  })
  update(
    @Param("id") id: string,
    @Body() updateQualityCheckDto: UpdateQualityCheckDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.qualityChecksService.update(id, updateQualityCheckDto, file);
  }

  @Delete(":id")
  @Roles("WAREHOUSE", "MANAGER")
  @ApiOperation({
    summary: "Удалить проверку качества (складист или менеджер)",
  })
  remove(@Param("id") id: string) {
    return this.qualityChecksService.remove(id);
  }
}

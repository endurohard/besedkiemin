import {
  Controller,
  Post,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
  UseGuards,
  BadRequestException,
} from "@nestjs/common";
import { FileInterceptor, FilesInterceptor } from "@nestjs/platform-express";
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiConsumes,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";

import { UploadService } from "./upload.service";

@ApiTags("Upload")
@Controller("upload")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post("schema-image")
  @Roles("OWNER", "MANAGER", "WAREHOUSE")
  @ApiOperation({ summary: "Загрузить фото схемы или фото брака" })
  @ApiConsumes("multipart/form-data")
  @UseInterceptors(FileInterceptor("file", {}))
  async uploadSchemaImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException("Файл не предоставлен");
    }

    // Возвращаем URL загруженного файла
    return {
      url: `/uploads/${file.filename}`,
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
    };
  }

  @Post("schema-images")
  @Roles("OWNER", "MANAGER", "WAREHOUSE")
  @ApiOperation({ summary: "Загрузить пачку фото схем (до 10)" })
  @ApiConsumes("multipart/form-data")
  @UseInterceptors(FilesInterceptor("files", 10))
  async uploadSchemaImages(@UploadedFiles() files: Express.Multer.File[]) {
    if (!files || files.length === 0) {
      throw new BadRequestException("Файлы не предоставлены");
    }

    return {
      urls: files.map((file) => `/uploads/${file.filename}`),
      files: files.map((file) => ({
        url: `/uploads/${file.filename}`,
        filename: file.filename,
        originalName: file.originalname,
        size: file.size,
      })),
    };
  }
}

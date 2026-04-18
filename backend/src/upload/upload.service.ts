import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { diskStorage } from 'multer';
import { extname } from 'path';
import * as fs from 'fs';
import { promisify } from 'util';
import { FILE_UPLOAD } from '../common/constants';

const unlinkAsync = promisify(fs.unlink);

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);

  // Конфигурация для multer
  getMulterOptions() {
    return {
      storage: diskStorage({
        destination: FILE_UPLOAD.UPLOAD_DIR,
        filename: (req, file, callback) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          callback(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, callback) => {
        // Разрешаем только изображения
        if (!file.originalname.match(FILE_UPLOAD.ALLOWED_EXTENSIONS)) {
          return callback(new BadRequestException('Разрешены только изображения (jpg, png, gif, webp, heic)'), false);
        }
        callback(null, true);
      },
      limits: {
        fileSize: FILE_UPLOAD.MAX_FILE_SIZE,
      },
    };
  }

  // Удаление файла
  async deleteFile(filePath: string): Promise<void> {
    try {
      await unlinkAsync(filePath);
    } catch (error) {
      this.logger.error(`Ошибка при удалении файла ${filePath}:`, error);
    }
  }

  // Получение полного пути к файлу
  getFilePath(filename: string): string {
    return `./uploads/${filename}`;
  }

  // Получение URL файла
  getFileUrl(filename: string, baseUrl: string): string {
    return `${baseUrl}/uploads/${filename}`;
  }
}

import { Injectable } from '@nestjs/common';
import { diskStorage } from 'multer';
import { extname } from 'path';
import * as fs from 'fs';
import { promisify } from 'util';

const unlinkAsync = promisify(fs.unlink);

@Injectable()
export class UploadService {
  // Конфигурация для multer
  getMulterOptions() {
    return {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, callback) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          callback(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, callback) => {
        // Разрешаем только изображения
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
          return callback(new Error('Разрешены только изображения!'), false);
        }
        callback(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    };
  }

  // Удаление файла
  async deleteFile(filePath: string): Promise<void> {
    try {
      await unlinkAsync(filePath);
    } catch (error) {
      console.error(`Ошибка при удалении файла ${filePath}:`, error);
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

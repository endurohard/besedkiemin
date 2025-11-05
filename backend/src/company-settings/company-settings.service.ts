import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateCompanySettingsDto } from './dto/update-company-settings.dto';

@Injectable()
export class CompanySettingsService {
  constructor(private prisma: PrismaService) {}

  async getSettings() {
    // Получаем первую запись (у нас всегда одна запись с настройками)
    let settings = await this.prisma.companySettings.findFirst();

    // Если настроек нет, создаем дефолтные
    if (!settings) {
      settings = await this.prisma.companySettings.create({
        data: {
          companyName: 'Моя компания',
          phone: '',
          email: '',
          address: '',
          inn: '',
          logoUrl: null,
        },
      });
    }

    return settings;
  }

  async update(updateDto: UpdateCompanySettingsDto) {
    // Получаем существующие настройки
    const existing = await this.getSettings();

    // Обновляем
    return this.prisma.companySettings.update({
      where: { id: existing.id },
      data: updateDto,
    });
  }
}

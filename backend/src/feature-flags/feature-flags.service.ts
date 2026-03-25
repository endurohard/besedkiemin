import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateFeatureFlagDto } from './dto/update-feature-flag.dto';
import { FeatureFlag } from '@prisma/client';

// Дефолтные feature flags для системы
const DEFAULT_FEATURE_FLAGS = [
  {
    key: 'chat',
    name: 'Онлайн-чат',
    description: 'Чат с клиентами на сайте',
    category: 'sales',
  },
  {
    key: 'catalog',
    name: 'Публичный каталог',
    description: 'Витрина товаров на сайте для клиентов',
    category: 'sales',
  },
  {
    key: 'catalog_orders',
    name: 'Заказы с сайта',
    description: 'Страница заказов из публичного каталога',
    category: 'sales',
  },
  {
    key: 'product_types',
    name: 'Каталог',
    description: 'Производственный каталог типов товаров',
    category: 'production',
  },
  {
    key: 'analytics',
    name: 'Аналитика',
    description: 'Аналитика и отчеты',
    category: 'general',
  },
  {
    key: 'orders',
    name: 'Заказы',
    description: 'Управление заказами',
    category: 'production',
  },
  {
    key: 'inventory',
    name: 'Склад',
    description: 'Складской учет',
    category: 'production',
  },
  {
    key: 'shipments',
    name: 'Отгрузки',
    description: 'Управление отгрузками',
    category: 'production',
  },
  {
    key: 'tasks',
    name: 'Задачи',
    description: 'Канбан-доска задач',
    category: 'production',
  },
  {
    key: 'quality_checks',
    name: 'Контроль качества',
    description: 'Проверка качества продукции',
    category: 'production',
  },
  {
    key: 'telegram_notifications',
    name: 'Telegram уведомления',
    description: 'Отправка уведомлений в Telegram',
    category: 'notifications',
  },
  {
    key: 'sip_telephony',
    name: 'SIP телефония',
    description: 'Интеграция с IP-телефонией',
    category: 'communications',
  },
  {
    key: 'contact_requests',
    name: 'Заявки с сайта',
    description: 'Обработка заявок обратной связи',
    category: 'sales',
  },
  {
    key: 'callback_requests',
    name: 'Обратный звонок',
    description: 'Заявки на обратный звонок',
    category: 'sales',
  },
];

@Injectable()
export class FeatureFlagsService {
  constructor(private prisma: PrismaService) {}

  // Инициализация дефолтных флагов при первом запуске
  async initializeDefaults() {
    for (const flag of DEFAULT_FEATURE_FLAGS) {
      const existing = await this.prisma.featureFlag.findUnique({
        where: { key: flag.key },
      });

      if (!existing) {
        await this.prisma.featureFlag.create({
          data: {
            ...flag,
            isEnabled: true,
          },
        });
      }
    }
  }

  // Получить все feature flags
  async findAll() {
    // Сначала инициализируем дефолтные, если их нет
    await this.initializeDefaults();

    return this.prisma.featureFlag.findMany({
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });
  }

  // Получить feature flag по ключу
  async findByKey(key: string) {
    const flag = await this.prisma.featureFlag.findUnique({
      where: { key },
    });

    if (!flag) {
      throw new NotFoundException(`Feature flag "${key}" не найден`);
    }

    return flag;
  }

  // Проверить, включен ли флаг
  async isEnabled(key: string): Promise<boolean> {
    try {
      const flag = await this.findByKey(key);
      return flag.isEnabled;
    } catch {
      // Если флаг не найден, считаем его включенным по умолчанию
      return true;
    }
  }

  // Получить все включенные флаги (для публичного API)
  async getEnabledFlags(): Promise<Record<string, boolean>> {
    const flags = await this.findAll();
    const result: Record<string, boolean> = {};

    for (const flag of flags) {
      result[flag.key] = flag.isEnabled;
    }

    return result;
  }

  // Обновить feature flag
  async update(key: string, updateDto: UpdateFeatureFlagDto) {
    const flag = await this.findByKey(key);

    return this.prisma.featureFlag.update({
      where: { id: flag.id },
      data: updateDto,
    });
  }

  // Переключить состояние флага
  async toggle(key: string) {
    const flag = await this.findByKey(key);

    return this.prisma.featureFlag.update({
      where: { id: flag.id },
      data: { isEnabled: !flag.isEnabled },
    });
  }

  // Массовое обновление флагов
  async bulkUpdate(updates: { key: string; isEnabled: boolean }[]) {
    const results: FeatureFlag[] = [];

    for (const update of updates) {
      try {
        const result = await this.prisma.featureFlag.update({
          where: { key: update.key },
          data: { isEnabled: update.isEnabled },
        });
        results.push(result);
      } catch {
        // Игнорируем ошибки для несуществующих флагов
      }
    }

    return results;
  }
}

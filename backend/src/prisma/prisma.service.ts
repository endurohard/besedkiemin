import { Injectable, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    // Мягкое удаление заказов: все списочные/агрегатные выборки по Order
    // автоматически исключают удалённые. Чтобы получить удалённые (архив),
    // нужно явно указать deletedAt в where верхнего уровня.
    this.$use(async (params, next) => {
      if (
        params.model === "Order" &&
        ["findMany", "findFirst", "count", "aggregate", "groupBy"].includes(
          params.action,
        )
      ) {
        params.args = params.args || {};
        const where = params.args.where || {};
        if (!("deletedAt" in where)) {
          params.args.where = { ...where, deletedAt: null };
        }
      }
      return next(params);
    });

    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}

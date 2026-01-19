import { Module } from '@nestjs/common';
import { OrderSourcesController } from './order-sources.controller';
import { OrderSourcesService } from './order-sources.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [OrderSourcesController],
  providers: [OrderSourcesService],
  exports: [OrderSourcesService],
})
export class OrderSourcesModule {}

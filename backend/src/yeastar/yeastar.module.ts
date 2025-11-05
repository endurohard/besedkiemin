import { Module } from '@nestjs/common';
import { YeastarService } from './yeastar.service';
import { YeastarController } from './yeastar.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [YeastarController],
  providers: [YeastarService],
  exports: [YeastarService],
})
export class YeastarModule {}

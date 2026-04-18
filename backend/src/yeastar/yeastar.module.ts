import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { YeastarService } from "./yeastar.service";
import { YeastarController } from "./yeastar.controller";
import { PrismaModule } from "../prisma/prisma.module";

@Module({
  imports: [PrismaModule, ConfigModule],
  controllers: [YeastarController],
  providers: [YeastarService],
  exports: [YeastarService],
})
export class YeastarModule {}

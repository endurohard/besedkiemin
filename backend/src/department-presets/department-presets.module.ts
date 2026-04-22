import { Module } from "@nestjs/common";
import { DepartmentPresetsController } from "./department-presets.controller";
import { DepartmentPresetsService } from "./department-presets.service";
import { PrismaModule } from "../prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [DepartmentPresetsController],
  providers: [DepartmentPresetsService],
  exports: [DepartmentPresetsService],
})
export class DepartmentPresetsModule {}

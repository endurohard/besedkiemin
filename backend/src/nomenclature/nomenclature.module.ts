import { Module } from "@nestjs/common";
import { NomenclatureService } from "./nomenclature.service";
import { NomenclatureController } from "./nomenclature.controller";
import { PrismaModule } from "../prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [NomenclatureController],
  providers: [NomenclatureService],
  exports: [NomenclatureService],
})
export class NomenclatureModule {}

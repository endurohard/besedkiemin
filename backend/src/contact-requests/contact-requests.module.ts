import { Module } from "@nestjs/common";
import { ContactRequestsService } from "./contact-requests.service";
import { ContactRequestsController } from "./contact-requests.controller";
import { PrismaModule } from "../prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  providers: [ContactRequestsService],
  controllers: [ContactRequestsController],
  exports: [ContactRequestsService],
})
export class ContactRequestsModule {}

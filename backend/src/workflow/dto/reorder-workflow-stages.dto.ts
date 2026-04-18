import { IsArray, IsString } from "class-validator";

export class ReorderWorkflowStagesDto {
  @IsArray()
  @IsString({ each: true })
  stageIds: string[]; // Массив ID этапов в нужном порядке
}

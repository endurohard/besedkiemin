import { PartialType } from '@nestjs/swagger';
import { CreateWorkflowStageDto } from './create-workflow-stage.dto';

export class UpdateWorkflowStageDto extends PartialType(CreateWorkflowStageDto) {}

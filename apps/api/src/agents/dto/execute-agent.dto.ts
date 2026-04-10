import { IsObject, IsOptional, IsString } from 'class-validator';

export class ExecuteAgentDto {
  @IsString()
  agentId!: string;

  @IsOptional()
  @IsString()
  mode?: string;

  @IsOptional()
  @IsObject()
  input?: Record<string, unknown>;
}

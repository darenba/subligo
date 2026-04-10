import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateAgentPromptDto {
  @ApiPropertyOptional({ description: 'Nuevo proposito visible del prompt.' })
  @IsOptional()
  @IsString()
  purpose?: string;

  @ApiPropertyOptional({ description: 'Nuevo system prompt activo.' })
  @IsOptional()
  @IsString()
  systemPrompt?: string;

  @ApiPropertyOptional({ description: 'Nueva plantilla de prompt de usuario.' })
  @IsOptional()
  @IsString()
  userPromptTemplate?: string;

  @ApiPropertyOptional({ description: 'Version manual opcional. Si se omite, se incrementa automaticamente.' })
  @IsOptional()
  @IsString()
  version?: string;

  @ApiPropertyOptional({ description: 'Nota de cambio o motivo de la nueva version.' })
  @IsOptional()
  @IsString()
  note?: string;
}

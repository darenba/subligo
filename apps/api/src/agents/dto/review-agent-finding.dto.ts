import { IsIn, IsOptional, IsString } from 'class-validator';

export class ReviewAgentFindingDto {
  @IsString()
  @IsIn(['APPROVED', 'REJECTED'])
  decision!: 'APPROVED' | 'REJECTED';

  @IsOptional()
  @IsString()
  note?: string;
}

import {
  IsArray,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class DesignSurfaceElementDto {
  @IsString()
  type!: string;
}

class DesignSurfaceDto {
  @IsString()
  surface!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DesignSurfaceElementDto)
  elements!: DesignSurfaceElementDto[];
}

export class CreateDesignSessionDto {
  @IsString()
  productId!: string;

  @IsOptional()
  @IsString()
  customerId?: string;

  @IsOptional()
  @IsString()
  variantId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DesignSurfaceDto)
  surfaces!: DesignSurfaceDto[];

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateDesignSessionDto {
  @IsArray()
  surfaces!: unknown[];

  @IsOptional()
  @IsString()
  notes?: string;
}


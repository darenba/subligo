import { IsEnum, IsNumber, IsOptional } from 'class-validator';

enum PricingRequestModel {
  UNIT = 'UNIT',
  AREA = 'AREA',
}

export class QuotePricingDto {
  @IsEnum(PricingRequestModel)
  model!: PricingRequestModel;

  @IsNumber()
  quantity!: number;

  @IsOptional()
  @IsNumber()
  unitPrice?: number;

  @IsOptional()
  @IsNumber()
  personalizationMultiplier?: number;

  @IsOptional()
  @IsNumber()
  surfaces?: number;

  @IsOptional()
  @IsNumber()
  widthMeters?: number;

  @IsOptional()
  @IsNumber()
  heightMeters?: number;

  @IsOptional()
  @IsNumber()
  pricePerSquareMeter?: number;

  @IsOptional()
  @IsNumber()
  setupFee?: number;

  @IsOptional()
  @IsNumber()
  finishingCost?: number;

  @IsOptional()
  @IsNumber()
  installationCost?: number;
}


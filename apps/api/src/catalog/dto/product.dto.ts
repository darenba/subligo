import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

enum ProductPricingModel {
  UNIT = 'UNIT',
  AREA = 'AREA',
}

export class ProductVariantDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsString()
  sku!: string;

  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsString()
  size?: string;

  @IsNumber()
  stock!: number;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class ProductPricingRuleDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsEnum(ProductPricingModel)
  pricingModel!: ProductPricingModel;

  @IsOptional()
  @IsNumber()
  minQuantity?: number;

  @IsOptional()
  @IsNumber()
  maxQuantity?: number;

  @IsOptional()
  @IsNumber()
  baseUnitPrice?: number;

  @IsOptional()
  @IsNumber()
  estimatedUnitCost?: number;

  @IsOptional()
  @IsNumber()
  pricePerSquareMeter?: number;

  @IsOptional()
  @IsNumber()
  estimatedCostPerSquareMeter?: number;

  @IsOptional()
  @IsNumber()
  personalizationMultiplier?: number;

  @IsOptional()
  @IsNumber()
  setupFee?: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class ProductMetadataDto {
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsString()
  marketingTitle?: string;

  @IsOptional()
  @IsString()
  marketingDescription?: string;

  @IsOptional()
  @IsString()
  heroCopy?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  proofPoints?: string[];
}

export class UpsertProductDto {
  @IsString()
  categoryId!: string;

  @IsString()
  name!: string;

  @IsString()
  slug!: string;

  @IsString()
  description!: string;

  @IsString()
  sku!: string;

  @IsEnum(ProductPricingModel)
  pricingModel!: ProductPricingModel;

  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsArray()
  baseColorOptions?: string[];

  @IsOptional()
  @IsArray()
  printableSurfaces?: string[];

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ProductVariantDto)
  variants!: ProductVariantDto[];

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ProductPricingRuleDto)
  pricingRules!: ProductPricingRuleDto[];

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => ProductMetadataDto)
  metadata?: ProductMetadataDto;
}

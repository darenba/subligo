import {
  IsArray,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

enum CheckoutPaymentProvider {
  STRIPE = 'STRIPE',
  MANUAL = 'MANUAL',
}

class CheckoutItemDto {
  @IsString()
  productId!: string;

  @IsOptional()
  @IsString()
  variantId?: string;

  @IsOptional()
  @IsString()
  designSessionId?: string;

  @IsNumber()
  quantity!: number;

  @IsNumber()
  unitPrice!: number;

  @IsOptional()
  @IsNumber()
  widthMeters?: number;

  @IsOptional()
  @IsNumber()
  heightMeters?: number;

  @IsOptional()
  @IsNumber()
  surfaces?: number;

  @IsOptional()
  @IsObject()
  configuration?: Record<string, unknown>;
}

export class CheckoutDto {
  @IsOptional()
  @IsString()
  customerId?: string;

  @IsOptional()
  @IsString()
  quoteId?: string;

  @IsOptional()
  @IsString()
  shippingMethod?: string;

  @IsOptional()
  @IsObject()
  shippingAddress?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  billingAddress?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  customerNotes?: string;

  @IsEnum(CheckoutPaymentProvider)
  paymentProvider!: CheckoutPaymentProvider;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CheckoutItemDto)
  items!: CheckoutItemDto[];
}

import { IsEmail, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

enum LeadStageDto {
  NEW = 'NEW',
  CONTACTED = 'CONTACTED',
  QUOTED = 'QUOTED',
  CLOSED_WON = 'CLOSED_WON',
  CLOSED_LOST = 'CLOSED_LOST',
}

enum LeadChannelDto {
  WEB_FORM = 'WEB_FORM',
  WHATSAPP = 'WHATSAPP',
  INSTAGRAM = 'INSTAGRAM',
  FACEBOOK = 'FACEBOOK',
  EMAIL = 'EMAIL',
  WEB_CHAT = 'WEB_CHAT',
  PHONE = 'PHONE',
  MANUAL = 'MANUAL',
}

export class CreateLeadDto {
  @IsString()
  source!: string;

  @IsEnum(LeadChannelDto)
  channel!: LeadChannelDto;

  @IsString()
  contactName!: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsNumber()
  score?: number;
}

export class UpdateLeadStageDto {
  @IsEnum(LeadStageDto)
  stage!: LeadStageDto;

  @IsOptional()
  @IsString()
  lostReason?: string;
}

export class CreateQuoteDto {
  @IsString()
  leadId!: string;

  @IsNumber()
  subtotal!: number;

  @IsOptional()
  @IsNumber()
  tax?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  itemsSnapshot!: unknown;
}


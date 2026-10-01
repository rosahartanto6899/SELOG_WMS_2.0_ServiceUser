import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  IsUUID,
  IsBoolean,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateWarehouseDto {
  @IsUUID('4', { message: 'customer id must be a valid UUID' })
  @IsNotEmpty()
  customerId: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsNotEmpty()
  @MaxLength(50)
  @IsString()
  code: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsNotEmpty()
  @MaxLength(75)
  @IsString()
  name: string;

  @IsOptional()
  @MaxLength(200)
  @IsString()
  address?: string;

  @IsOptional()
  @MaxLength(50)
  @IsString()
  phone?: string;
}

export class UpdateWarehouseDto {
  @IsOptional()
  @IsUUID('4', { message: 'customer id must be a valid UUID' })
  customerId?: string;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(50)
  code?: string;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(75)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;

  /** Toggle stop transaction — true = blokir binning & picking (guard
   *  ServiceIncoming/ServiceOutgoing). Dipakai halaman Stock Adjustment. */
  @IsOptional()
  @IsBoolean()
  stopTransaction?: boolean;
}

export class WarehouseCodeParamDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  code: string;
}

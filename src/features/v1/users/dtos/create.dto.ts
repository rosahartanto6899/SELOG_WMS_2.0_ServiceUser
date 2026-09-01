import {
  IsEmail,
  IsBoolean,
  IsArray,
  ValidateNested,
  IsNotEmpty,
  Contains,
  IsUUID,
  Matches,
  IsOptional,
  MaxLength,
  ArrayMinSize,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
/**
 * @swagger
 * components:
 *   schemas:
 *     RoleDto:
 *       type: object
 *       required:
 *         - id
 *         - branches
 *       properties:
 *         id:
 *           oneOf:
 *             - type: integer
 *             - type: string
 *           description: Role ID (can be a number or a string)
 *         branches:
 *           type: array
 *           items:
 *             type: string
 *           description: List of branches associated with the role
 *     CreateDtoUser:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - isActive
 *         - roles
 *       properties:
 *         name:
 *           type: string
 *           description: User's name
 *         email:
 *           type: string
 *           format: email
 *           description: User's email (must be unique)
 *         phone:
 *           type: string
 *           description: User's phone number  (must be unique) or null
 *         nrp:
 *           type: string
 *           description: User's NRP (must be unique)
 *         isActive:
 *           type: boolean
 *           description: Whether the user is active
 *         roles:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/RoleDto'
 *           description: List of roles assigned to the user
 */

class AccessDto {
  @IsUUID('4', { message: 'customer id must be a valid UUID' })
  @IsNotEmpty({ message: 'customer id cannot be empty' })
  customerId: string;

  @IsArray({ message: 'warehouses must be an array' })
  @IsUUID('4', { each: true, message: 'each warehouse must be a valid UUID' })
  warehouses: string[];
}

class RoleDto {
  @IsUUID('4', { message: 'role id must be a valid UUID' })
  @IsNotEmpty({ message: 'role id cannot be empty' })
  id: string;

  @IsArray({ message: 'accesses must be an array' })
  @ArrayMinSize(1, { message: 'at least one customer access is required' })
  @ValidateNested({ each: true })
  @Type(() => AccessDto)
  accesses: AccessDto[];
}

export class CreateDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @MaxLength(100, {
    message: 'Name must be at most 50 characters long',
  })
  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  @IsEmail()
  @Contains('@trac.astra.co.id', {
    message: 'Email must be a trac.astra.co.id domain',
  })
  @MaxLength(100, {
    message: 'Email must be at most 100 characters long',
  })
  email: string;

  @IsOptional()
  @Matches(/^62\d{8,13}$/, {
    message: 'Phone number must start with 62 and be 10-15 digits long',
  })
  @MaxLength(15, {
    message: 'Phone number must be at most 15 characters long',
  })
  phone?: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @Matches(/^\d+$/, {
    message: 'NRP must be numeric',
  })
  @MaxLength(10, {
    message: 'NRP must be at most 10 characters long',
  })
  @IsNotEmpty()
  nrp: string;

  @IsNotEmpty()
  @IsBoolean()
  isActive: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RoleDto)
  roles: RoleDto[];
}

import {
  IsBoolean,
  IsArray,
  ValidateNested,
  IsNotEmpty,
  IsUUID,
  IsOptional,
  Matches,
  IsEmail,
  Contains,
  MaxLength,
  ArrayMinSize,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

/**
 * @swagger
 * components:
 *   schemas:
 *     RolesDto:
 *       type: object
 *       required:
 *         - id
 *         - branches
 *       properties:
 *         id:
 *           oneOf:
 *             - type: number
 *             - type: string
 *           description: Role ID (can be a number or a string)
 *         branches:
 *           type: array
 *           items:
 *             type: string
 *           description: List of branch names associated with the role
 *     UpdateDtoUser:
 *       type: object
 *       required:
 *         - name
 *         - phone
 *         - isActive
 *         - roles
 *         - nrp
 *       properties:
 *         name:
 *           type: string
 *           description: User's full name
 *         phone:
 *           type: string
 *           description: User's phone number
 *         isActive:
 *           type: boolean
 *           description: Whether the user is active or not
 *         roles:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/RolesDto'
 *           description: List of roles assigned to the user
 *         nrp:
 *           type: string
 *           description: User's NRP (must be unique)
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

export class UpdateDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsNotEmpty({ message: 'name cannot be empty' })
  @MaxLength(100, { message: 'name must be at most 100 characters long' })
  name: string;

  @IsOptional()
  @Matches(/^62\d{8,13}$/, {
    message: 'Phone number must start with 62 and be 10–15 digits long',
  })
  @MaxLength(15, { message: 'Phone number must be at most 15 characters long' })
  phone?: string;

  @IsNotEmpty()
  @IsEmail()
  @Contains('@trac.astra.co.id', {
    message: 'Email must be a trac.astra.co.id domain',
  })
  @MaxLength(100, { message: 'email must be at most 100 characters long' })
  email: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @Matches(/^\d+$/, {
    message: 'NRP must be numeric',
  })
  @MaxLength(10, {
    message: 'NRP must be at most 10 characters long',
  })
  @IsNotEmpty({ message: 'NRP cannot be empty' })
  nrp: string;

  @IsNotEmpty({ message: 'isActive cannot be empty' })
  @IsBoolean({ message: 'isActive must be a boolean' })
  isActive: boolean;

  @IsArray({ message: 'roles must be an array' })
  @ValidateNested({ each: true })
  @Type(() => RoleDto)
  roles: RoleDto[];
}

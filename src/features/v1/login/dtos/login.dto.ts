import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

/**
 * @swagger
 * components:
 *   schemas:
 *     ByProviderDto:
 *       type: object
 *       properties:
 *         token:
 *           type: string
 *           description: Provider's authentication token
 *           example: "eyJhbGciOiJIUzI1NiIsInR..."
 *         role:
 *           type: string
 *           description: Optional user role
 *           example: "admin"
 *           nullable: true
 *         provider:
 *           type: string
 *           description: Authentication provider
 *           example: "azure-ad"
 *     SwitchRoleDto:
 *       type: object
 *       properties:
 *         roleId:
 *           type: string
 *           description: ID of the role to switch to
 *           example: "role_123"
 */

export class ByProviderDto {
  @IsNotEmpty()
  token: string;

  @IsNotEmpty()
  provider: string;
}

export class LocalLoginDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  password: string;

  @IsOptional()
  @IsString()
  provider?: string;
}

export class SwitchRoleDto {
  @IsString()
  @IsNotEmpty()
  roleId: string;
}

export class SwitchCustomerDto {
  @IsString()
  @IsNotEmpty()
  customerId: string;
}

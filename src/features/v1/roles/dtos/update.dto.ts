import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator';

/**
 * @swagger
 * components:
 *   schemas:
 *     UpdateDtoRoles:
 *       type: object
 *       required:
 *         - roleName
 *       properties:
 *         roleName:
 *           type: string
 *           description: Unique role name (only letters and spaces allowed)
 *           example: "Moderator"
 */

export class UpdateDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsNotEmpty()
  @Matches(/^[A-Za-z\s]+$/, {
    message: 'Only letters and spaces are allowed',
  })
  @MaxLength(50, { message: 'roleName must be at most 50 characters long' })
  @IsString()
  roleName: string;
}

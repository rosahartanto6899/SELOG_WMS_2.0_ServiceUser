import { IsNotEmpty, IsUUID } from 'class-validator';
/**
 * @swagger
 * components:
 *   schemas:
 *     GetByRoleDtoUser:
 *       type: object
 *       required:
 *         - roleId
 *       properties:
 *         roleId:
 *           type: string
 *           example: "00000000-0000-0000-0000-000000000000"
 *           description: "ID of the role"
 */
export class GetByRoleDto {
  @IsNotEmpty()
  @IsUUID('4')
  roleId: string;
}

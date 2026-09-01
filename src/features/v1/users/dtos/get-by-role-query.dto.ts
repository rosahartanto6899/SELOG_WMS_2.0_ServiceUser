import { IsOptional, IsUUID } from 'class-validator';
/**
 * @swagger
 * components:
 *   schemas:
 *     GetByRoleQueryDtoUser:
 *       type: object
 *       properties:
 *         branchId:
 *           type: string
 *           example: "00000000-0000-0000-0000-000000000000"
 *           description: "Optional branch ID to filter users"
 */
export class GetByRoleQueryDto {
  @IsOptional()
  @IsUUID('4')
  branchId?: string;
}

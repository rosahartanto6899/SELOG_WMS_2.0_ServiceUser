import { IsNotEmpty, IsUUID } from 'class-validator';
/**
 * @swagger
 * components:
 *   schemas:
 *     GetByRoleIdsDto:
 *       type: object
 *       required:
 *         - ids
 *       properties:
 *         ids:
 *           type: array
 *           items:
 *             type: string
 */
export class GetByRoleIdsDto {
  @IsNotEmpty()
  @IsUUID('4', { each: true })
  ids: string[];
}

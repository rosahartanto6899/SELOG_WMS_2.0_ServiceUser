import { IsNotEmpty, IsUUID } from 'class-validator';
/**
 * @swagger
 * components:
 *   schemas:
 *     GetByIdsDto:
 *       type: object
 *       required:
 *         - ids
 *       properties:
 *         ids:
 *           type: array
 *           items:
 *             type: string
 */
export class GetByIdsDto {
  @IsNotEmpty()
  @IsUUID('4', { each: true })
  ids: string[];
}

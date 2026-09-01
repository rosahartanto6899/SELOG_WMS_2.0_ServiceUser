import { IsNotEmpty, IsUUID } from 'class-validator';
/**
 * @swagger
 * components:
 *   schemas:
 *     DetailDtoUser:
 *       type: object
 *       required:
 *         - id
 *       properties:
 *         id:
 *           type: string
 *           example: "00000000-0000-0000-0000-000000000000"
 *           description: "ID of the user"
 */
export class DetailDto {
  @IsNotEmpty()
  @IsUUID('4')
  id: string;
}

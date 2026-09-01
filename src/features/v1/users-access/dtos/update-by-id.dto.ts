import { IsIn, IsNotEmpty, IsNumber } from 'class-validator';

/**
 * @swagger
 * components:
 *   schemas:
 *     UpdateByIdDto:
 *       type: object
 *       required:
 *         - isRead
 *         - isCreate
 *         - isUpdate
 *         - isDelete
 *       properties:
 *         isRead:
 *           type: integer
 *           enum: [0, 1]
 *           description: Indicates whether read permission is granted (0 = no, 1 = yes)
 *         isCreate:
 *           type: integer
 *           enum: [0, 1]
 *           description: Indicates whether create permission is granted (0 = no, 1 = yes)
 *         isUpdate:
 *           type: integer
 *           enum: [0, 1]
 *           description: Indicates whether update permission is granted (0 = no, 1 = yes)
 *         isDelete:
 *           type: integer
 *           enum: [0, 1]
 *           description: Indicates whether delete permission is granted (0 = no, 1 = yes)
 *       example:
 *         isRead: 1
 *         isCreate: 0
 *         isUpdate: 1
 *         isDelete: 0
 */

export class UpdateByIdDto {
  @IsNotEmpty()
  @IsNumber()
  @IsIn([0, 1], { message: 'isRead must be either 0 or 1' })
  isRead: number;

  @IsNotEmpty()
  @IsNumber()
  @IsIn([0, 1], { message: 'isCreate must be either 0 or 1' })
  isCreate: number;

  @IsNotEmpty()
  @IsNumber()
  @IsIn([0, 1], { message: 'isUpdate must be either 0 or 1' })
  isUpdate: number;

  @IsNotEmpty()
  @IsNumber()
  @IsIn([0, 1], { message: 'isDelete must be either 0 or 1' })
  isDelete: number;
}

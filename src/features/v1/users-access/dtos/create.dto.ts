import { IsIn, IsNotEmpty, IsNumber, IsUUID } from 'class-validator';

/**
 * @swagger
 * components:
 *   schemas:
 *     CreatePermissionDto:
 *       type: object
 *       required:
 *         - isRead
 *         - isCreate
 *         - isUpdate
 *         - isDelete
 *         - menuId
 *         - roleId
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
 *         menuId:
 *           type: string
 *           format: uuid
 *           description: The ID of the menu to which the permissions apply
 *         roleId:
 *           type: string
 *           format: uuid
 *           description: The ID of the role to which the permissions apply
 *       example:
 *         isRead: 1
 *         isCreate: 0
 *         isUpdate: 1
 *         isDelete: 0
 *         menuId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *         roleId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 */

export class CreatePermissionDto {
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

  @IsNotEmpty()
  @IsUUID('4')
  menuId: string;

  @IsNotEmpty()
  @IsUUID('4')
  roleId: string;
}

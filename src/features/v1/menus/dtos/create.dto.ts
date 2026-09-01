import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  Matches,
  MaxLength,
} from 'class-validator';
/**
 * @swagger
 * components:
 *   schemas:
 *     CreateDtoMenu:
 *       type: object
 *       required:
 *         - menuName
 *         - menuLink
 *       properties:
 *         menuName:
 *           type: string
 *           example: "Dashboard"
 *           description: "Name of the menu"
 *         isTab:
 *           type: boolean
 *           example: false
 *           description: "Indicates if the menu shows as a tab or side menu"
 *         menuCode:
 *           type: string
 *           example: "DASHBOARD"
 *           description: "Code of the menu (optional)"
 *         menuOrder:
 *           type: integer
 *           example: 1
 *           description: "Order of the menu (optional)"
 *         menuLink:
 *           type: string
 *           example: "/dashboard"
 *           description: "Link to the menu"
 *         menuIcon:
 *           type: string
 *           example: "dashboard-icon"
 *           description: "Icon for the menu (optional)"
 *         parentId:
 *           type: string
 *           example: "123456"
 *           description: "Parent menu ID (if applicable)"
 */
export class CreateDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsNotEmpty()
  @MaxLength(50)
  @Matches(/^[A-Za-z\s]+$/, {
    message: 'Only letters and spaces are allowed',
  })
  menuName: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsNotEmpty()
  @MaxLength(50)
  @Matches(/^\/[A-Za-z0-9\-#_/]*$/, {
    message:
      'menuLink must start with a forward slash (/) and contain only letters, numbers, hyphens, hashes, underscores, and forward slashes',
  })
  menuLink: string;

  @IsOptional()
  @MaxLength(50)
  menuIcon: string;

  @IsOptional()
  @IsBoolean()
  isTab: boolean;

  @IsOptional()
  @MaxLength(50)
  menuCode: string;

  @IsOptional()
  @IsNumber()
  menuOrder: number;

  @IsOptional()
  parentId: string;
}

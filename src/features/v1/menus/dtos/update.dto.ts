import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  Matches,
} from 'class-validator';
/**
 * @swagger
 * components:
 *   schemas:
 *     UpdateDtoMenu:
 *       type: object
 *       required:
 *         - menuName
 *         - menuLink
 *       properties:
 *         menuName:
 *           type: string
 *           example: "Settings"
 *           description: "Updated name of the menu"
 *         menuLink:
 *           type: string
 *           example: "/settings"
 *           description: "Updated link to the menu"
 *         menuCode:
 *           type: string
 *           example: "SETTINGS"
 *           description: "Updated code of the menu (optional)"
 *         isTab:
 *           type: boolean
 *           example: true
 *           description: "Indicates if the menu shows as a tab or side menu"
 *         menuOrder:
 *           type: integer
 *           example: 2
 *           description: "Updated order of the menu (optional)"
 *         menuIcon:
 *           type: string
 *           example: "settings-icon"
 *           description: "Updated icon for the menu (optional)"
 *         parentId:
 *           type: string
 *           example: "654321"
 *           description: "Updated parent menu ID (if applicable)"
 */

export class UpdateDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsNotEmpty()
  @Matches(/^[A-Za-z\s]+$/, {
    message: 'Only letters and spaces are allowed',
  })
  menuName: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsNotEmpty()
  @Matches(/^\/[A-Za-z0-9\-#_/]*$/, {
    message:
      'menuLink must start with a forward slash (/) and contain only letters, numbers, hyphens, hashes, underscores, and forward slashes',
  })
  menuLink: string;

  @IsOptional()
  menuIcon: string;

  @IsOptional()
  @IsNumber()
  menuOrder: number;

  @IsOptional()
  @IsBoolean()
  isTab: boolean;

  @IsOptional()
  parentId: string;
}

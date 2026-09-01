import { Transform } from 'class-transformer';
import {
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsUUID,
  ValidateIf,
} from 'class-validator';

/**
 * @swagger
 * components:
 *   schemas:
 *     ListDto:
 *       type: object
 *       required:
 *         - order
 *         - sort
 *         - page
 *         - limit
 *         - roleId
 *       properties:
 *         order:
 *           type: string
 *           enum: [menuName, createdAt, updatedAt]
 *         sort:
 *           type: string
 *           enum: [asc, desc]
 *         page:
 *           type: integer
 *           minimum: 1
 *         limit:
 *           type: integer
 *           minimum: 1
 *         searchBy:
 *           type: string
 *           enum: [menu]
 *         search:
 *           type: string
 *           description: Search term
 *           example: "dashboard"
 *         roleId:
 *           type: string
 *           format: uuid
 */

export class ListDto {
  @IsOptional()
  @IsIn(['menu', 'createdAt', 'updatedAt'])
  order: string;

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sort: 'asc' | 'desc';

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  page: number;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  limit: number;

  @IsOptional()
  @ValidateIf(
    (o) => o.searchBy !== '' && o.searchBy !== undefined && o.searchBy !== null
  )
  @IsIn(['menu'])
  searchBy: string;

  @IsOptional()
  search: string;

  @IsNotEmpty()
  @IsUUID()
  roleId: string;
}

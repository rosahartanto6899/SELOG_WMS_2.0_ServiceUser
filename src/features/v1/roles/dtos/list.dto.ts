import { Transform } from 'class-transformer';
import { IsIn, IsNumber, IsOptional, ValidateIf } from 'class-validator';

/**
 * @swagger
 * components:
 *   schemas:
 *     ListDtoRole:
 *       type: object
 *       required:
 *         - order
 *         - sort
 *         - page
 *         - limit
 *       properties:
 *         order:
 *           type: string
 *           enum: [roleName, createdAt, updatedAt]
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
 *           enum: [roleName]
 *         search:
 *           type: string
 *           description: Search term
 *           example: "admin"
 */

export class ListDto {
  @IsOptional()
  @IsIn(['roleName', 'createdAt', 'updatedAt'])
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
  @IsIn(['roleName'])
  searchBy: string;

  @IsOptional()
  search: string;
}

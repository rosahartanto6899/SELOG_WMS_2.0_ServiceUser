import { IsUUID } from 'class-validator';

export class DetailDto {
  @IsUUID('4', { message: 'id must be a valid UUID' })
  id: string;
}

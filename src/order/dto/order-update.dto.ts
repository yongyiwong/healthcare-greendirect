import { IsOptional, IsString } from 'class-validator';

export class OrderUpdateDto {
  @IsOptional()
  @IsString()
  userNotes: string;
}

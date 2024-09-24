import { IsOptional, IsString } from 'class-validator';

export class UpdateMessageDto {
  @IsOptional()
  @IsString()
  message: string;

  @IsOptional()
  attachment?: string;
}

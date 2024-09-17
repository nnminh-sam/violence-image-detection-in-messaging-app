import { IsOptional, IsString } from 'class-validator';

export class UpdateConversationHistoryDto {
  @IsOptional()
  @IsString()
  message: string;

  @IsOptional()
  attachment?: string;
}

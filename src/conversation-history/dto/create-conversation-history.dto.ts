import { IsMongoId, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateConversationHistoryDto {
  @IsNotEmpty()
  @IsMongoId()
  sendBy: string;

  @IsNotEmpty()
  @IsMongoId()
  conversation: string;

  @IsNotEmpty()
  @IsString()
  message: string;

  @IsOptional()
  attachment?: string;
}

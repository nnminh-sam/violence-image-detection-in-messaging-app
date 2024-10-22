import { IsMongoId, IsNotEmpty, IsString } from 'class-validator';

export class CreateMessageDto {
  @IsNotEmpty()
  @IsMongoId()
  sendBy: string;

  @IsNotEmpty()
  @IsMongoId()
  conversation: string;

  @IsNotEmpty()
  @IsString()
  message: string;
}

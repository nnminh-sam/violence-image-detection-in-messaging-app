import {
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsString,
  Length,
} from 'class-validator';
import { ConversationType } from '../entities/conversation-type.enum';

export class CreateConversationDto {
  @IsNotEmpty()
  @IsString()
  @Length(3, 256, {
    message: 'Conversation name length must be from 3 to 256 characters',
  })
  name: string;

  @IsNotEmpty()
  @IsString()
  @Length(3, 256, {
    message: 'Description length must be from 3 to 256 characters',
  })
  description: string;

  @IsNotEmpty()
  @IsMongoId()
  createdBy: string;

  @IsNotEmpty()
  @IsMongoId()
  host: string;

  @IsEnum(ConversationType)
  type: string;
}

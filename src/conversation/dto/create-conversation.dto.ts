import {
  IsMongoId,
  IsNotEmpty,
  IsNotEmptyObject,
  IsString,
  Length,
} from 'class-validator';

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
  hostId: string;
}

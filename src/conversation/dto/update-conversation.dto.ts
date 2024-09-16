import { IsMongoId, IsString, Length } from 'class-validator';

export class UpdateConversationDto {
  @IsString()
  @Length(3, 256, {
    message: 'Conversation name length must be from 3 to 256 characters',
  })
  name: string;

  @IsString()
  @Length(3, 256, {
    message: 'Description length must be from 3 to 256 characters',
  })
  description: string;

  @IsMongoId()
  hostId: string;
}

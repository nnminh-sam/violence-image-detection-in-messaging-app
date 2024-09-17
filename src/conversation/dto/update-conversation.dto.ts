import { IsMongoId, IsOptional, IsString, Length } from 'class-validator';

export class UpdateConversationDto {
  @IsOptional()
  @IsString()
  @Length(3, 256, {
    message: 'Conversation name length must be from 3 to 256 characters',
  })
  name: string;

  @IsOptional()
  @IsString()
  @Length(3, 256, {
    message: 'Description length must be from 3 to 256 characters',
  })
  description: string;

  @IsOptional()
  @IsMongoId()
  hostId: string;
}

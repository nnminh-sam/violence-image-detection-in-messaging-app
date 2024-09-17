import { IsEnum, IsMongoId, IsNotEmpty } from 'class-validator';
import { ConversationMemberRole } from '../entities/conversation-member-role.enum';

export class CreateConversationMemberDto {
  @IsNotEmpty()
  @IsMongoId()
  user: string;

  @IsNotEmpty()
  @IsMongoId()
  conversation: string;

  @IsNotEmpty()
  @IsEnum(ConversationMemberRole)
  role: ConversationMemberRole;
}

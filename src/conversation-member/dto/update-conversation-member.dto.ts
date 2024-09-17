import { IsEnum, IsOptional } from 'class-validator';
import { ConversationMemberRole } from '../entities/conversation-member-role.enum';
import { ConversationMemberStatus } from '../entities/conversation-member-status.enum';

export class UpdateConversationMemberDto {
  @IsOptional()
  @IsEnum(ConversationMemberRole)
  role: ConversationMemberRole;

  @IsOptional()
  @IsEnum(ConversationMemberStatus)
  status: ConversationMemberStatus;
}

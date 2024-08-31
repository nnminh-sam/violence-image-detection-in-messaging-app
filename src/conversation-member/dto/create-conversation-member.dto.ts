export class CreateConversationMemberDto {
  userId: string;

  conversationId: string;

  role: string;

  isActive: boolean;
}

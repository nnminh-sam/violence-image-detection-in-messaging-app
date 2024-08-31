export class CreateConversationHistoryDto {
  sendBy: string;

  conversationId: string;

  message: string;

  attachment?: string;
}

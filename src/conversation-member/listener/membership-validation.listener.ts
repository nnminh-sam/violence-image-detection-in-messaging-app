import { OnEvent } from '@nestjs/event-emitter';
import { ConversationMemberEvent } from '../entities/conversation-member-event.enum';
import { Injectable } from '@nestjs/common';
import { MembershipValidationEvent } from '../event/membership-validation.event';
import { ConversationMemberService } from '../conversation-member.service';
import { ConversationMemberDocument } from '../entities/conversation-member.entity';

@Injectable()
export class MembershipValidationListener {
  constructor(
    private readonly conversationMemberService: ConversationMemberService,
  ) {}

  @OnEvent(ConversationMemberEvent.FIND_BY_USER_AND_CONVERSATION)
  async handleMemberValidationEvent(
    event: MembershipValidationEvent,
  ): Promise<ConversationMemberDocument> {
    return await this.conversationMemberService.findByUserIdAndConversationId(
      event.userId,
      event.conversationId,
    );
  }
}

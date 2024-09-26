import { OnEvent } from '@nestjs/event-emitter';
import { MembershipEvent } from '../entities/membership-event.enum';
import { Injectable } from '@nestjs/common';
import { MembershipValidationEvent } from '../event/membership-validation.event';
import { MembershipService } from '../membership.service';
import { PopulatedMembership } from '../entities/membership.entity';

@Injectable()
export class MembershipValidationListener {
  constructor(private readonly MembershipService: MembershipService) {}

  @OnEvent(MembershipEvent.FIND_BY_USER_AND_CONVERSATION)
  async handleMemberValidationEvent(
    event: MembershipValidationEvent,
  ): Promise<PopulatedMembership> {
    return await this.MembershipService.findByUserIdAndConversationId(
      event.userId,
      event.conversationId,
    );
  }
}

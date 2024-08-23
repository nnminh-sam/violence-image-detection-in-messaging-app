import { OmitType } from '@nestjs/mapped-types';
import { Conversation } from '../entities/conversation.entity';

export class CreateConversationDto extends OmitType(Conversation, [
  'createdAt',
  'updatedAt',
  'deletedAt',
]) {}

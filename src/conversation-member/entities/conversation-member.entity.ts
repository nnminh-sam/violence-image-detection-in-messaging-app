import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ConversationMemberStatus } from './conversation-member-status.enum';
import { ConversationMemberRole } from './conversation-member-role.enum';

@Schema({ timestamps: true })
export class ConversationMember {
  @Prop({ required: true })
  user: string;

  @Prop({ required: true })
  conversation: string;

  @Prop({ required: true })
  role: ConversationMemberRole;

  @Prop({ default: null, nullable: true })
  status: ConversationMemberStatus;
}

export type ConversationMemberDocument = ConversationMember & Document;

export const ConversationMemberSchema =
  SchemaFactory.createForClass(ConversationMember);

ConversationMemberSchema.index({ user: 1, conversation: 1 }, { unique: true });

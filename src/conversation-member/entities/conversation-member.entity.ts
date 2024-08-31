import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class ConversationMember {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  conversationId: string;

  @Prop({ required: true })
  role: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: null, nullable: true })
  deletedAt: Date;
}

export type ConversationMemberDocument = ConversationMember & Document;

export const ConversationMemberSchema =
  SchemaFactory.createForClass(ConversationMember);

ConversationMemberSchema.index({ userId: 1, conversationId: 1 });

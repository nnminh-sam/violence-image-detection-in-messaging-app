import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class ConversationHistory {
  @Prop({ required: true, nullable: false })
  sendBy: string;

  @Prop({ required: true, nullable: false })
  conversationId: string;

  @Prop({ required: true, nullable: false })
  message: string;

  @Prop()
  attachment: string;

  @Prop({ default: null })
  deletedAt: Date;
}

export type ConversationHistoryDocument = ConversationHistory & Document;

export const ConversationHistorySchema =
  SchemaFactory.createForClass(ConversationHistory);

ConversationHistorySchema.index({ conversationId: 1, sendBy: 1 });

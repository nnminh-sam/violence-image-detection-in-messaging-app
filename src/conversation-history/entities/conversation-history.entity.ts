import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { ConversationDocument } from 'src/conversation/entities/conversation.entity';
import { UserDocument } from 'src/user/entities/user.entity';

@Schema({ timestamps: true })
export class ConversationHistory {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: true,
    nullable: false,
  })
  sendBy: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Conversation',
    required: true,
    nullable: false,
  })
  conversation: string;

  @Prop({ required: true, nullable: false })
  message: string;

  @Prop()
  attachment: string;

  @Prop({ default: null })
  deletedAt: Date;
}

export type ConversationHistoryDocument = ConversationHistory & Document;

export type PopulatedConversationHistoryDocument =
  ConversationHistoryDocument & {
    sendBy: UserDocument;
    conversation: ConversationDocument;
  };

export const ConversationHistorySchema =
  SchemaFactory.createForClass(ConversationHistory);

ConversationHistorySchema.index({ conversationId: 1, sendBy: 1 });

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Conversation } from 'src/conversation/entities/conversation.entity';
import { User } from 'src/user/entities/user.entity';

@Schema({ timestamps: true })
export class Message {
  id: string;

  @Prop({
    type: String,
    ref: User.name,
    required: true,
    nullable: false,
  })
  sendBy: string;

  @Prop({
    type: String,
    ref: Conversation.name,
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

export type MessageDocument = Message & Document;

export type PopulatedMessage = Message & {
  sendBy: User;
  conversation: Conversation;
};

export const MessageSchema = SchemaFactory.createForClass(Message);

MessageSchema.index({ conversationId: 1, sendBy: 1 });

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { User } from 'src/user/entities/user.entity';
import { ConversationType } from './conversation-type.enum';

@Schema({ timestamps: true })
export class Conversation {
  id: string;

  @Prop({ required: true, unique: true })
  name: string;

  @Prop({ required: true })
  description: string;

  @Prop({
    type: String,
    ref: User.name,
    required: true,
  })
  createdBy: string;

  @Prop({
    type: String,
    ref: User.name,
    required: true,
  })
  host: string;

  @Prop({ required: true, default: 'DIRECT' })
  type: ConversationType;

  @Prop({ default: null })
  deletedAt: Date;
}

export type ConversationDocument = Conversation & Document;

export type PopulatedConversation = Conversation & {
  createdBy: User;
  host: User;
};

export const ConversationSchema = SchemaFactory.createForClass(Conversation);

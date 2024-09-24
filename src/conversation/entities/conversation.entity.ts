import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Conversation {
  id: string;

  @Prop({ required: true, unique: true })
  name: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  createdBy: string;

  @Prop({ required: true })
  host: string;

  @Prop({ default: null })
  deletedAt: Date;
}

export type ConversationDocument = Conversation & Document;

export const ConversationSchema = SchemaFactory.createForClass(Conversation);

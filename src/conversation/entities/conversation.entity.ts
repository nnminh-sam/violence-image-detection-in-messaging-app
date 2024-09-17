import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Conversation {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  createdBy: string;

  @Prop({ required: true })
  host: string;

  @Prop({ required: true, default: new Date() })
  createdAt: Date;

  @Prop({ required: true, default: new Date() })
  updatedAt: Date;

  @Prop({ default: null })
  deletedAt: Date;
}

export type ConversationDocument = Conversation & Document;

export const ConversationSchema = SchemaFactory.createForClass(Conversation);

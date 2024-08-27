import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Relationship {
  @Prop({ required: true })
  firstUser: string;

  @Prop({ required: true })
  secondUser: string;

  @Prop({ required: true, default: new Date() })
  createdAt: Date;

  @Prop({ required: true, default: new Date() })
  updatedAt: Date;

  @Prop({ default: null })
  deletedAt: Date;
}

export type RelationshipDocument = Relationship & Document;

export const RelationshipSchema = SchemaFactory.createForClass(
  Relationship,
).index({ firstUser: 1, secondUser: 1 }, { unique: true });

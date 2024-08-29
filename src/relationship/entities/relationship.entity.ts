import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import RelationshipStatus from './Relationship.enum';

@Schema()
export class Relationship {
  @Prop({ required: true })
  userA: string;

  @Prop({ required: true })
  userB: string;

  @Prop({ required: true, enum: RelationshipStatus })
  status: RelationshipStatus;

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
).index({ userA: 1, userB: 1 }, { unique: true });

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import RelationshipStatus from './relationship.enum';

@Schema({ timestamps: true })
export class Relationship {
  id: string;

  @Prop({ required: true })
  userA: string;

  @Prop({ required: true })
  userB: string;

  @Prop({ required: true, enum: RelationshipStatus })
  status: RelationshipStatus;

  @Prop({ default: null })
  blockedAt: Date;
}

export type RelationshipDocument = Relationship & Document;

export const RelationshipSchema = SchemaFactory.createForClass(
  Relationship,
).index({ userA: 1, userB: 1 }, { unique: true });

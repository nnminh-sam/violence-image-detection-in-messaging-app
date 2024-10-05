import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import RelationshipStatus from './relationship-temp.enum';
import { User } from 'src/user/entities/user.entity';
import { Conversation } from 'src/conversation/entities/conversation.entity';

@Schema({ timestamps: true })
export class Relationship {
  id: string;

  @Prop({
    type: 'String',
    ref: User.name,
    required: true,
  })
  userA: string;

  @Prop({
    type: 'String',
    ref: User.name,
    required: true,
  })
  userB: string;

  @Prop({ required: true, enum: RelationshipStatus })
  status: RelationshipStatus;

  @Prop({
    type: 'String',
    ref: Conversation.name,
    required: false,
    default: null,
  })
  privateConversation: string;

  @Prop({ default: null })
  blockedAt: Date;
}

export type RelationshipDocument = Relationship & Document;

export type PopulatedRelationship = Relationship & {
  userA: User;
  userB: User;
};

export const RelationshipSchema = SchemaFactory.createForClass(
  Relationship,
).index({ userA: 1, userB: 1 }, { unique: true });

RelationshipSchema.index({ privateConversation: 1 }, { unique: true });

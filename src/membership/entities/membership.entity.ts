import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { MembershipStatus } from './membership-status.enum';
import { MembershipRole } from './membership-role.enum';
import { User } from 'src/user/entities/user.entity';
import { Conversation } from 'src/conversation/entities/conversation.entity';

@Schema({ timestamps: true })
export class Membership {
  id: string;

  @Prop({
    type: String,
    ref: User.name,
    required: true,
  })
  user: string;

  @Prop({
    type: String,
    ref: Conversation.name,
    required: true,
  })
  conversation: string;

  @Prop({ required: true })
  role: MembershipRole;

  @Prop({ default: null, nullable: true })
  status: MembershipStatus;

  @Prop({
    type: String,
    ref: User.name,
    required: false,
    default: null,
  })
  partner: string;

  @Prop({ default: null, nullable: true })
  bannedAt: Date;
}

export type MembershipDocument = Membership & Document;

export type PopulatedMembership = Membership & {
  user: User;
  conversation: Conversation;
  partner: User;
};

export const MembershipSchema = SchemaFactory.createForClass(Membership);

MembershipSchema.index({ user: 1, conversation: 1 }, { unique: true });

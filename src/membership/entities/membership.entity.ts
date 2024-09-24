import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { MembershipStatus } from './membership-status.enum';
import { MembershipRole } from './membership-role.enum';

@Schema({ timestamps: true })
export class Membership {
  id: string;

  @Prop({ required: true })
  user: string;

  @Prop({ required: true })
  conversation: string;

  @Prop({ required: true })
  role: MembershipRole;

  @Prop({ default: null, nullable: true })
  status: MembershipStatus;
}

export type MembershipDocument = Membership & Document;

export const MembershipSchema = SchemaFactory.createForClass(Membership);

MembershipSchema.index({ user: 1, conversation: 1 }, { unique: true });

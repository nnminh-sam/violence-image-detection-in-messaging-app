import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Gender } from './gender.enum';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class User {
  id: string;

  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true, unique: true })
  username: string;

  @Prop({ required: true })
  gender: Gender;

  @Prop({ required: true })
  dateOfBirth: Date;

  @Prop({ required: true })
  phone: string;

  @Prop({ default: null })
  deletedAt: Date;
}

export type UserDocument = User & Document;

export const UserSchema = SchemaFactory.createForClass(User);

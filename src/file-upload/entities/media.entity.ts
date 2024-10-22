import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { MediaStatus } from './media-status.enum';
import { User } from 'src/user/entities/user.entity';
import { Conversation } from 'src/conversation/entities/conversation.entity';

@Schema({ timestamps: true })
export class Media {
  id: string;

  @Prop({
    type: String,
    ref: User.name,
    required: true,
    nullable: false,
  })
  sender: string;

  @Prop({
    type: String,
    ref: Conversation.name,
    required: true,
    nullable: false,
  })
  conversation: string;

  @Prop({ required: true })
  filename: string;

  @Prop({ required: true })
  filePath: string;

  @Prop({ required: true })
  originalname: string;

  @Prop({ required: true })
  size: number;

  @Prop({ required: true })
  mimetype: string;

  @Prop({ required: true })
  status: MediaStatus;
}

export type MediaDocument = Media & Document;

export type PopulatedMedia = Media & {
  sender: User;
  conversation: Conversation;
};

export const MediaSchema = SchemaFactory.createForClass(Media);

MediaSchema.index(
  {
    user: 1,
    filename: 1,
    conversation: 1,
  },
  { unique: true },
);

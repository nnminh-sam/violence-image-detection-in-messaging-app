import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { MediaStatus } from './media-status.enum';

@Schema({ timestamps: true })
export class Media {
  id: string;

  @Prop({ required: true })
  user: string;

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

export const MediaSchema = SchemaFactory.createForClass(Media);

MediaSchema.index(
  {
    user: 1,
    filename: 1,
  },
  { unique: true },
);

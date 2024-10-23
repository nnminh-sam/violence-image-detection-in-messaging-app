import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { MongooseModule } from '@nestjs/mongoose';
import { Media, MediaSchema } from './entities/media.entity';
import { MembershipModule } from 'src/membership/membership.module';
import { MediaService } from './media.service';
import { MediaController } from './media.controller';
import { EventModule } from 'src/event/event.module';
import { MessageModule } from 'src/message/message.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Media.name,
        schema: MediaSchema,
        collection: 'media',
      },
    ]),
    MulterModule.register({ dest: './uploads' }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
    }),
    MembershipModule,
    EventModule,
    MessageModule,
  ],
  providers: [MediaService],
  controllers: [MediaController],
})
export class MediaModule {}
import { Module } from '@nestjs/common';
import { FileUploadService } from './file-upload.service';
import { FileUploadController } from './file-upload.controller';
import { MulterModule } from '@nestjs/platform-express';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

@Module({
  imports: [
    MulterModule.register({ dest: './uploads' }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
    }),
  ],
  providers: [FileUploadService],
  controllers: [FileUploadController],
})
export class FileUploadModule {}

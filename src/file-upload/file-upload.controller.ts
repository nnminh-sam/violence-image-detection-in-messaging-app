import {
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import * as dotenv from 'dotenv';
import { existsSync } from 'fs';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
dotenv.config();

const envVar = process.env;
const API_URL = `${envVar.API_PREFIX}/${envVar.API_VERSION}/uploads`;
const MAX_FILE_SIZE = 50 * 1024 * 1024;
const allowedFileExtensions = ['.jpeg', '.png', '.mp4', '.mov'];

@Controller(API_URL)
export class FileUploadController {
  @Get(':filename')
  getFile(@Param('filename') filename: string, @Res() res: Response) {
    const filePath = join(__dirname, '..', '..', 'uploads', filename);

    if (!existsSync(filePath)) {
      throw new NotFoundException('File not found');
    }

    return res.sendFile(filePath);
  }

  @Post('single')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
      limits: { fileSize: MAX_FILE_SIZE },
      fileFilter: (req, file, cb) => {
        const fileExt = extname(file.originalname).toLowerCase();
        if (!allowedFileExtensions.includes(fileExt)) {
          return cb(
            new BadRequestException(
              `Invalid file type. Only ${allowedFileExtensions.join(', ')} are allowed.`,
            ),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  async uploadSingleFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('File upload failed.');
    }
    console.log('file:', file);
    return {
      message: 'File uploaded successfully!',
      fileName: file.filename,
    };
  }
}

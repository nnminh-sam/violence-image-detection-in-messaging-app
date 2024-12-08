import {
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import * as dotenv from 'dotenv';
import { RequestedUser } from 'src/decorator/requested-user.decorator';
import { JwtGuard } from 'src/auth/guards/jwt.guard';
import { MediaService } from './media.service';
import { PopulatedMedia } from './entities/media.entity';
import { MediaStatus } from './entities/media-status.enum';
import * as multer from 'multer';
import { extname } from 'path';
dotenv.config();

const envVar = process.env;
const API_URL = `${envVar.API_PREFIX}/${envVar.API_VERSION}/media`;
const MAX_FILE_SIZE = 50 * 1024 * 1024;
const allowedFileExtensions = ['.jpg', '.jpeg', '.png', '.mp4', '.mov'];

@Controller(API_URL)
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Get('stream')
  async streamFileById(@Query('id') id: string, @Res() res: Response) {
    return this.mediaService.streamMedia(id, res);
  }

  @Get('sent')
  @UseGuards(JwtGuard)
  async getAllUserSentMedia(
    @RequestedUser() user: any,
    @Query('page') page: number,
    @Query('size') size: number,
    @Query('sortBy') sortBy: string,
    @Query('orderBy') orderBy: 'asc' | 'desc',
    @Query('status') status: MediaStatus,
    @Query('room') room: string,
  ) {
    return this.mediaService.findAllUserSentMedia(
      user.id,
      {
        page: page || 1,
        size: size || 10,
        sortBy: sortBy || 'id',
        orderBy: orderBy || 'asc',
      },
      status,
      room,
    );
  }

  @Get('/:room')
  @UseGuards(JwtGuard)
  async getMediaInRoomById(
    @RequestedUser() user: any,
    @Query('id') id: string,
    @Param('room') room: string,
  ) {
    const media: PopulatedMedia =
      await this.mediaService.getMediaInConversationById(user.id, room, id);
    if (!media) {
      throw new NotFoundException('File not found');
    }
    return media;
  }

  @Post('single/:room')
  @UseGuards(JwtGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: multer.diskStorage({
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
  async uploadSingleFile(
    @RequestedUser() user: any,
    @Param('room') room: string,
    @UploadedFile()
    file: Express.Multer.File,
  ) {
    return this.mediaService.create(user.id, room, file);
  }

  @Patch('approve/:id')
  @UseGuards(JwtGuard)
  async approveMedia(@RequestedUser() user: any, @Param('id') id: string) {
    return this.mediaService.approveMedia(user.id, id);
  }

  @Patch('reject/:id')
  @UseGuards(JwtGuard)
  async rejectMedia(@RequestedUser() user: any, @Param('id') id: string) {
    return this.mediaService.rejectMedia(user.id, id);
  }
}

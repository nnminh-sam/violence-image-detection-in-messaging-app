import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { Model } from 'mongoose';
import { Media, MediaDocument, PopulatedMedia } from './entities/media.entity';
import { InjectModel } from '@nestjs/mongoose';
import { MediaStatus } from './entities/media-status.enum';
import { MongooseDocumentTransformer } from 'src/helper/mongoose/document-transformer';
import { existsSync } from 'fs';
import { join } from 'path';

@Injectable()
export class FileUploadService {
  private logger: Logger = new Logger(FileUploadService.name);

  constructor(
    @InjectModel(Media.name)
    private mediaModel: Model<Media>,
  ) {}

  private getFileAbsolutePath(filename: string) {
    return join(__dirname, '..', '..', 'uploads', filename);
  }

  private checkFileExist(filename: string) {
    const filePath = this.getFileAbsolutePath(filename);
    return existsSync(filePath);
  }

  async findById(id: string) {
    const data = (await this.mediaModel
      .findOne({ _id: id })
      .populate({
        path: 'user',
        select: '-__v -password -deletedAt',
        transform: MongooseDocumentTransformer,
      })
      .transform(MongooseDocumentTransformer)
      .select({ __v: 0 })
      .exec()) as PopulatedMedia;

    if (this.checkFileExist(data.filename)) {
      return data;
    }
  }

  async findByFilename(filename: string) {
    const data = (await this.mediaModel
      .findOne({ filename })
      .populate({
        path: 'user',
        select: '-__v -password -deletedAt',
        transform: MongooseDocumentTransformer,
      })
      .transform(MongooseDocumentTransformer)
      .select({ __v: 0 })
      .exec()) as PopulatedMedia;

    if (this.checkFileExist(filename)) {
      return data;
    }
  }

  async findAll() {
    const data = (await this.mediaModel
      .find()
      .populate({
        path: 'user',
        select: '-__v -password -deletedAt',
        transform: MongooseDocumentTransformer,
      })
      .transform((doc: any) => doc.map(MongooseDocumentTransformer))
      .select({ __v: 0 })
      .exec()) as PopulatedMedia[];

    return data.filter((item: Media) => this.checkFileExist(item.filename));
  }

  async uploadFile(requestUserId: string, file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('File upload failed.');
    }

    try {
      const data: any = await new this.mediaModel({
        user: requestUserId,
        originalname: file.originalname,
        filename: file.filename,
        filePath: this.getFileAbsolutePath(file.filename),
        size: file.size,
        mimetype: file.mimetype,
        status: MediaStatus.APPROVED,
      }).save();

      return await this.findById(data._id);
    } catch (error: any) {
      this.logger.fatal(error);
      throw new InternalServerErrorException('Failed to upload file', error);
    }
  }
}

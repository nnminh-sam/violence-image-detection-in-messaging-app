import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Model } from 'mongoose';
import { Media, PopulatedMedia } from './entities/media.entity';
import { InjectModel } from '@nestjs/mongoose';
import { MediaStatus } from './entities/media-status.enum';
import { MongooseDocumentTransformer } from 'src/helper/mongoose/document-transformer';
import { existsSync } from 'fs';
import { join } from 'path';
import { MembershipService } from 'src/membership/membership.service';
import { EventGateway } from '../event/event.gateway';

@Injectable()
export class MediaService {
  private logger: Logger = new Logger(MediaService.name);

  constructor(
    @InjectModel(Media.name)
    private mediaModel: Model<Media>,
    private readonly membershipService: MembershipService,
    private readonly eventGateway: EventGateway,
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
        path: 'sender',
        select: '-__v -password -deletedAt',
        transform: MongooseDocumentTransformer,
      })
      .populate({
        path: 'conversation',
        select: '-__v -deletedAt',
        transform: MongooseDocumentTransformer,
      })
      .transform(MongooseDocumentTransformer)
      .select({ __v: 0 })
      .exec()) as PopulatedMedia;

    if (this.checkFileExist(data.filename)) {
      return data;
    }
  }

  async getMediaInConversationById(
    requestUserId: string,
    conversationId: string,
    mediaId: string,
  ) {
    const requestUserMembership =
      await this.membershipService.findByUserIdAndConversationId(
        requestUserId,
        conversationId,
      );
    if (!requestUserMembership)
      throw new UnauthorizedException(
        'User is not a member of the conversation',
      );

    const media = await this.findById(mediaId);
    if (!media) throw new NotFoundException('File not found');

    return media;
  }

  async streamMedia(
    requestUserId: string,
    conversationId: string,
    mediaId: string,
    httpResponse: any,
  ) {
    const media: PopulatedMedia = await this.findById(mediaId);
    if (!media) throw new NotFoundException('File not found');

    const requestUserMembership =
      await this.membershipService.findByUserIdAndConversationId(
        requestUserId,
        conversationId,
      );
    if (!requestUserMembership)
      throw new UnauthorizedException(
        'User is not a member of the conversation',
      );

    return httpResponse.sendFile(media.filePath);
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

  async uploadFile(
    requestUserId: string,
    room: string,
    file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('File upload failed.');
    }

    const requestUserMembership =
      await this.membershipService.findByUserIdAndConversationId(
        requestUserId,
        room,
      );
    if (!requestUserMembership)
      throw new UnauthorizedException(
        'User is not a member of the conversation',
      );

    try {
      const data: any = await new this.mediaModel({
        sender: requestUserId,
        conversation: room,
        originalname: file.originalname,
        filename: file.filename,
        filePath: this.getFileAbsolutePath(file.filename),
        size: file.size,
        mimetype: file.mimetype,
        status: MediaStatus.APPROVED,
      }).save();

      const response = await this.findById(data._id);
      this.eventGateway.notifyNewMedia({ media: response });
      return response;
    } catch (error: any) {
      this.logger.fatal(error);
      throw new InternalServerErrorException('Failed to upload file', error);
    }
  }
}

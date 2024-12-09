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
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { MembershipService } from 'src/membership/membership.service';
import { EventGateway } from '../event/event.gateway';
import { MessageService } from 'src/message/message.service';
import { Conversation } from 'src/conversation/entities/conversation.entity';
import { PaginationDto } from 'src/helper/types/pagination.dto';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import * as dotenv from 'dotenv';
import * as FormData from 'form-data';
import { Cron } from '@nestjs/schedule';
dotenv.config();

@Injectable()
export class MediaService {
  private logger: Logger = new Logger(MediaService.name);
  private predictServerAvailability: boolean;

  constructor(
    @InjectModel(Media.name)
    private mediaModel: Model<Media>,
    private readonly membershipService: MembershipService,
    private readonly eventGateway: EventGateway,
    private readonly messageService: MessageService,
    private readonly httpService: HttpService,
  ) {
    this.checkPredictServiceHealth().then((result) => {
      this.predictServerAvailability = result;
    });
  }

  private getFileAbsolutePath(filename: string) {
    return join(__dirname, '..', '..', 'uploads', filename);
  }

  private checkFileExist(filename: string) {
    const filePath = this.getFileAbsolutePath(filename);
    return existsSync(filePath);
  }

  private async checkPredictServiceHealth() {
    try {
      const httpService = new HttpService();
      const url: string = `${process.env.PREDICT_HOST}/system/health`;
      const response$ = await httpService.get(url);
      const predictServerHealthResponse = await lastValueFrom(response$);
      if (predictServerHealthResponse.status === 200) {
        return true;
      }
      return false;
    } catch (error: any) {
      return false;
    }
  }

  private async predictMedia(file: Express.Multer.File): Promise<MediaStatus> {
    const predictServerAvailability = await this.checkPredictServiceHealth();
    if (predictServerAvailability === false) {
      return MediaStatus.REJECTED;
    }

    const fileAbsolutePath = this.getFileAbsolutePath(file.filename);
    const fileBuffer = readFileSync(fileAbsolutePath);
    const url: string = `${process.env.PREDICT_HOST}/api/v2/predict/`;
    const formData = new FormData();
    formData.append('file', fileBuffer, file.originalname);

    try {
      const response$ = this.httpService.post(url, formData, {
        headers: {
          ...formData.getHeaders(),
        },
      });
      const predictResponse = await lastValueFrom(response$);
      const predictResult: string = predictResponse.data.data.predicted_class;
      return predictResult === 'NonViolence'
        ? MediaStatus.APPROVED
        : MediaStatus.REJECTED;
    } catch (error: any) {
      this.logger.error('Failed to predict media', error);
      return MediaStatus.REJECTED;
    }
  }

  @Cron('*/1 * * * *')
  async checkHealth() {
    const isPredictServiceAvailable = await this.checkPredictServiceHealth();
    if (isPredictServiceAvailable === true) {
      this.logger.log('Predict server is running healthy');
    } else {
      this.logger.warn('Predict server is unavailable');
    }
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

  async findAllUserSentMedia(
    requestUserId: string,
    paginationDto: PaginationDto,
    status: MediaStatus,
    room: string,
  ) {
    const filter: any = {
      sender: requestUserId,
      ...(status && { status }),
      ...(room && { conversation: room }),
    };
    const totalDocument: number = await this.mediaModel.countDocuments(filter);
    const totalPage: number = Math.ceil(totalDocument / paginationDto.size);
    const skip: number = (paginationDto.page - 1) * paginationDto.size;

    const data = (await this.mediaModel
      .find(filter)
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
      .select('-__v')
      .transform((doc: any) => doc.map(MongooseDocumentTransformer))
      .limit(paginationDto.size)
      .skip(skip)
      .exec()) as PopulatedMedia[];
    return {
      data,
      metadata: {
        pagination: {
          ...paginationDto,
          totalPage,
          totalDocument,
        },
        count: data.length,
      },
    };
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

  async streamMedia(mediaId: string, httpResponse: any) {
    const media: PopulatedMedia = await this.findById(mediaId);
    if (!media) throw new NotFoundException('File not found');

    return httpResponse.sendFile(media.filePath);
  }

  async create(requestUserId: string, room: string, file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('File not found.');
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

    const mediaStatus: MediaStatus = await this.predictMedia(file);
    if (mediaStatus === MediaStatus.REJECTED) {
      const response = await this.membershipService.banUser('system', {
        targetUser: requestUserId,
        conversation: room,
      });
    }

    try {
      const data: any = await new this.mediaModel({
        sender: requestUserId,
        conversation: room,
        originalname: file.originalname,
        filename: file.filename,
        filePath: this.getFileAbsolutePath(file.filename),
        size: file.size,
        mimetype: file.mimetype,
        status: mediaStatus,
      }).save();

      const messageResponse = await this.messageService.create(
        {
          sendBy: requestUserId,
          conversation: room,
          message: `User [${requestUserId}] uploaded a file`,
          media: data._id.toString(),
        },
        requestUserId,
      );
      const response = await this.findById(data._id.toString());
      this.eventGateway.notifyNewMedia({ media: response });
      return response;
    } catch (error: any) {
      this.logger.fatal(error);
      throw new InternalServerErrorException('Failed to upload file', error);
    }
  }

  async approveMedia(requestUserId: string, mediaId: string) {
    const media = await this.findById(mediaId);
    if (!media) throw new NotFoundException('File not found');
    const mediaConversation = media.conversation as Conversation;

    const requestUserMembership =
      await this.membershipService.findByUserIdAndConversationId(
        requestUserId,
        mediaConversation.id,
      );
    if (!requestUserMembership)
      throw new UnauthorizedException(
        'User is not a member of the conversation',
      );

    if (media.status === MediaStatus.APPROVED) {
      throw new BadRequestException('File already approved');
    }

    try {
      const data = await this.mediaModel.findByIdAndUpdate(
        mediaId,
        { status: MediaStatus.APPROVED },
        { new: true },
      );

      return await this.findById(data._id.toString());
    } catch (error) {
      this.logger.fatal(error);
      throw new InternalServerErrorException('Failed to approve media', error);
    }
  }

  async rejectMedia(requestUserId: string, mediaId: string) {
    const media = await this.findById(mediaId);
    if (!media) throw new NotFoundException('File not found');
    const mediaConversation = media.conversation as Conversation;

    const requestUserMembership =
      await this.membershipService.findByUserIdAndConversationId(
        requestUserId,
        mediaConversation.id,
      );
    if (!requestUserMembership)
      throw new UnauthorizedException(
        'User is not a member of the conversation',
      );

    if (media.status === MediaStatus.REJECTED) {
      throw new BadRequestException('File already rejected');
    }

    try {
      const data = await this.mediaModel.findByIdAndUpdate(
        mediaId,
        { status: MediaStatus.REJECTED },
        { new: true },
      );

      return await this.findById(data._id.toString());
    } catch (error) {
      this.logger.fatal(error);
      throw new InternalServerErrorException('Failed to reject media', error);
    }
  }
}

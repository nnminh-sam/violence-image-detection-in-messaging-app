import { MessagingGateway } from './../messaging/messaging.gateway';
import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateConversationHistoryDto } from './dto/create-conversation-history.dto';
import { UpdateConversationHistoryDto } from './dto/update-conversation-history.dto';
import {
  ConversationHistory,
  ConversationHistoryDocument,
  PopulatedConversationHistoryDocument,
} from './entities/conversation-history.entity';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { UserService } from 'src/user/user.service';
import { ConversationService } from 'src/conversation/conversation.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ConversationMemberEvent } from 'src/conversation-member/entities/conversation-member-event.enum';
import { ConversationMemberDocument } from 'src/conversation-member/entities/conversation-member.entity';
import { Conversation } from 'src/conversation/entities/conversation.entity';
import { User } from 'src/user/entities/user.entity';

@Injectable()
export class ConversationHistoryService {
  private readonly logger: Logger = new Logger(ConversationHistoryService.name);

  constructor(
    @InjectModel(ConversationHistory.name)
    private readonly conversationHistoryModel: Model<ConversationHistory>,

    private readonly userService: UserService,

    private readonly conversationService: ConversationService,

    private readonly eventEmitter: EventEmitter2,

    private messagingGateway: MessagingGateway,
  ) {}

  private async emitMembershipValidationEvent(
    userId: string,
    conversationId: string,
  ): Promise<ConversationMemberDocument> {
    const data = await this.eventEmitter.emitAsync(
      ConversationMemberEvent.FIND_BY_USER_AND_CONVERSATION,
      { userId, conversationId },
    );
    return data[0] as ConversationMemberDocument;
  }

  async create(
    createConversationHistoryDto: CreateConversationHistoryDto,
    requestedUser: string,
  ): Promise<ConversationHistoryDocument> {
    if (createConversationHistoryDto.sendBy !== requestedUser)
      throw new UnauthorizedException('Unauthorized user');

    const sender: User = await this.userService.findById(
      createConversationHistoryDto.sendBy,
    );
    if (!sender) throw new NotFoundException('Sender not found');

    const conversation: Conversation = await this.conversationService.findById(
      createConversationHistoryDto.conversation,
    );
    if (!conversation) throw new NotFoundException('Conversation not found');

    const membership: ConversationMemberDocument =
      await this.emitMembershipValidationEvent(
        createConversationHistoryDto.sendBy,
        createConversationHistoryDto.conversation,
      );
    if (!membership) throw new UnauthorizedException('Unauthorized user');

    try {
      const createdMessage = await new this.conversationHistoryModel({
        ...createConversationHistoryDto,
        createdAt: new Date(),
      }).save();

      this.messagingGateway.sendNewMessage({
        sender,
        message: createConversationHistoryDto.message,
        room: createConversationHistoryDto.conversation,
        timestamp: new Date(),
        attachment: createConversationHistoryDto.attachment,
      });

      return createdMessage;
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException(
        'Failed to create conversation history',
        error,
      );
    }
  }

  async findAll(): Promise<ConversationHistoryDocument[]> {
    return await this.conversationHistoryModel
      .find({
        deletedAt: null,
      })
      .populate('sendBy')
      .populate('conversation')
      .exec();
  }

  async findById(id: string): Promise<PopulatedConversationHistoryDocument> {
    return (await this.conversationHistoryModel
      .findOne({
        _id: id,
        deletedAt: null,
      })
      .populate('sendBy')
      .populate('conversation')
      .exec()) as PopulatedConversationHistoryDocument;
  }

  async findConversationHistory(
    conversationId: string,
    page: number,
    size: number,
    requestedUser: string,
  ): Promise<PopulatedConversationHistoryDocument[]> {
    const conversation: Conversation =
      await this.conversationService.findById(conversationId);
    if (!conversation) throw new NotFoundException('Conversation not found');

    const membership: ConversationMemberDocument =
      await this.emitMembershipValidationEvent(requestedUser, conversationId);
    if (!membership) throw new UnauthorizedException('Unauthorized user');

    const skip: number = (page - 1) * size;
    const data: PopulatedConversationHistoryDocument[] =
      (await this.conversationHistoryModel
        .find({
          conversation: conversationId,
          deletedAt: null,
        })
        .populate({
          path: 'conversation',
          select: '-__v',
        })
        .populate({
          path: 'sendBy',
          select: '-__v -password',
        })
        .limit(size)
        .skip(skip)
        .sort({
          createdAt: -1,
        })
        .select('-__v')
        .lean()
        .exec()) as PopulatedConversationHistoryDocument[];

    return data;
  }

  async update(
    id: string,
    updateConversationHistoryDto: UpdateConversationHistoryDto,
    requestedUser: string,
  ): Promise<ConversationHistoryDocument> {
    const history: PopulatedConversationHistoryDocument =
      await this.findById(id);
    if (!history) throw new NotFoundException('History not found');

    const membership: ConversationMemberDocument =
      await this.emitMembershipValidationEvent(
        requestedUser,
        history.conversation.id,
      );
    if (!membership) throw new UnauthorizedException('Unauthorized user');

    try {
      return await this.conversationHistoryModel.findByIdAndUpdate(
        id,
        {
          ...updateConversationHistoryDto,
          updatedAt: new Date(),
        },
        { new: true },
      );
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to update conversation history',
        error,
      );
    }
  }

  async remove(
    id: string,
    requestedUser: string,
  ): Promise<ConversationHistoryDocument> {
    const history: PopulatedConversationHistoryDocument =
      await this.findById(id);
    if (!history) throw new NotFoundException('History not found');

    const membership: ConversationMemberDocument =
      await this.emitMembershipValidationEvent(
        requestedUser,
        history.conversation.id,
      );
    if (!membership) throw new UnauthorizedException('Unauthorized user');

    try {
      return await this.conversationHistoryModel.findByIdAndUpdate(
        id,
        {
          deletedAt: new Date(),
        },
        { new: true },
      );
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to remove conversation history',
        error,
      );
    }
  }
}

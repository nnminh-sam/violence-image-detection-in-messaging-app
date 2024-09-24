import { EventGateway } from '../event/event.gateway';
import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateMessageDto } from './dto/create-conversation-history.dto';
import { UpdateMessageDto } from './dto/update-conversation-history.dto';
import { Message, MessageDocument } from './entities/message.entity';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { UserService } from 'src/user/user.service';
import { ConversationService } from 'src/conversation/conversation.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MembershipEvent } from 'src/membership/entities/membership-event.enum';
import { MembershipDocument } from 'src/membership/entities/membership.entity';
import { Conversation } from 'src/conversation/entities/conversation.entity';
import { User } from 'src/user/entities/user.entity';

@Injectable()
export class MessageService {
  private readonly logger: Logger = new Logger(MessageService.name);

  constructor(
    @InjectModel(Message.name)
    private readonly MessageModel: Model<Message>,

    private readonly userService: UserService,

    private readonly conversationService: ConversationService,

    private readonly eventEmitter: EventEmitter2,

    private readonly EventGateway: EventGateway,
  ) {}

  private async emitMembershipValidationEvent(
    userId: string,
    conversationId: string,
  ): Promise<MembershipDocument> {
    const data = await this.eventEmitter.emitAsync(
      MembershipEvent.FIND_BY_USER_AND_CONVERSATION,
      { userId, conversationId },
    );
    return data[0] as MembershipDocument;
  }

  async create(
    createMessageDto: CreateMessageDto,
    requestedUser: string,
  ): Promise<MessageDocument> {
    if (createMessageDto.sendBy !== requestedUser)
      throw new UnauthorizedException('Unauthorized user');

    const sender: User = await this.userService.findById(
      createMessageDto.sendBy,
    );
    if (!sender) throw new NotFoundException('Sender not found');

    const conversation: Conversation = await this.conversationService.findById(
      createMessageDto.conversation,
    );
    if (!conversation) throw new NotFoundException('Conversation not found');

    const membership: MembershipDocument =
      await this.emitMembershipValidationEvent(
        createMessageDto.sendBy,
        createMessageDto.conversation,
      );
    if (!membership) throw new UnauthorizedException('Unauthorized user');

    try {
      const createdMessage = await new this.MessageModel({
        ...createMessageDto,
        createdAt: new Date(),
      }).save();

      this.EventGateway.sendNewMessage({
        sender,
        message: createMessageDto.message,
        room: createMessageDto.conversation,
        timestamp: new Date(),
        attachment: createMessageDto.attachment,
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

  async findAll(): Promise<Message[]> {
    const rawData: MessageDocument[] = await this.MessageModel.find({
      deletedAt: null,
    })
      .populate('sendBy')
      .populate('conversation')
      .select('-__v -deletedAt')
      .exec();

    if (!rawData) return [];

    return rawData.map((data) => {
      return {
        id: data._id,
        ...data,
      };
    });
  }

  async findById(id: string): Promise<Message> {
    const data: MessageDocument = await this.MessageModel.findOne({
      _id: id,
      deletedAt: null,
    })
      // .populate('sendBy')
      // .populate('conversation')
      .select('-__v -deletedAt')
      .exec();

    return {
      id: data._id,
      ...data,
    };
  }

  async findMessage(
    conversationId: string,
    page: number,
    size: number,
    requestedUser: string,
  ) {
    const conversation: Conversation =
      await this.conversationService.findById(conversationId);
    if (!conversation) throw new NotFoundException('Conversation not found');

    const membership: MembershipDocument =
      await this.emitMembershipValidationEvent(requestedUser, conversationId);
    if (!membership) throw new UnauthorizedException('Unauthorized user');

    const skip: number = (page - 1) * size;
    const rawData: MessageDocument[] = await this.MessageModel.find({
      conversation: conversationId,
      deletedAt: null,
    })
      // .populate({
      //   path: 'conversation',
      //   select: '-__v',
      // })
      // .populate({
      //   path: 'sendBy',
      //   select: '-__v -password',
      // })
      .limit(size)
      .skip(skip)
      .sort({
        createdAt: -1,
      })
      .select('-__v')
      .exec();

    if (!rawData) return [];

    return {
      data: rawData.map((data) => {
        return {
          id: data._id,
          ...data,
        };
      }),
      metadata: {
        pagination: {
          page,
          size,
        },
      },
    };
  }

  async update(
    id: string,
    updateMessageDto: UpdateMessageDto,
    requestedUser: string,
  ): Promise<Message> {
    const history: Message = await this.findById(id);
    if (!history) throw new NotFoundException('History not found');

    const membership: MembershipDocument =
      await this.emitMembershipValidationEvent(
        requestedUser,
        history.conversation,
      );
    if (!membership) throw new UnauthorizedException('Unauthorized user');

    try {
      const data: MessageDocument = await this.MessageModel.findByIdAndUpdate(
        id,
        { ...updateMessageDto },
        { new: true },
      )
        .select('-__v -deletedAt')
        .exec();
      return {
        id: data._id,
        ...data,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to update conversation history',
        error,
      );
    }
  }

  async remove(id: string, requestedUser: string): Promise<Message> {
    const history: Message = await this.findById(id);
    if (!history) throw new NotFoundException('History not found');

    const membership: MembershipDocument =
      await this.emitMembershipValidationEvent(
        requestedUser,
        history.conversation,
      );
    if (!membership) throw new UnauthorizedException('Unauthorized user');

    try {
      const data: MessageDocument = await this.MessageModel.findByIdAndUpdate(
        id,
        {
          deletedAt: new Date(),
        },
        { new: true },
      )
        .select('-__v -deletedAt')
        .exec();
      return {
        id: data._id,
        ...data,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to remove conversation history',
        error,
      );
    }
  }
}

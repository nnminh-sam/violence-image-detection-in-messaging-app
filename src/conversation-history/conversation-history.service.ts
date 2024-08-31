import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateConversationHistoryDto } from './dto/create-conversation-history.dto';
import { UpdateConversationHistoryDto } from './dto/update-conversation-history.dto';
import {
  ConversationHistory,
  ConversationHistoryDocument,
} from './entities/conversation-history.entity';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { UserService } from 'src/user/user.service';
import { ConversationService } from 'src/conversation/conversation.service';

@Injectable()
export class ConversationHistoryService {
  constructor(
    @InjectModel(ConversationHistory.name)
    private readonly conversationHistoryModel: Model<ConversationHistory>,

    private readonly userService: UserService,

    private readonly conversationService: ConversationService,
  ) {}

  async create(
    createConversationHistoryDto: CreateConversationHistoryDto,
  ): Promise<ConversationHistoryDocument> {
    if (!createConversationHistoryDto?.sendBy) {
      throw new BadRequestException('Send by is required');
    }

    if (!createConversationHistoryDto?.conversationId) {
      throw new BadRequestException('Conversation id is required');
    }

    if (!createConversationHistoryDto?.message) {
      throw new BadRequestException('Message is required');
    }

    const sender = await this.userService.findById(
      createConversationHistoryDto.sendBy,
    );
    if (!sender) {
      throw new NotFoundException('Sender not found');
    }

    const conversation = await this.conversationService.findById(
      createConversationHistoryDto.conversationId,
    );
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    return await new this.conversationHistoryModel({
      ...createConversationHistoryDto,
      createdAt: new Date(),
    }).save();
  }

  async findAll(): Promise<ConversationHistoryDocument[]> {
    return await this.conversationHistoryModel
      .find({
        deletedAt: null,
      })
      .populate('sendBy')
      .populate('conversationId')
      .exec();
  }

  async findById(id: string): Promise<ConversationHistoryDocument> {
    return await this.conversationHistoryModel
      .findOne({
        _id: id,
        deletedAt: null,
      })
      .populate('sendBy')
      .populate('conversationId')
      .exec();
  }

  async update(
    id: string,
    updateConversationHistoryDto: UpdateConversationHistoryDto,
  ): Promise<ConversationHistoryDocument> {
    const conversationHistory = await this.findById(id);
    if (!conversationHistory) {
      throw new NotFoundException('Conversation history not found');
    }

    if (!updateConversationHistoryDto?.message) {
      throw new BadRequestException('Message is required');
    }

    return await this.conversationHistoryModel.findByIdAndUpdate(
      id,
      {
        ...updateConversationHistoryDto,
        updatedAt: new Date(),
      },
      { new: true },
    );
  }

  async remove(id: string): Promise<ConversationHistoryDocument> {
    return await this.conversationHistoryModel.findByIdAndUpdate(
      id,
      {
        deletedAt: new Date(),
      },
      { new: true },
    );
  }
}

import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Conversation,
  ConversationDocument,
} from './entities/conversation.entity';
import { UserService } from 'src/user/user.service';
import { UserResponse } from 'src/user/dto/user-response.dto';
import { ThrowNotFoundException } from 'src/helper/decorator/not-found.decorator';

@Injectable()
export class ConversationService {
  constructor(
    @InjectModel(Conversation.name)
    private conversationModel: Model<Conversation>,

    private userService: UserService,
  ) {}

  async create(
    createConversationDto: CreateConversationDto,
  ): Promise<ConversationDocument> {
    const creator: UserResponse = await this.userService.findById(
      createConversationDto.createdBy,
    );
    if (!creator) throw new NotFoundException('Conversation creator not found');

    const host: UserResponse = await this.userService.findById(
      createConversationDto.host,
    );
    if (!host) throw new NotFoundException('Conversation host not found');

    const existedName = await this.checkExistingName(
      createConversationDto.name,
    );
    if (existedName)
      throw new BadRequestException("Conversation's name is taken");

    try {
      return await new this.conversationModel({
        ...createConversationDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).save();
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to create conversation',
        error,
      );
    }
  }

  async checkExistingName(name: string): Promise<Boolean> {
    const conversation: ConversationDocument =
      await this.conversationModel.findOne({
        name: name,
        deletedAt: null,
      });
    return conversation != null ? true : false;
  }

  async findById(id: string): Promise<ConversationDocument> {
    return await this.conversationModel
      .findOne({
        _id: id,
        deletedAt: null,
      })
      .populate('createdBy')
      .populate('host');
  }

  async isConversationHost(conversationId: string, userId: string) {
    const conversation: ConversationDocument =
      await this.findById(conversationId);
    return conversation.host === userId;
  }

  async update(
    id: string,
    updateConversationDto: UpdateConversationDto,
    requestedUser: string,
  ): Promise<ConversationDocument> {
    const conversation: ConversationDocument = await this.findById(id);
    if (!conversation) throw new NotFoundException('Conversation not found');

    const isAuthorizedUser = await this.isConversationHost(id, requestedUser);
    if (!isAuthorizedUser) throw new UnauthorizedException('Unauthorized user');

    try {
      return await this.conversationModel.findByIdAndUpdate(
        id,
        {
          ...updateConversationDto,
          updatedAt: new Date(),
        },
        {
          new: true,
        },
      );
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to update conversation',
        error,
      );
    }
  }

  async remove(
    id: string,
    requestedUser: string,
  ): Promise<ConversationDocument> {
    const conversation = await this.findById(id);
    if (!conversation) throw new NotFoundException('Conversation not found');

    const isAuthorizedUser = await this.isConversationHost(id, requestedUser);
    if (!isAuthorizedUser) {
      throw new UnauthorizedException('Unauthorized user');
    }

    try {
      return await this.conversationModel.findByIdAndUpdate(
        id,
        { deletedAt: new Date() },
        { new: true },
      );
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to remove conversation',
        error,
      );
    }
  }
}

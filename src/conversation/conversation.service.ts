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
import { User } from 'src/user/entities/user.entity';

@Injectable()
export class ConversationService {
  constructor(
    @InjectModel(Conversation.name)
    private conversationModel: Model<Conversation>,

    private readonly userService: UserService,
  ) {}

  async create(
    createConversationDto: CreateConversationDto,
  ): Promise<Conversation> {
    const creator: User = await this.userService.findById(
      createConversationDto.createdBy,
    );
    if (!creator) throw new NotFoundException('Conversation creator not found');

    const host: User = await this.userService.findById(
      createConversationDto.host,
    );
    if (!host) throw new NotFoundException('Conversation host not found');

    const existedName = await this.isNameExisted(createConversationDto.name);
    if (existedName)
      throw new BadRequestException("Conversation's name is taken");

    try {
      const data: ConversationDocument = await new this.conversationModel({
        ...createConversationDto,
      }).save();
      return {
        id: data._id,
        ...data,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to create conversation',
        error,
      );
    }
  }

  async isNameExisted(name: string): Promise<Boolean> {
    const conversation: ConversationDocument =
      await this.conversationModel.findOne({
        name: name,
        deletedAt: null,
      });
    return conversation != null ? true : false;
  }

  async findById(id: string): Promise<Conversation> {
    const data: ConversationDocument = await this.conversationModel
      .findOne({
        _id: id,
        deletedAt: null,
      })
      .populate('createdBy')
      .populate('host')
      .select('-__v -deletedAt')
      .exec();
    return {
      id: data._id,
      ...data,
    };
  }

  async isConversationHost(
    conversationId: string,
    userId: string,
  ): Promise<boolean> {
    const conversation: Conversation = await this.findById(conversationId);
    return conversation.host === userId;
  }

  async update(
    id: string,
    updateConversationDto: UpdateConversationDto,
    requestedUser: string,
  ): Promise<Conversation> {
    const conversation: Conversation = await this.findById(id);
    if (!conversation) throw new NotFoundException('Conversation not found');

    const isAuthorizedUser: boolean = await this.isConversationHost(
      id,
      requestedUser,
    );
    if (!isAuthorizedUser) throw new UnauthorizedException('Unauthorized user');

    try {
      const data: ConversationDocument = await this.conversationModel
        .findByIdAndUpdate(id, { ...updateConversationDto }, { new: true })
        .select('-__v -deletedAt')
        .exec();
      return {
        id: data._id,
        ...data,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to update conversation',
        error,
      );
    }
  }

  async remove(id: string, requestedUser: string): Promise<Conversation> {
    const conversation: Conversation = await this.findById(id);
    if (!conversation) throw new NotFoundException('Conversation not found');

    const isAuthorizedUser: boolean = await this.isConversationHost(
      id,
      requestedUser,
    );
    if (!isAuthorizedUser) throw new UnauthorizedException('Unauthorized user');

    try {
      const data: ConversationDocument = await this.conversationModel
        .findByIdAndUpdate(id, { deletedAt: new Date() }, { new: true })
        .select('-__v')
        .exec();

      return {
        id: data._id,
        ...data,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to remove conversation',
        error,
      );
    }
  }
}

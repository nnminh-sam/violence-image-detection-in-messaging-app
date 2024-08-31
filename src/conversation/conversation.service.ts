import {
  Injectable,
  NotFoundException,
  BadRequestException,
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
import { UserDocument } from 'src/user/entities/user.entity';

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
    if (!createConversationDto?.createdBy) {
      throw new BadRequestException('Creator ID must not be empty');
    }

    if (!createConversationDto?.hostId) {
      throw new BadRequestException('Host ID must not be empty');
    }

    const creator: UserDocument = await this.userService.findById(
      createConversationDto.createdBy,
    );
    if (!creator) {
      throw new NotFoundException('Creator not found');
    }
    const host: UserDocument = await this.userService.findById(
      createConversationDto.hostId,
    );
    if (!host) {
      throw new NotFoundException('Host not found');
    }

    const nameExisted = await this.checkExistingName(
      createConversationDto.name,
    );
    if (nameExisted) {
      throw new BadRequestException("Conversation's name is taken");
    }

    return await new this.conversationModel({
      ...createConversationDto,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).save();
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
      .populate('hostId');
  }

  async update(
    id: string,
    updateConversationDto: UpdateConversationDto,
  ): Promise<ConversationDocument> {
    let conversation: ConversationDocument = await this.findById(id);

    if (updateConversationDto?.name) {
      const existedName = await this.checkExistingName(
        updateConversationDto.name,
      );
      if (existedName) {
        throw new BadRequestException("Conversation's name is taken");
      }
      conversation.name = updateConversationDto.name;
    }

    if (updateConversationDto?.description) {
      conversation.description = updateConversationDto.description;
    }

    if (updateConversationDto?.createdBy) {
      const creator: UserDocument = await this.userService.findById(
        updateConversationDto.createdBy,
      );
      if (!creator) {
        throw new NotFoundException('Creator not found');
      }
      conversation.createdBy = updateConversationDto.createdBy;
    }

    if (updateConversationDto?.hostId) {
      const host: UserDocument = await this.userService.findById(
        updateConversationDto.hostId,
      );
      if (!host) {
        throw new NotFoundException('Host not found');
      }
      conversation.hostId = updateConversationDto.hostId;
    }

    conversation.updatedAt = new Date();
    return await this.conversationModel.findByIdAndUpdate(id, conversation, {
      new: true,
    });
  }

  async remove(id: string): Promise<ConversationDocument> {
    let Conversation = await this.findById(id);
    Conversation.deletedAt = new Date();
    return await this.conversationModel.findByIdAndUpdate(id, Conversation, {
      new: true,
    });
  }
}

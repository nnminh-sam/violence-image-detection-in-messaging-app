import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CreateConversationMemberDto } from './dto/create-conversation-member.dto';
import { UpdateConversationMemberDto } from './dto/update-conversation-member.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  ConversationMember,
  ConversationMemberDocument,
} from './entities/conversation-member.entity';
import { UserService } from 'src/user/user.service';
import { ConversationService } from 'src/conversation/conversation.service';

@Injectable()
export class ConversationMemberService {
  constructor(
    @InjectModel(ConversationMember.name)
    private conversationMemberModel: Model<ConversationMember>,

    private readonly userService: UserService,

    private readonly conversationService: ConversationService,
  ) {}

  async create(
    createConversationMemberDto: CreateConversationMemberDto,
  ): Promise<ConversationMemberDocument> {
    if (!createConversationMemberDto?.userId) {
      throw new BadRequestException('User ID must not be empty');
    }

    if (!createConversationMemberDto?.conversationId) {
      throw new BadRequestException('Conversation ID must not be empty');
    }

    const user = await this.userService.findById(
      createConversationMemberDto.userId,
    );
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const conversation = await this.conversationService.findById(
      createConversationMemberDto.conversationId,
    );
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    return await new this.conversationMemberModel({
      ...createConversationMemberDto,
      deletedAt: null,
    }).save();
  }

  async findById(id: string): Promise<ConversationMemberDocument> {
    return await this.conversationMemberModel.findOne({
      _id: id,
      deletedAt: null,
    });
  }

  async update(
    id: string,
    updateConversationMemberDto: UpdateConversationMemberDto,
  ): Promise<ConversationMemberDocument> {
    const conversationMember = await this.findById(id);
    if (!conversationMember) {
      throw new NotFoundException('Conversation member not found');
    }

    return await this.conversationMemberModel.findByIdAndUpdate(
      id,
      updateConversationMemberDto,
      { new: true },
    );
  }

  async remove(id: string): Promise<ConversationMemberDocument> {
    const conversationMember = await this.findById(id);
    if (!conversationMember) {
      throw new NotFoundException('Conversation member not found');
    }

    return await this.conversationMemberModel.findByIdAndUpdate(
      id,
      { deletedAt: new Date() },
      { new: true },
    );
  }
}

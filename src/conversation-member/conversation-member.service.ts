import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  UnauthorizedException,
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
import { ConversationMemberStatus } from './entities/conversation-member-status.enum';
import {
  Conversation,
  ConversationDocument,
} from 'src/conversation/entities/conversation.entity';

@Injectable()
export class ConversationMemberService {
  constructor(
    @InjectModel(ConversationMember.name)
    private conversationMemberModel: Model<ConversationMember>,

    private readonly userService: UserService,

    private readonly conversationService: ConversationService,
  ) {}

  async create(
    hostId: string,
    createConversationMemberDto: CreateConversationMemberDto,
  ): Promise<ConversationMemberDocument> {
    const user = await this.userService.findById(
      createConversationMemberDto.user,
    );
    if (!user) throw new NotFoundException('User not found');

    const conversation = await this.conversationService.findById(
      createConversationMemberDto.conversation,
    );
    if (!conversation) throw new NotFoundException('Conversation not found');
    if (conversation.host !== hostId)
      throw new UnauthorizedException(
        'Request user must be the host of this conversation',
      );

    const membership = await this.findByUserIdAndConversationId(
      createConversationMemberDto.user,
      createConversationMemberDto.conversation,
    );
    if (membership)
      throw new BadRequestException('Conversation membership existed');

    try {
      return await new this.conversationMemberModel({
        ...createConversationMemberDto,
        status: ConversationMemberStatus.PARTICIPATING,
      }).save();
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to create conversation member',
        error,
      );
    }
  }

  async findById(id: string): Promise<ConversationMemberDocument> {
    return await this.conversationMemberModel
      .findOne({
        _id: id,
      })
      .populate('conversation')
      .populate('user');
  }

  public async findByUserIdAndConversationId(
    userId: string,
    conversationId: string,
  ): Promise<ConversationMemberDocument> {
    return await this.conversationMemberModel
      .findOne({
        user: userId,
        conversation: conversationId,
      })
      .populate('conversation')
      .populate('user');
  }

  async findConversationMembers(
    conversationId: string,
    requestedUser: string,
  ): Promise<ConversationMemberDocument[]> {
    const conversation: Conversation =
      await this.conversationService.findById(conversationId);
    if (!conversation) throw new NotFoundException('Conversation not found');

    const membership: ConversationMemberDocument =
      await this.findByUserIdAndConversationId(requestedUser, conversationId);
    if (!membership) throw new UnauthorizedException('Unauthorized user');

    return await this.conversationMemberModel.find({
      conversation: conversationId,
      status: ConversationMemberStatus.PARTICIPATING,
    });
  }

  async update(
    id: string,
    hostId: string,
    updateConversationMemberDto: UpdateConversationMemberDto,
  ): Promise<ConversationMemberDocument> {
    const membership = await this.findById(id);
    if (!membership)
      throw new NotFoundException('Conversation membership not found');
    const conversation = await this.conversationService.findById(
      membership.conversation,
    );
    if (!conversation) throw new NotFoundException('Conversation not found');
    if (conversation.host !== hostId)
      throw new UnauthorizedException(
        'User must be the host of this conversation',
      );

    try {
      return await this.conversationMemberModel.findByIdAndUpdate(
        id,
        {
          ...updateConversationMemberDto,
          updatedAt: new Date(),
        },
        { new: true },
      );
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to update conversation membership',
        error,
      );
    }
  }

  async remove(
    id: string,
    hostId: string,
  ): Promise<ConversationMemberDocument> {
    const membership = await this.findById(id);
    if (!membership)
      throw new NotFoundException('Conversation membership not found');
    const conversation = await this.conversationService.findById(
      membership.conversation,
    );
    if (!conversation) throw new NotFoundException('Conversation not found');
    if (conversation.host !== hostId)
      throw new UnauthorizedException(
        'User must be the host of this conversation',
      );

    try {
      return await this.conversationMemberModel.findByIdAndUpdate(
        id,
        {
          status: ConversationMemberStatus.REMOVED,
          updatedAt: new Date(),
        },
        { new: true },
      );
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to remove conversation membership',
        error,
      );
    }
  }
}

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateMembershipDto } from './dto/create-membership.dto';
import { UpdateMembershipDto } from './dto/update-membership.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Membership, MembershipDocument } from './entities/membership.entity';
import { UserService } from 'src/user/user.service';
import { ConversationService } from 'src/conversation/conversation.service';
import { MembershipStatus } from './entities/membership-status.enum';
import { Conversation } from 'src/conversation/entities/conversation.entity';
import { User } from 'src/user/entities/user.entity';

@Injectable()
export class MembershipService {
  constructor(
    @InjectModel(Membership.name)
    private MembershipModel: Model<Membership>,

    private readonly userService: UserService,

    private readonly conversationService: ConversationService,
  ) {}

  async create(
    hostId: string,
    createMembershipDto: CreateMembershipDto,
  ): Promise<Membership> {
    const user: User = await this.userService.findById(
      createMembershipDto.user,
    );
    if (!user) throw new NotFoundException('User not found');

    const conversation: Conversation = await this.conversationService.findById(
      createMembershipDto.conversation,
    );
    if (!conversation) throw new NotFoundException('Conversation not found');
    if (conversation.host !== hostId)
      throw new UnauthorizedException(
        'Request user must be the host of this conversation',
      );

    const membership: Membership = await this.findByUserIdAndConversationId(
      createMembershipDto.user,
      createMembershipDto.conversation,
    );
    if (membership)
      throw new BadRequestException('Conversation membership existed');

    try {
      const data: MembershipDocument = await new this.MembershipModel({
        ...createMembershipDto,
        status: MembershipStatus.PARTICIPATING,
      }).save();

      return {
        id: data._id,
        ...data,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to create conversation member',
        error,
      );
    }
  }

  async findById(id: string): Promise<Membership> {
    const data: MembershipDocument = await this.MembershipModel.findOne({
      _id: id,
    })
      // .populate('conversation')
      // .populate('user')
      .select('-__v -deletedAt')
      .exec();

    return {
      id: data._id,
      ...data,
    };
  }

  public async findByUserIdAndConversationId(
    userId: string,
    conversationId: string,
  ): Promise<Membership> {
    const data: MembershipDocument = await this.MembershipModel.findOne({
      user: userId,
      conversation: conversationId,
    })
      // .populate('conversation')
      // .populate('user')
      .select('-__v -deletedAt')
      .exec();
    return {
      id: data._id,
      ...data,
    };
  }

  async findMemberships(
    conversationId: string,
    requestedUser: string,
  ): Promise<Membership[]> {
    const conversation: Conversation =
      await this.conversationService.findById(conversationId);
    if (!conversation) throw new NotFoundException('Conversation not found');

    const membership: Membership = await this.findByUserIdAndConversationId(
      requestedUser,
      conversationId,
    );
    if (!membership) throw new UnauthorizedException('Unauthorized user');

    const rawData: MembershipDocument[] = await this.MembershipModel.find({
      conversation: conversationId,
      status: MembershipStatus.PARTICIPATING,
    })
      .select('-__v -deletedAt')
      .exec();
    return rawData.map((data: MembershipDocument) => {
      return {
        id: data._id,
        ...data,
      };
    });
  }

  async update(
    id: string,
    hostId: string,
    updateMembershipDto: UpdateMembershipDto,
  ): Promise<Membership> {
    const membership: Membership = await this.findById(id);
    if (!membership)
      throw new NotFoundException('Conversation membership not found');
    const conversation: Conversation = await this.conversationService.findById(
      membership.conversation,
    );
    if (!conversation) throw new NotFoundException('Conversation not found');
    if (conversation.host !== hostId)
      throw new UnauthorizedException(
        'User must be the host of this conversation',
      );

    try {
      const data: MembershipDocument =
        await this.MembershipModel.findByIdAndUpdate(
          id,
          { ...updateMembershipDto },
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
        'Failed to update conversation membership',
        error,
      );
    }
  }

  async remove(id: string, hostId: string): Promise<Membership> {
    const membership: Membership = await this.findById(id);
    if (!membership)
      throw new NotFoundException('Conversation membership not found');
    const conversation: Conversation = await this.conversationService.findById(
      membership.conversation,
    );
    if (!conversation) throw new NotFoundException('Conversation not found');
    if (conversation.host !== hostId)
      throw new UnauthorizedException(
        'User must be the host of this conversation',
      );

    try {
      const data: MembershipDocument =
        await this.MembershipModel.findByIdAndUpdate(
          id,
          { status: MembershipStatus.REMOVED },
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
        'Failed to remove conversation membership',
        error,
      );
    }
  }
}

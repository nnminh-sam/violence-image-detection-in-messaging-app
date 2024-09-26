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
import {
  Membership,
  MembershipDocument,
  PopulatedMembership,
} from './entities/membership.entity';
import { UserService } from 'src/user/user.service';
import { ConversationService } from 'src/conversation/conversation.service';
import { MembershipStatus } from './entities/membership-status.enum';
import {
  Conversation,
  PopulatedConversation,
} from 'src/conversation/entities/conversation.entity';
import { User } from 'src/user/entities/user.entity';
import { MongooseDocumentTransformer } from 'src/helper/mongoose/document-transofrmer';

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
  ): Promise<PopulatedMembership> {
    const user: User = await this.userService.findById(
      createMembershipDto.user,
    );
    if (!user) throw new NotFoundException('User not found');

    const conversation: PopulatedConversation =
      await this.conversationService.findById(createMembershipDto.conversation);
    if (!conversation) throw new NotFoundException('Conversation not found');
    if ((conversation.host as User).id !== hostId)
      throw new UnauthorizedException(
        'Request user must be the host of this conversation',
      );

    const membership: PopulatedMembership =
      await this.findByUserIdAndConversationId(
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

      return await this.findById(data._id.toString());
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to create conversation member',
        error,
      );
    }
  }

  async findById(id: string): Promise<PopulatedMembership> {
    return (await this.MembershipModel.findOne({
      _id: id,
    })
      .populate({
        path: 'conversation',
        select: '-__v -deletedAt',
        transform: MongooseDocumentTransformer,
      })
      .populate({
        path: 'user',
        select: '-__v -deletedAt -password',
        transform: MongooseDocumentTransformer,
      })
      .select('-__v -deletedAt')
      .transform(MongooseDocumentTransformer)
      .exec()) as PopulatedMembership;
  }

  public async findByUserIdAndConversationId(
    userId: string,
    conversationId: string,
  ): Promise<PopulatedMembership> {
    return (await this.MembershipModel.findOne({
      user: userId,
      conversation: conversationId,
    })
      .populate({
        path: 'conversation',
        select: '-__v -deletedAt',
        transform: MongooseDocumentTransformer,
      })
      .populate({
        path: 'user',
        select: '-__v -deletedAt -password',
        transform: MongooseDocumentTransformer,
      })
      .select('-__v -deletedAt')
      .transform(MongooseDocumentTransformer)
      .exec()) as PopulatedMembership;
  }

  async findMemberships(
    conversationId: string,
    requestedUser: string,
  ): Promise<PopulatedMembership[]> {
    const conversation: PopulatedConversation =
      await this.conversationService.findById(conversationId);
    if (!conversation) throw new NotFoundException('Conversation not found');

    const membership: PopulatedMembership =
      await this.findByUserIdAndConversationId(requestedUser, conversationId);
    if (!membership) throw new UnauthorizedException('Unauthorized user');

    return (await this.MembershipModel.find({
      conversation: conversationId,
      status: MembershipStatus.PARTICIPATING,
    })
      .populate({
        path: 'conversation',
        select: '-__v -deletedAt',
        transform: MongooseDocumentTransformer,
      })
      .populate({
        path: 'user',
        select: '-__v -deletedAt -password',
        transform: MongooseDocumentTransformer,
      })
      .select('-__v -deletedAt')
      .transform(MongooseDocumentTransformer)
      .exec()) as PopulatedMembership[];
  }

  async update(
    id: string,
    hostId: string,
    updateMembershipDto: UpdateMembershipDto,
  ): Promise<PopulatedMembership> {
    const membership: PopulatedMembership = await this.findById(id);
    if (!membership)
      throw new NotFoundException('Conversation membership not found');

    const conversation: PopulatedConversation =
      await this.conversationService.findById(
        (membership.conversation as Conversation).id,
      );
    if (!conversation) throw new NotFoundException('Conversation not found');
    if ((conversation.host as User).id !== hostId)
      throw new UnauthorizedException(
        'User must be the host of this conversation',
      );

    try {
      const data: MembershipDocument =
        await this.MembershipModel.findByIdAndUpdate(
          id,
          { ...updateMembershipDto },
          { new: true },
        ).exec();
      return await this.findById(data._id.toString());
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to update conversation membership',
        error,
      );
    }
  }

  async remove(id: string, hostId: string): Promise<PopulatedMembership> {
    const membership: PopulatedMembership = await this.findById(id);
    if (!membership)
      throw new NotFoundException('Conversation membership not found');

    const conversation: PopulatedConversation =
      await this.conversationService.findById(
        (membership.conversation as Conversation).id,
      );
    if (!conversation) throw new NotFoundException('Conversation not found');
    if ((conversation.host as User).id !== hostId)
      throw new UnauthorizedException(
        'User must be the host of this conversation',
      );

    try {
      const data: MembershipDocument =
        await this.MembershipModel.findByIdAndUpdate(
          id,
          { status: MembershipStatus.REMOVED },
          { new: true },
        ).exec();
      return {
        ...membership,
        status: MembershipStatus.REMOVED,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to remove conversation membership',
        error,
      );
    }
  }
}

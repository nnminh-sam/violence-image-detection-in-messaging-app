import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  UnauthorizedException,
  Logger,
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
import { MongooseDocumentTransformer } from 'src/helper/mongoose/document-transformer';
import { ConversationType } from 'src/conversation/entities/conversation-type.enum';

@Injectable()
export class MembershipService {
  private logger: Logger = new Logger(MembershipService.name);

  constructor(
    @InjectModel(Membership.name)
    private membershipModel: Model<Membership>,

    private readonly userService: UserService,

    private readonly conversationService: ConversationService,
  ) {}

  async create(
    requestUserId: string,
    createMembershipDto: CreateMembershipDto,
  ): Promise<PopulatedMembership> {
    const user: User = await this.userService.findById(
      createMembershipDto.user,
    );
    if (!user) throw new NotFoundException('User not found');

    const conversation: PopulatedConversation =
      await this.conversationService.findById(createMembershipDto.conversation);
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }
    if ((conversation.host as User).id !== requestUserId) {
      throw new UnauthorizedException(
        'Request user must be the host of this conversation',
      );
    }

    const membership: PopulatedMembership =
      await this.findByUserIdAndConversationId(
        createMembershipDto.user,
        createMembershipDto.conversation,
      );
    if (membership) {
      throw new BadRequestException('Conversation membership existed');
    }

    const membershipData: any = {
      ...createMembershipDto,
      status: MembershipStatus.PARTICIPATING,
    };

    const partner: User = await this.userService.findById(
      createMembershipDto.partner,
    );
    if (partner && conversation.type === ConversationType.DIRECT) {
      membershipData.partner = partner.id;
    }

    try {
      const data: MembershipDocument = await new this.membershipModel({
        ...membershipData,
      }).save();

      return await this.findById(data._id.toString());
    } catch (error) {
      this.logger.fatal(error);
      throw new InternalServerErrorException(
        'Failed to create conversation member',
        error,
      );
    }
  }

  async findById(id: string): Promise<PopulatedMembership> {
    const data: PopulatedMembership = (await this.membershipModel
      .findOne({
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
      .populate({
        path: 'partner',
        select: '-__v -deletedAt -password',
        transform: MongooseDocumentTransformer,
      })
      .select('-__v -deletedAt')
      .transform(MongooseDocumentTransformer)
      .exec()) as PopulatedMembership;
    return data;
  }

  public async findByUserIdAndConversationId(
    userId: string,
    conversationId: string,
  ): Promise<PopulatedMembership> {
    return (await this.membershipModel
      .findOne({
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
    page: number,
    size: number,
    sortBy: string,
    orderBy: string,
  ) {
    const conversation: PopulatedConversation =
      await this.conversationService.findById(conversationId);
    if (!conversation) throw new NotFoundException('Conversation not found');

    const membership: PopulatedMembership =
      await this.findByUserIdAndConversationId(requestedUser, conversationId);
    if (!membership) throw new UnauthorizedException('Unauthorized user');

    const filter: any = {
      conversation: conversationId,
      status: MembershipStatus.PARTICIPATING,
    };

    const totalDocument: number =
      await this.membershipModel.countDocuments(filter);
    const totalPage: number = Math.ceil(totalDocument / size);

    const skip: number = (page - 1) * size;
    const data = (await this.membershipModel
      .find(filter)
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
      .populate({
        path: 'partner',
        select: '-__v -deletedAt -password',
        transform: MongooseDocumentTransformer,
      })
      .select('-__v -deletedAt')
      .limit(size)
      .skip(skip)
      .sort({
        [sortBy]: orderBy === 'asc' ? 1 : -1,
      })
      .transform((doc: any) => {
        return doc.map(MongooseDocumentTransformer);
      })
      .exec()) as PopulatedMembership[];
    return {
      data,
      metadata: {
        pagination: {
          page,
          size,
          totalPage,
        },
        count: data.length,
      },
    };
  }

  async findParticipatedConversations(
    userId: string,
    page: number,
    size: number,
    sortBy: string,
    orderBy: string,
  ) {
    const filter: any = {
      user: userId,
      status: MembershipStatus.PARTICIPATING,
    };

    const totalDocument: number =
      await this.membershipModel.countDocuments(filter);
    const totalPage: number = Math.ceil(totalDocument / size);

    const skip: number = (page - 1) * size;
    const data = (await this.membershipModel
      .find(filter)
      .populate({
        path: 'conversation',
        select: '-__v -deletedAt',
        transform: MongooseDocumentTransformer,
      })
      .populate({
        path: 'partner',
        select: '-__v -deletedAt -password',
        transform: MongooseDocumentTransformer,
      })
      .select('-__v -deletedAt')
      .limit(size)
      .skip(skip)
      .sort({
        [sortBy]: orderBy === 'asc' ? 1 : -1,
      })
      .transform((doc: any) => {
        return doc.map(MongooseDocumentTransformer);
      })
      .exec()) as PopulatedMembership[];

    return {
      data,
      metadata: {
        pagination: {
          page,
          size,
          totalPage,
        },
        count: data.length,
      },
    };
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
      const data: MembershipDocument = await this.membershipModel
        .findByIdAndUpdate(id, { ...updateMembershipDto }, { new: true })
        .exec();
      return await this.findById(data._id.toString());
    } catch (error) {
      this.logger.fatal(error);
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
      const data: MembershipDocument = await this.membershipModel
        .findByIdAndUpdate(
          id,
          { status: MembershipStatus.REMOVED },
          { new: true },
        )
        .exec();
      return {
        ...membership,
        status: MembershipStatus.REMOVED,
      };
    } catch (error) {
      this.logger.fatal(error);
      throw new InternalServerErrorException(
        'Failed to remove conversation membership',
        error,
      );
    }
  }
}

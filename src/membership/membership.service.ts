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
import { populate } from 'dotenv';
import { MembershipRole } from './entities/membership-role.enum';
import { BanUserDto } from './dto/ban-user.dto';
import { RequestedUser } from '../decorator/requested-user.decorator';
import { ChangeHostDto } from './dto/change-host.dto';

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
    if (!conversation) throw new NotFoundException('Conversation not found');

    if ((conversation.host as User).id !== requestUserId)
      throw new UnauthorizedException(
        'Request user must be the host of this conversation',
      );

    const membership: PopulatedMembership =
      await this.findByUserIdAndConversationId(
        createMembershipDto.user,
        createMembershipDto.conversation,
      );
    if (membership && membership.status === MembershipStatus.AWAY) {
      try {
        await this.membershipModel.findByIdAndUpdate(
          membership.id,
          {
            status: MembershipStatus.PARTICIPATING,
          },
          { new: true },
        );
        return await this.findById(membership.id);
      } catch (error: any) {
        this.logger.fatal(error);
        throw new InternalServerErrorException(
          'Failed to update membership',
          error,
        );
      }
    } else if (membership) {
      throw new BadRequestException(
        'User is already a member of this conversation',
      );
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

  async findParticipatedMembershipByConversationId(
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
      status: {
        $ne: MembershipStatus.AWAY,
      },
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
      .transform((doc: any) => doc.map(MongooseDocumentTransformer))
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

  private async update(
    relationshipId: string,
    requestUserId: string,
    updateMembershipDto: UpdateMembershipDto,
  ): Promise<PopulatedMembership> {
    const membership: PopulatedMembership = await this.findById(relationshipId);
    if (!membership) throw new NotFoundException('Membership not found');

    const conversation: Conversation = membership.conversation as Conversation;
    const conversationHostId: string = conversation.host;
    if (conversationHostId !== requestUserId)
      throw new UnauthorizedException(
        'User must be the host of this conversation',
      );

    try {
      const data: MembershipDocument = await this.membershipModel
        .findByIdAndUpdate(
          relationshipId,
          { ...updateMembershipDto },
          { new: true },
        )
        .exec();
      return await this.findById(data._id.toString());
    } catch (error) {
      this.logger.fatal(error);
      throw new InternalServerErrorException(
        'Failed to update membership',
        error,
      );
    }
  }

  async changeHost(requestUserId: string, changeHostDto: ChangeHostDto) {
    const requestUserMembership: PopulatedMembership =
      await this.findByUserIdAndConversationId(
        requestUserId,
        changeHostDto.conversation,
      );
    if (!requestUserMembership)
      throw new UnauthorizedException('User must be member of conversation');
    if (requestUserMembership.role !== MembershipRole.HOST) {
      throw new UnauthorizedException(
        'User must be the host of this conversation',
      );
    }

    const targetUserMembership: PopulatedMembership =
      await this.findByUserIdAndConversationId(
        changeHostDto.newHost,
        changeHostDto.conversation,
      );
    if (!targetUserMembership)
      throw new UnauthorizedException('User must be member of conversation');
    if (targetUserMembership.role === MembershipRole.HOST) {
      throw new BadRequestException(
        'User is already a host of this conversation',
      );
    }

    try {
      const result = await Promise.all([
        this.membershipModel.findByIdAndUpdate(
          requestUserMembership.id,
          { role: MembershipRole.MEMBER },
          { new: true },
        ),
        this.membershipModel.findByIdAndUpdate(
          targetUserMembership.id,
          { role: MembershipRole.HOST },
          { new: true },
        ),
        this.conversationService.updateHost(
          changeHostDto.conversation,
          changeHostDto.newHost,
          requestUserId,
        ),
      ]);
      return [
        await this.findById(result[0]._id.toString()),
        await this.findById(result[1]._id.toString()),
      ];
    } catch (error: any) {
      this.logger.fatal(error);
      throw new InternalServerErrorException(
        'Failed to update membership',
        error,
      );
    }
  }

  async banUser(
    requestUserId: string,
    banUserDto: BanUserDto,
  ): Promise<PopulatedMembership> {
    const requestedUserMembership: PopulatedMembership =
      await this.findByUserIdAndConversationId(
        requestUserId,
        banUserDto.conversation,
      );
    if (!requestedUserMembership)
      throw new UnauthorizedException('User must be member of conversation');
    if (requestedUserMembership.role !== MembershipRole.HOST)
      throw new UnauthorizedException(
        'User must be the host of this conversation',
      );

    const banningUserMembership: PopulatedMembership =
      await this.findByUserIdAndConversationId(
        banUserDto.targetUser,
        banUserDto.conversation,
      );
    if (!banningUserMembership)
      throw new NotFoundException(
        'Target user is not a member of conversation',
      );

    try {
      const result: MembershipDocument =
        await this.membershipModel.findByIdAndUpdate(
          banningUserMembership.id,
          {
            status: MembershipStatus.BANNED,
            role: MembershipRole.GUEST,
            bannedAt: new Date(),
          },
          { new: true },
        );
      return await this.findById(result._id.toString());
    } catch (error: any) {
      this.logger.fatal(error);
      throw new InternalServerErrorException(
        'Failed to update membership',
        error,
      );
    }
  }

  async unbanUser(
    requestUserId: string,
    banUserDto: BanUserDto,
  ): Promise<PopulatedMembership> {
    const requestedUserMembership: PopulatedMembership =
      await this.findByUserIdAndConversationId(
        requestUserId,
        banUserDto.conversation,
      );
    if (!requestedUserMembership)
      throw new UnauthorizedException('User must be member of conversation');
    if (requestedUserMembership.role !== MembershipRole.HOST)
      throw new UnauthorizedException(
        'User must be the host of this conversation',
      );

    const unbanningUserMembership: PopulatedMembership =
      await this.findByUserIdAndConversationId(
        banUserDto.targetUser,
        banUserDto.conversation,
      );
    if (!unbanningUserMembership)
      throw new NotFoundException(
        'Target user is not a member of conversation',
      );

    try {
      const result: MembershipDocument =
        await this.membershipModel.findByIdAndUpdate(
          unbanningUserMembership.id,
          {
            status: MembershipStatus.PARTICIPATING,
            role: MembershipRole.MEMBER,
            bannedAt: null,
          },
          { new: true },
        );
      return await this.findById(result._id.toString());
    } catch (error: any) {
      this.logger.fatal(error);
      throw new InternalServerErrorException(
        'Failed to update membership',
        error,
      );
    }
  }

  async remove(
    relationshipId: string,
    requestUserId: string,
  ): Promise<PopulatedMembership> {
    return await this.update(relationshipId, requestUserId, {
      status: MembershipStatus.AWAY,
      role: MembershipRole.GUEST,
    });
  }
}

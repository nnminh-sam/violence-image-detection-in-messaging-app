import { CreateConversationDto } from './../conversation/dto/create-conversation.dto';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateRelationshipDto } from './dto/create-relationship.dto';
import { UpdateRelationshipDto } from './dto/update-relationship.dto';
import { InjectModel } from '@nestjs/mongoose';
import {
  PopulatedRelationship,
  Relationship,
  RelationshipDocument,
} from './entities/relationship.entity';
import { Model } from 'mongoose';
import { UserService } from 'src/user/user.service';
import { BlockUserDto } from './dto/block-user.dto';
import RelationshipStatus from './entities/relationship.enum';
import { User } from 'src/user/entities/user.entity';
import { MongooseDocumentTransformer } from 'src/helper/mongoose/document-transformer';
import { ConversationService } from 'src/conversation/conversation.service';
import { PopulatedConversation } from 'src/conversation/entities/conversation.entity';
import { MembershipService } from 'src/membership/membership.service';
import { MembershipRole } from 'src/membership/entities/membership-role.enum';
import { ConversationType } from 'src/conversation/entities/conversation-type.enum';
import { PopulatedMembership } from 'src/membership/entities/membership.entity';

@Injectable()
export class RelationshipService {
  private logger: Logger = new Logger(RelationshipService.name);

  constructor(
    @InjectModel(Relationship.name)
    private relationshipModel: Model<Relationship>,
    private readonly userService: UserService,
    private readonly conversationService: ConversationService,
    private readonly membershipService: MembershipService,
  ) {}

  async create(
    payload: CreateRelationshipDto,
    requestedUserId: string,
  ): Promise<PopulatedRelationship> {
    if (payload.userA === payload.userB)
      throw new BadRequestException('User A and user B must be different');
    const userA: User = await this.userService.findById(payload.userA);
    if (!userA) throw new BadRequestException('User A not found');
    const userB: User = await this.userService.findById(payload.userB);
    if (!userB) throw new BadRequestException('User B not found');
    const userARequestedRelationship =
      userA.id === requestedUserId ? true : false;
    const existedRelationship: Relationship = await this.findByUserIds(
      userA.id,
      userB.id,
    );
    if (
      existedRelationship &&
      existedRelationship.status === RelationshipStatus.AWAY
    ) {
      try {
        const data: RelationshipDocument = await this.relationshipModel
          .findByIdAndUpdate(
            existedRelationship.id,
            {
              status:
                requestedUserId === existedRelationship.userA
                  ? RelationshipStatus.REQUEST_USER_A
                  : RelationshipStatus.REQUEST_USER_B,
            },
            { new: true },
          )
          .exec();
        return await this.findById(data._id.toString());
      } catch (error) {
        this.logger.fatal(error);
        throw new InternalServerErrorException(
          'Failed to create relationship',
          error,
        );
      }
    } else if (existedRelationship) {
      throw new BadRequestException('Relationship already exists');
    }
    const relationshipData: any =
      payload.userA <= payload.userB
        ? {
            userA: userA.id,
            userB: userB.id,
            status: userARequestedRelationship
              ? RelationshipStatus.REQUEST_USER_A
              : RelationshipStatus.REQUEST_USER_B,
          }
        : {
            userA: userB.id,
            userB: userA.id,
            status: userARequestedRelationship
              ? RelationshipStatus.REQUEST_USER_B
              : RelationshipStatus.REQUEST_USER_A,
          };
    try {
      const data: RelationshipDocument = await new this.relationshipModel(
        relationshipData,
      ).save();
      return await this.findById(data._id.toString());
    } catch (error) {
      this.logger.fatal(error);
      throw new InternalServerErrorException(
        'Failed to create relationship',
        error,
      );
    }
  }

  async findById(id: string): Promise<PopulatedRelationship> {
    return (await this.relationshipModel
      .findOne({
        _id: id,
        blockedAt: null,
      })
      .populate({
        path: 'userA',
        select: '-__v -password -deletedAt',
        transform: MongooseDocumentTransformer,
      })
      .populate({
        path: 'userB',
        select: '-__v -password -deletedAt',
        transform: MongooseDocumentTransformer,
      })
      .select('-__v -deletedAt')
      .transform(MongooseDocumentTransformer)
      .exec()) as PopulatedRelationship;
  }

  async findByUserIds(userAId: string, userBId: string): Promise<Relationship> {
    return (await this.relationshipModel
      .findOne({
        ...(userAId <= userBId
          ? {
              userA: userAId,
              userB: userBId,
            }
          : {
              userA: userBId,
              userB: userAId,
            }),
      })
      .select('-__v -deletedAt')
      .transform(MongooseDocumentTransformer)
      .exec()) as Relationship;
  }

  async findMyRelationshipById(
    relationshipId: string,
    requestedUser: string,
  ): Promise<PopulatedRelationship> {
    const relationship: PopulatedRelationship =
      await this.findById(relationshipId);
    if (!relationship) throw new NotFoundException('Relationship not found');

    const isUserRelationship: boolean =
      (relationship.userA as User).id === requestedUser ||
      (relationship.userB as User).id === requestedUser;

    if (!isUserRelationship)
      throw new UnauthorizedException('Unauthorized user');

    return relationship;
  }

  async findMyRelationships(
    userId: string,
    page: number,
    size: number,
    sortBy: string,
    orderBy: string,
  ) {
    const filter: any = {
      $or: [{ userA: userId }, { userB: userId }],
    };
    const totalDocument: number =
      await this.relationshipModel.countDocuments(filter);
    const totalPage: number = Math.ceil(totalDocument / size);
    const skipValue: number = (page - 1) * size;
    const data: PopulatedRelationship[] = (await this.relationshipModel
      .find(filter)
      .populate({
        path: 'userA',
        select: '-__v -password -deletedAt',
        transform: MongooseDocumentTransformer,
      })
      .populate({
        path: 'userB',
        select: '-__v -password -deletedAt',
        transform: MongooseDocumentTransformer,
      })
      .select('-__v')
      .limit(size)
      .skip(skipValue)
      .sort({
        [sortBy]: orderBy.toLowerCase() === 'asc' ? 1 : -1,
      })
      .transform((doc: any) => {
        return doc.map(MongooseDocumentTransformer);
      })
      .exec()) as PopulatedRelationship[];

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

  async acceptRelationshipRequest(
    requestedUserId: string,
    relationshipId: string,
  ) {
    const relationship: PopulatedRelationship =
      await this.findById(relationshipId);
    if (!relationship) throw new NotFoundException('Relationship not found');
    if (relationship.status === RelationshipStatus.FRIENDS)
      throw new BadRequestException('Users are already friends');
    if (
      relationship.status === RelationshipStatus.BLOCKED_USER_A ||
      relationship.status === RelationshipStatus.BLOCKED_USER_B
    )
      throw new BadRequestException('Users are blocked');
    if (relationship.status === RelationshipStatus.AWAY)
      throw new BadRequestException('User must request to be friends first');

    const existDirectConversation: boolean =
      await this.conversationService.isNameExisted(relationshipId);
    if (existDirectConversation) {
      try {
        const data: RelationshipDocument = await this.relationshipModel
          .findByIdAndUpdate(
            relationshipId,
            { status: RelationshipStatus.FRIENDS },
            { new: true },
          )
          .exec();
        return await this.findById(data._id.toString());
      } catch (error) {
        this.logger.fatal(error);
        throw new InternalServerErrorException(
          'Failed to accept relationship request',
          error,
        );
      }
    }
    const userA: User = relationship.userA;
    const userB: User = relationship.userB;
    const host: string = requestedUserId;
    try {
      const payload: CreateConversationDto = {
        name: `${relationshipId}`,
        description: `[userA, ${userA.email}], [userB, ${userB.email}]`,
        createdBy: host,
        host,
        type: ConversationType.DIRECT,
      };
      const directConversation: PopulatedConversation =
        await this.conversationService.create(payload);
      const userAMembership: PopulatedMembership =
        await this.membershipService.create(requestedUserId, {
          user: userA.id,
          conversation: directConversation.id,
          role: MembershipRole.MEMBER,
          partner: userB.id.toString(),
        });
      const userBMembership: PopulatedMembership =
        await this.membershipService.create(requestedUserId, {
          user: userB.id,
          conversation: directConversation.id,
          role: MembershipRole.MEMBER,
          partner: userA.id.toString(),
        });
      const data: RelationshipDocument = await this.relationshipModel
        .findByIdAndUpdate(
          relationshipId,
          { status: RelationshipStatus.FRIENDS },
          { new: true },
        )
        .exec();
      return await this.findById(data._id.toString());
    } catch (error) {
      this.logger.fatal(error);
      throw new InternalServerErrorException(
        'Failed to update relationship',
        error,
      );
    }
  }

  async update(
    id: string,
    updateRelationshipDto: UpdateRelationshipDto,
    requestedUserId: string,
  ): Promise<PopulatedRelationship> {
    const relationship: PopulatedRelationship = await this.findById(id);
    if (!relationship) throw new NotFoundException('Relationship not found');

    const relationshipMemberIds = [
      (relationship.userA as User).id,
      (relationship.userB as User).id,
    ];
    if (!relationshipMemberIds.includes(requestedUserId)) {
      throw new UnauthorizedException('Unauthorized user');
    }

    try {
      const data: RelationshipDocument = await this.relationshipModel
        .findByIdAndUpdate(id, { ...updateRelationshipDto }, { new: true })
        .exec();

      return await this.findById(data._id.toString());
    } catch (error) {
      this.logger.fatal(error);
      throw new InternalServerErrorException(
        'Failed to update relationship',
        error,
      );
    }
  }

  async blockUser(
    requestedUser: string,
    blockUserDto: BlockUserDto,
  ): Promise<PopulatedRelationship> {
    const blocker: User = await this.userService.findById(
      blockUserDto.blockedBy,
    );
    if (!blocker) throw new NotFoundException('Block by user not found');

    if (blockUserDto.blockedBy !== requestedUser) {
      throw new UnauthorizedException('Unauthorized user');
    }

    const targetUser: User = await this.userService.findById(
      blockUserDto.targetUser,
    );
    if (!targetUser) throw new NotFoundException('Target user not found');

    const relationship: Relationship = await this.findByUserIds(
      blockUserDto.blockedBy,
      blockUserDto.targetUser,
    );
    if (!relationship) throw new NotFoundException('Relationship not found');
    if (relationship.blockedAt) {
      throw new BadRequestException('Relationship is already blocked');
    }

    try {
      const status: RelationshipStatus =
        blockUserDto.blockedBy === relationship.userA
          ? RelationshipStatus.BLOCKED_USER_A
          : RelationshipStatus.BLOCKED_USER_B;
      const data: RelationshipDocument = await this.relationshipModel
        .findByIdAndUpdate(
          relationship.id,
          { status, blockedAt: new Date() },
          { new: true },
        )
        .exec();
      return await this.findById(data._id.toString());
    } catch (error) {
      this.logger.fatal(error);
      throw new InternalServerErrorException('Failed to block user', error);
    }
  }

  async unblockUser(requestedUserId: string, relationshipId: string) {
    const relationship: RelationshipDocument = await this.relationshipModel
      .findById(relationshipId)
      .exec();
    if (!relationship) {
      throw new NotFoundException('Relationship not found');
    }

    const relationshipMemberIds: string[] = [
      relationship.userA.toString(),
      relationship.userB.toString(),
    ];
    if (!relationshipMemberIds.includes(requestedUserId)) {
      throw new UnauthorizedException('Unauthorized user');
    }

    const isBlockedByUserA: boolean =
      relationship.userA.toString() === requestedUserId;
    if (
      !isBlockedByUserA &&
      relationship.status === RelationshipStatus.BLOCKED_USER_A
    ) {
      throw new UnauthorizedException('User is not authorized to unblock');
    } else if (
      isBlockedByUserA &&
      relationship.status === RelationshipStatus.BLOCKED_USER_B
    ) {
      throw new UnauthorizedException('User is not authorized to unblock');
    }

    try {
      const data: RelationshipDocument = await this.relationshipModel
        .findByIdAndUpdate(
          relationshipId,
          {
            status: RelationshipStatus.AWAY,
            blockedAt: null,
          },
          { new: true },
        )
        .exec();
      return await this.findById(data._id.toString());
    } catch (error) {
      this.logger.fatal(error);
      throw new InternalServerErrorException('Failed to unblock user');
    }
  }

  async delete(relationshipId: string, requestedUserId: string) {
    const relationship: PopulatedRelationship =
      await this.findById(relationshipId);
    if (!relationship) {
      throw new NotFoundException('Relationship not found');
    }

    const relationshipMemberIds: string[] = [
      (relationship.userA as User).id,
      (relationship.userB as User).id,
    ];
    if (!relationshipMemberIds.includes(requestedUserId)) {
      throw new UnauthorizedException('Unauthorized user');
    }

    try {
      await this.relationshipModel
        .findByIdAndUpdate(
          relationshipId,
          { status: RelationshipStatus.AWAY },
          { new: true },
        )
        .exec();
    } catch (error) {
      this.logger.fatal(error);
      throw new InternalServerErrorException('Failed to delete relationship');
    }
  }
}

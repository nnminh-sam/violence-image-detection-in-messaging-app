import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateRelationshipDto } from './dto/create-relationship.dto';
import { UpdateRelationshipDto } from './dto/update-relationship.dto';
import { InjectModel } from '@nestjs/mongoose';
import {
  Relationship,
  RelationshipDocument,
} from './entities/relationship.entity';
import { Model } from 'mongoose';
import { UserService } from 'src/user/user.service';
import { BlockUserDto } from './dto/block-user.dto';
import RelationshipStatus from './entities/relationship.enum';
import { User } from 'src/user/entities/user.entity';

@Injectable()
export class RelationshipService {
  constructor(
    @InjectModel(Relationship.name)
    private relationshipModel: Model<Relationship>,

    private userService: UserService,
  ) {}

  async create(
    createRelationshipDto: CreateRelationshipDto,
  ): Promise<RelationshipDocument> {
    if (createRelationshipDto.userA === createRelationshipDto.userB)
      throw new BadRequestException(
        'First user and Second user must be different',
      );

    const userA: User = await this.userService.findById(
      createRelationshipDto.userA,
    );
    if (!userA) throw new BadRequestException('User A not found');

    const userB: User = await this.userService.findById(
      createRelationshipDto.userB,
    );
    if (!userB) throw new BadRequestException('User B not found');

    const existedRelationship = await this.findByUserIds(userA.id, userB.id);
    if (existedRelationship) {
      throw new BadRequestException('Relationship existed');
    }

    try {
      return await new this.relationshipModel({
        ...(createRelationshipDto.userA <= createRelationshipDto.userB
          ? { userA: userA.id, userB: userB.id }
          : { userA: userB.id, userB: userA.id }),
        status: createRelationshipDto.status,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).save();
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to create relationship',
        error,
      );
    }
  }

  async findById(
    id: string,
    requestedUser: string,
  ): Promise<RelationshipDocument | null> {
    return await this.relationshipModel
      .findOne({
        _id: id,
        $or: [{ userA: requestedUser }, { userB: requestedUser }],
      })
      .populate('userA')
      .populate('userB');
  }

  async findByUserIds(
    userAId: string,
    userBId: string,
  ): Promise<RelationshipDocument | null> {
    return await this.relationshipModel.findOne({
      ...(userAId <= userBId
        ? {
            userA: userAId,
            userB: userBId,
          }
        : {
            userA: userBId,
            userB: userAId,
          }),
    });
  }

  async findAllMyRelationship(userId: string) {
    const rawData = await this.relationshipModel
      .find({
        $or: [{ userA: userId }, { userB: userId }],
        deletedAt: null,
      })
      .select('-__v')
      .lean();
    return rawData.map((data) => {
      return {
        id: data._id,
        ...data,
      };
    });
  }

  async update(
    id: string,
    updateRelationshipDto: UpdateRelationshipDto,
    requestedUser: string,
  ): Promise<RelationshipDocument> {
    const relationship: any = await this.findById(id, requestedUser);
    if (!relationship) throw new NotFoundException('Relationship not found');

    try {
      return await this.relationshipModel.findByIdAndUpdate(
        id,
        {
          ...updateRelationshipDto,
          updatedAt: new Date(),
        },
        { new: true },
      );
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to update relationship',
        error,
      );
    }
  }

  async blockUser(
    requestedUser: string,
    blockUserDto: BlockUserDto,
  ): Promise<RelationshipDocument> {
    const blockBy: User = await this.userService.findById(
      blockUserDto.blockedBy,
    );
    if (!blockBy) throw new NotFoundException('Block by user not found');
    if (blockUserDto.blockedBy !== requestedUser)
      throw new UnauthorizedException('Unauthorized user');

    const targetUser: User = await this.userService.findById(
      blockUserDto.targetUser,
    );
    if (!targetUser) throw new NotFoundException('Target user not found');

    const relationship: RelationshipDocument = await this.findByUserIds(
      blockUserDto.blockedBy,
      blockUserDto.targetUser,
    );
    if (!relationship) throw new NotFoundException('Relationship not found');
    if (relationship.blockedAt)
      throw new BadRequestException('Relationship is already blocked');

    try {
      const timestamp: Date = new Date();
      const status: RelationshipStatus =
        blockUserDto.blockedBy === relationship.userA
          ? RelationshipStatus.BLOCKED_USER_A
          : RelationshipStatus.BLOCKED_USER_B;
      return await this.relationshipModel.findByIdAndUpdate(
        relationship._id,
        {
          updatedAt: timestamp,
          blockedAt: timestamp,
          status,
        },
        { new: true },
      );
    } catch (error) {
      throw new InternalServerErrorException('Failed to block user', error);
    }
  }
}

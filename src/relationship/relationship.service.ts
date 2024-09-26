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
import { MongooseDocumentTransformer } from 'src/helper/mongoose/document-transofrmer';

@Injectable()
export class RelationshipService {
  private logger: Logger = new Logger(RelationshipService.name);

  constructor(
    @InjectModel(Relationship.name)
    private relationshipModel: Model<Relationship>,

    private userService: UserService,
  ) {}

  async create(
    createRelationshipDto: CreateRelationshipDto,
  ): Promise<PopulatedRelationship> {
    if (createRelationshipDto.userA === createRelationshipDto.userB)
      throw new BadRequestException('User A and user B must be different');

    const userA: User = await this.userService.findById(
      createRelationshipDto.userA,
    );
    if (!userA) throw new BadRequestException('User A not found');

    const userB: User = await this.userService.findById(
      createRelationshipDto.userB,
    );
    if (!userB) throw new BadRequestException('User B not found');

    const existedRelationship: Relationship = await this.findByUserIds(
      userA.id,
      userB.id,
    );
    if (existedRelationship)
      throw new BadRequestException('Relationship existed');

    try {
      const data: RelationshipDocument = await new this.relationshipModel({
        ...(createRelationshipDto.userA <= createRelationshipDto.userB
          ? { userA: userA.id, userB: userB.id }
          : { userA: userB.id, userB: userA.id }),
        status: createRelationshipDto.status,
      }).save();

      return await this.findById(data._id.toString());
    } catch (error) {
      this.logger.error(error);
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
      .lean()
      .transform(MongooseDocumentTransformer)
      .exec()) as PopulatedRelationship;
  }

  async findMyRelationship(
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
      .lean()
      .transform(MongooseDocumentTransformer)
      .exec()) as Relationship;
  }

  async findAll(
    userId: string,
    page: number,
    size: number,
    sortBy: string,
    orderBy: string,
  ) {
    const skipValue: number = (page - 1) * size;
    const data: PopulatedRelationship[] = (await this.relationshipModel
      .find({
        $or: [{ userA: userId }, { userB: userId }],
        deletedAt: null,
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
      .limit(size)
      .skip(skipValue)
      .sort({
        [sortBy]: orderBy.toLowerCase() === 'asc' ? 1 : -1,
      })
      .lean()
      .transform((doc: any) => {
        return doc.map(MongooseDocumentTransformer);
      })
      .exec()) as PopulatedRelationship[];

    return {
      data,
      metadata: {
        pagination: {
          page: page,
          size: size,
        },
        count: data.length,
      },
    };
  }

  async update(
    id: string,
    updateRelationshipDto: UpdateRelationshipDto,
    requestedUser: string,
  ): Promise<PopulatedRelationship> {
    const relationship: PopulatedRelationship = await this.findById(id);
    if (!relationship) throw new NotFoundException('Relationship not found');

    try {
      const data: RelationshipDocument = await this.relationshipModel
        .findByIdAndUpdate(id, { ...updateRelationshipDto }, { new: true })
        .exec();

      return await this.findById(data._id.toString());
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
  ): Promise<PopulatedRelationship> {
    const blocker: User = await this.userService.findById(
      blockUserDto.blockedBy,
    );
    if (!blocker) throw new NotFoundException('Block by user not found');

    if (blockUserDto.blockedBy !== requestedUser)
      throw new UnauthorizedException('Unauthorized user');

    const targetUser: User = await this.userService.findById(
      blockUserDto.targetUser,
    );
    if (!targetUser) throw new NotFoundException('Target user not found');

    const relationship: Relationship = await this.findByUserIds(
      blockUserDto.blockedBy,
      blockUserDto.targetUser,
    );
    if (!relationship) throw new NotFoundException('Relationship not found');
    if (relationship.blockedAt)
      throw new BadRequestException('Relationship is already blocked');

    try {
      const status: RelationshipStatus =
        blockUserDto.blockedBy === relationship.userA
          ? RelationshipStatus.BLOCKED_USER_A
          : RelationshipStatus.BLOCKED_USER_B;
      const data: RelationshipDocument = await this.relationshipModel
        .findByIdAndUpdate(relationship.id, { status }, { new: true })
        .exec();
      return await this.findById(data._id.toString());
    } catch (error) {
      throw new InternalServerErrorException('Failed to block user', error);
    }
  }
}

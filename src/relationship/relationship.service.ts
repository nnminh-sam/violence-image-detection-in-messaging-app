import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
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
import { UserResponse } from 'src/user/dto/user-response.dto';

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
    if (createRelationshipDto.userA === createRelationshipDto.userB) {
      throw new BadRequestException(
        'First user and Second user must be different',
      );
    }

    const userA: UserResponse = await this.userService.findById(
      createRelationshipDto.userA,
      'User A not found',
    );

    const userB: UserResponse = await this.userService.findById(
      createRelationshipDto.userB,
      'User B not found',
    );

    const existedRelationship = await this.findByUserIds(
      userA.id,
      userB.id,
      true,
    );
    if (existedRelationship) {
      throw new BadRequestException('Relationship existed');
    }

    const dataResponse: RelationshipDocument = await new this.relationshipModel(
      {
        ...(createRelationshipDto.userA <= createRelationshipDto.userB
          ? { userA: userA.id, userB: userB.id }
          : { userA: userB.id, userB: userA.id }),
        status: createRelationshipDto.status,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ).save();

    if (!dataResponse) {
      throw new InternalServerErrorException('Cannot create relationship');
    }

    return dataResponse;
  }

  async findById(
    id: string,
    exceptionMessage?: string,
    requestedUser?: string,
  ): Promise<RelationshipDocument> {
    const data: RelationshipDocument = await this.relationshipModel
      .findOne({
        _id: id,
        deletedAt: null,
        ...(requestedUser && {
          $or: [{ userA: requestedUser }, { userB: requestedUser }],
        }),
      })
      .populate('userA')
      .populate('userB');
    if (!data) {
      throw new NotFoundException(exceptionMessage || 'Relationship not found');
    }
    return data;
  }

  async findByUserIds(
    userAId: string,
    userBId: string,
    includeDeletedCollection?: boolean,
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
      ...(!includeDeletedCollection && {
        deletedAt: null,
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
    requestedUser?: string,
  ): Promise<RelationshipDocument> {
    const relationship: any = await this.findById(id, null, requestedUser);

    return await this.relationshipModel.findByIdAndUpdate(
      id,
      {
        ...updateRelationshipDto,
        updatedAt: new Date(),
      },
      { new: true },
    );
  }

  async remove(
    id: string,
    requestedUser: string,
  ): Promise<RelationshipDocument> {
    const relationship: RelationshipDocument = await this.findById(
      id,
      null,
      requestedUser,
    );

    const timestamp = new Date();
    const isDeleted: RelationshipDocument =
      await this.relationshipModel.findByIdAndUpdate(
        id,
        {
          deletedAt: timestamp,
        },
        { new: true },
      );
    if (!isDeleted) {
      throw new InternalServerErrorException('Cannot delete user');
    }
    return isDeleted;
  }
}

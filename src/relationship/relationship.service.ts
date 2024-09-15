import {
  BadRequestException,
  Injectable,
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
import RelationshipStatus, {
  isRelationshipStatus,
} from './entities/relationship.enum';

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

    const userA = await this.userService.findById(createRelationshipDto.userA);
    if (!userA) {
      throw new NotFoundException('User A not found');
    }

    const userB = await this.userService.findById(createRelationshipDto.userB);
    if (!userB) {
      throw new NotFoundException('User B not found');
    }

    const existedRelationship = await this.relationshipModel.findOne({
      ...(createRelationshipDto.userA <= createRelationshipDto.userB
        ? { userA: userA._id, userB: userB._id }
        : { userA: userB._id, userB: userA._id }),
      deletedAt: null,
    });
    if (existedRelationship) {
      throw new BadRequestException('Relationship existed');
    }

    return await new this.relationshipModel({
      ...(createRelationshipDto.userA <= createRelationshipDto.userB
        ? { userA: userA._id, userB: userB._id }
        : { userA: userB._id, userB: userA._id }),
      status: createRelationshipDto.status,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).save();
  }

  async findById(id: string): Promise<RelationshipDocument> {
    return await this.relationshipModel
      .findOne({
        _id: id,
        deletedAt: null,
      })
      .populate('userA')
      .populate('userB');
  }

  async update(
    id: string,
    updateRelationshipDto: UpdateRelationshipDto,
  ): Promise<RelationshipDocument> {
    const relationship: RelationshipDocument =
      await this.relationshipModel.findById(id);
    if (!relationship) {
      throw new NotFoundException('Relationship not found');
    }

    if (!updateRelationshipDto.status) {
      throw new BadRequestException('Relationship status is required');
    }

    if (!isRelationshipStatus(updateRelationshipDto.status)) {
      throw new BadRequestException('Relationship status is invalid');
    }

    return await this.relationshipModel.findByIdAndUpdate(
      id,
      {
        status: updateRelationshipDto.status,
        updatedAt: new Date(),
      },
      { new: true },
    );
  }

  async remove(id: string): Promise<RelationshipDocument> {
    const relationship: RelationshipDocument =
      await this.relationshipModel.findById(id);
    if (!relationship) {
      throw new NotFoundException('Relationship not found');
    }

    return await this.relationshipModel.findByIdAndUpdate(
      id,
      {
        deletedAt: new Date(),
      },
      { new: true },
    );
  }
}

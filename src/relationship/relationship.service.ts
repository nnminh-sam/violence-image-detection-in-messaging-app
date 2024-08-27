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
    if (createRelationshipDto.firstUser === createRelationshipDto.secondUser) {
      throw new BadRequestException(
        'First user and Second user must be different',
      );
    }

    const firstUser = await this.userService.findById(
      createRelationshipDto.firstUser,
    );

    if (!firstUser) {
      throw new NotFoundException('First user not found');
    }

    const secondUser = await this.userService.findById(
      createRelationshipDto.secondUser,
    );
    if (!secondUser) {
      throw new NotFoundException('Second user not found');
    }

    let existedRelationship = await this.relationshipModel.findOne({
      firstUser: firstUser._id,
      secondUser: secondUser._id,
      deletedAt: null,
    });
    if (existedRelationship) {
      throw new BadRequestException('Relationship existed');
    }
    existedRelationship = await this.relationshipModel.findOne({
      firstUser: secondUser._id,
      secondUser: firstUser._id,
      deletedAt: null,
    });
    if (existedRelationship) {
      throw new BadRequestException('Relationship existed');
    }

    return await new this.relationshipModel({
      ...createRelationshipDto,
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
      .populate('firstUser')
      .populate('secondUser');
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

    return await this.relationshipModel.findByIdAndUpdate(
      id,
      {},
      { new: true },
    );
  }

  async remove(id: string): Promise<RelationshipDocument> {
    return `This action removes a #${id} relationship`;
  }
}

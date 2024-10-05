import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { RegistrationPayloadDto } from 'src/auth/dto/registration-payload.dto';
import { User, UserDocument } from './entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { MongooseDocumentTransformer } from 'src/helper/mongoose/document-transformer';
import { Relationship } from 'src/relationship/entities/relationship.entity';
import RelationshipStatus from 'src/relationship/entities/relationship.enum';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name)
    private userModel: Model<User>,
  ) {}

  async create(payload: RegistrationPayloadDto): Promise<UserDocument> {
    const existingUser: UserDocument = await this.findByEmail(payload.email);
    if (existingUser) throw new BadRequestException('Email is taken');

    const hashedPassword: string = await bcrypt.hash(payload.password, 10);

    try {
      return await new this.userModel({
        ...payload,
        password: hashedPassword,
      }).save();
    } catch (error) {
      throw new InternalServerErrorException('Failed to create user', error);
    }
  }

  async findByEmail(email: string): Promise<UserDocument> {
    return await this.userModel
      .findOne({
        email,
        deletedAt: null,
      })
      .select({
        __v: false,
        deletedAt: false,
      })
      .exec();
  }

  async findById(id: string): Promise<User> {
    return (await this.userModel
      .findOne({ _id: id, deletedAt: null })
      .select('-password -__v -deletedAt')
      .transform(MongooseDocumentTransformer)
      .exec()) as User;
  }

  async findUnavailableUser(id: string): Promise<User> {
    return (await this.userModel
      .findOne({ _id: id })
      .select('-password -__v')
      .transform(MongooseDocumentTransformer)
      .exec()) as User;
  }

  async findUsers(
    requestedUserId: string,
    page: number,
    size: number,
    sortBy: string,
    orderBy: string,
    searchValue: string,
    status: string,
  ) {
    const skip: number = (page - 1) * size;
    const users = await this.userModel
      .aggregate([
        {
          $match: {
            $and: [
              { _id: { $ne: new Types.ObjectId(requestedUserId) } },
              {
                ...(searchValue && {
                  $or: [
                    { email: { $regex: searchValue, $options: 'i' } },
                    { username: { $regex: searchValue, $options: 'i' } },
                    { firstName: { $regex: searchValue, $options: 'i' } },
                    { lastName: { $regex: searchValue, $options: 'i' } },
                  ],
                }),
              },
            ],
          },
        },
        {
          $lookup: {
            from: 'relationships',
            let: { userId: { $toString: '$_id' } },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $or: [
                      { $eq: ['$userA', '$$userId'] },
                      { $eq: ['$userB', '$$userId'] },
                    ],
                  },
                },
              },
            ],
            as: 'relationship',
          },
        },
        {
          $project: {
            id: '$_id',
            _id: 0,
            firstName: 1,
            lastName: 1,
            email: 1,
            relationship: {
              $cond: {
                if: { $gt: [{ $size: '$relationship' }, 0] },
                then: { $arrayElemAt: ['$relationship.status', 0] },
                else: 'no relationship',
              },
            },
          },
        },
      ])
      .skip(skip)
      .limit(size)
      .sort({
        [sortBy]: orderBy.toLowerCase() === 'asc' ? 1 : -1,
      })
      .exec();

    return {
      data: users,
      metadata: {
        page,
        size,
        count: users.length,
      },
    };
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user: User = await this.findById(id);
    if (!user) throw new NotFoundException('User not found');

    try {
      const data: UserDocument = await this.userModel
        .findByIdAndUpdate(id, { ...updateUserDto }, { new: true })
        .select('-password -__v -deletedAt')
        .exec();
      return this.findById(data._id.toString());
    } catch (error) {
      throw new InternalServerErrorException('Failed to update user', error);
    }
  }

  async remove(id: string): Promise<User> {
    const user: User = await this.findById(id);
    if (!user) throw new NotFoundException('User not found');

    try {
      const timestamp: Date = new Date();
      const data: UserDocument = await this.userModel
        .findByIdAndUpdate(id, { deletedAt: timestamp }, { new: true })
        .select('-__v -password')
        .exec();
      return {
        ...user,
        deletedAt: timestamp,
      };
    } catch (error) {
      throw new InternalServerErrorException('Failed to delete user', error);
    }
  }
}

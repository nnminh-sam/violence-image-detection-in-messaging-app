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
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { MongooseDocumentTransformer } from 'src/helper/mongoose/document-transformer';

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
  ) {
    const skip: number = (page - 1) * size;
    const filter = searchValue
      ? {
          $and: [
            {
              $or: [
                { email: { $regex: searchValue, $options: 'i' } },
                { username: { $regex: searchValue, $options: 'i' } },
                { firstName: { $regex: searchValue, $options: 'i' } },
                { lastName: { $regex: searchValue, $options: 'i' } },
              ],
            },
            {
              _id: {
                $ne: requestedUserId,
              },
            },
          ],
        }
      : {};
    const users: UserDocument[] = await this.userModel
      .find(filter)
      .select({
        firstName: 1,
        lastName: 1,
        email: 1,
      })
      .skip(skip)
      .limit(size)
      .sort({
        [sortBy]: orderBy.toLowerCase() === 'asc' ? 1 : -1,
      })
      .transform((doc: any) => {
        return doc.map(MongooseDocumentTransformer);
      })
      .exec();
    return {
      data: users,
      metadata: {
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

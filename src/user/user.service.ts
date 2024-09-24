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
      .select('-__v -deletedAt')
      .exec();
  }

  async findById(id: string): Promise<User> {
    const data: UserDocument = await this.userModel
      .findOne({ _id: id, deletedAt: null })
      .select('-password -__v -deletedAt')
      .exec();
    if (!data) return null;

    return {
      id: data._id,
      ...data,
    };
  }

  async findUnavailableUser(id: string): Promise<User> {
    const data: UserDocument = await this.userModel
      .findOne({ _id: id })
      .select('-password -__v')
      .exec();

    return {
      id: data._id,
      ...data,
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
      return {
        id: data._id,
        ...data,
      };
    } catch (error) {
      throw new InternalServerErrorException('Failed to update user', error);
    }
  }

  async remove(id: string): Promise<User> {
    const user: User = await this.findById(id);
    if (!user) throw new NotFoundException('User not found');

    try {
      const data: UserDocument = await this.userModel
        .findByIdAndUpdate(id, { deletedAt: new Date() }, { new: true })
        .select('-__v -password')
        .exec();
      return {
        id: data._id,
        ...data,
      };
    } catch (error) {
      throw new InternalServerErrorException('Failed to delete user', error);
    }
  }
}

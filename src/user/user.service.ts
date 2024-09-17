import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, UserDocument } from './entities/user.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RegistrationPayloadDto } from 'src/auth/dto/registration-payload.dto';
import * as bcrypt from 'bcrypt';
import { UserResponse } from './dto/user-response.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name)
    private userModel: Model<User>,
  ) {}

  async create(payload: RegistrationPayloadDto): Promise<UserDocument> {
    const existingUser: UserDocument = await this.findByEmail(payload.email);
    if (existingUser) {
      throw new BadRequestException('Email is taken');
    }

    const hashedPassword: string = await bcrypt.hash(payload.password, 10);

    try {
      return await new this.userModel({
        ...payload,
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).save();
    } catch (error) {
      throw new InternalServerErrorException('Failed to create user', error);
    }
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return await this.userModel.findOne({
      email,
      deletedAt: null,
    });
  }

  async findById(id: string): Promise<UserResponse | null> {
    const response = await this.userModel
      .findOne({ _id: id, deletedAt: null })
      .select('-password -__v') // * Exclude password and __v fields
      .lean() // * Returns plain JS objects, not Mongoose Documents
      .exec();

    const { _id, ...data } = response;
    return {
      id: _id.toString(),
      ...data,
    };
  }

  async findUnavailableUser(id: string): Promise<UserResponse | null> {
    const response = await this.userModel
      .findOne({ _id: id })
      .select('-password -__v') // * Exclude password and __v fields
      .lean() // * Returns plain JS objects, not Mongoose Documents
      .exec();

    const { _id, ...data } = response;
    return {
      id: _id.toString(),
      ...data,
    };
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<UserResponse> {
    const user: UserResponse = await this.findById(id);
    if (!user) throw new NotFoundException('User not found');

    try {
      await this.userModel
        .findByIdAndUpdate(
          id,
          {
            ...updateUserDto,
            updatedAt: new Date(),
          },
          { new: true },
        )
        .exec();
      return await this.findById(id);
    } catch (error) {
      throw new InternalServerErrorException('Failed to update user', error);
    }
  }

  async remove(id: string): Promise<UserResponse> {
    const user: UserResponse = await this.findById(id);
    if (!user) throw new NotFoundException('User not found');

    try {
      await this.userModel.findByIdAndUpdate(
        id,
        {
          ...user,
          deletedAt: new Date(),
        },
        { new: true },
      );
      return await this.findUnavailableUser(id);
    } catch (error) {
      throw new InternalServerErrorException('Failed to delete user', error);
    }
  }
}

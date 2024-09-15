import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, UserDocument } from './entities/user.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RegistrationPayloadDto } from 'src/auth/dto/registration-payload.dto';
import * as bcrypt from 'bcrypt';

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

    const newUser: UserDocument = new this.userModel({
      ...payload,
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return await newUser.save();
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return await this.userModel.findOne({
      email,
      deletedAt: null,
    });
  }

  async findById(id: string): Promise<UserDocument | null> {
    return await this.userModel.findOne({
      _id: id,
      deletedAt: null,
    });
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<UserDocument> {
    let user: User = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (updateUserDto?.firstName) {
      user.firstName = updateUserDto.firstName;
    }

    if (updateUserDto?.lastName) {
      user.lastName = updateUserDto.lastName;
    }

    if (updateUserDto?.email || updateUserDto?.email !== user.email) {
      throw new BadRequestException('Email cannot be updated');
    }

    if (updateUserDto?.gender) {
      user.gender = updateUserDto.gender;
    }

    if (updateUserDto?.dateOfBirth) {
      user.dateOfBirth = updateUserDto.dateOfBirth;
    }

    if (updateUserDto?.phone) {
      user.phone = updateUserDto.phone;
    }

    user.updatedAt = new Date();
    return await this.userModel
      .findByIdAndUpdate(id, user, {
        new: true,
      })
      .exec();
  }

  async remove(id: string): Promise<UserDocument> {
    let user: User = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.deletedAt = new Date();
    return await this.userModel.findByIdAndUpdate(id, user, { new: true });
  }
}

import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, UserDocument } from './entities/user.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name)
    private userModel: Model<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<UserDocument> {
    const emailTaken = await this.checkExistingEmail(createUserDto.email);
    if (emailTaken) {
      throw new BadRequestException("User's email is taken");
    }

    const newUser = new this.userModel({
      ...createUserDto,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return await newUser.save();
  }

  async checkExistingEmail(email: string): Promise<Boolean> {
    const user: UserDocument = await this.userModel.findOne({
      email: email,
      deletedAt: null,
    });
    return user != null ? true : false;
  }

  async findById(id: string): Promise<UserDocument> {
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

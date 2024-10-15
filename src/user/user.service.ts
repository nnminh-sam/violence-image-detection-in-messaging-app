import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { RegistrationPayloadDto } from 'src/auth/dto/registration-payload.dto';
import { User, UserDocument } from './entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { MongooseDocumentTransformer } from 'src/helper/mongoose/document-transformer';
import { ChangePasswordDto } from 'src/auth/dto/change-password.dto';

@Injectable()
export class UserService {
  private logger: Logger = new Logger(UserService.name);

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
      .select({
        password: 0,
        __v: 0,
        deletedAt: 0,
      })
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
    const matchingConditions = {
      $and: [
        { _id: { $ne: new Types.ObjectId(requestedUserId) } },
        {
          ...(searchValue && {
            $or: [
              { email: { $regex: searchValue, $options: 'i' } },
              { username: { $regex: searchValue, $options: 'i' } },
              { firstName: { $regex: searchValue, $options: 'i' } },
              { lastName: { $regex: searchValue, $options: 'i' } },
              {
                $expr: {
                  $regexMatch: {
                    input: { $concat: ['$firstName', ' ', '$lastName'] },
                    regex: searchValue,
                    options: 'i',
                  },
                },
              },
            ],
          }),
        },
        { deletedAt: null },
      ],
    };

    const totalDocuments = await this.userModel.countDocuments({
      ...matchingConditions,
    });
    const totalPage: number = Math.ceil(totalDocuments / size);

    const skip: number = (page - 1) * size;
    const data: any[] = await this.userModel
      .aggregate([
        { $match: { ...matchingConditions } },
        {
          $lookup: {
            from: 'relationships',
            let: { userId: { $toString: '$_id' } },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $or: [
                      {
                        $and: [
                          {
                            $eq: ['$userA', '$$userId'],
                          },
                          {
                            $eq: ['$userB', requestedUserId],
                          },
                        ],
                      },
                      {
                        $and: [
                          {
                            $eq: ['$userB', '$$userId'],
                          },
                          {
                            $eq: ['$userA', requestedUserId],
                          },
                        ],
                      },
                    ],
                  },
                },
              },
              {
                $project: {
                  id: '$_id',
                  _id: 0,
                  userA: 1,
                  userB: 1,
                  status: 1,
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
                then: { $arrayElemAt: ['$relationship', 0] },
                else: null,
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
      data,
      metadata: {
        pagination: {
          page,
          size,
          totalPage,
          totalDocument: totalDocuments,
        },
        count: data.length,
      },
    };
  }

  async findUserConversationMembershipByConversationId(
    conversationId: string,
    page: number,
    size: number,
    sortBy: string,
    orderBy: string,
  ) {
    const totalDocument: number = await this.userModel.countDocuments();
    const totalPage: number = Math.ceil(totalDocument / size);

    const skip: number = (page - 1) * size;
    const pipeline = [
      {
        $lookup: {
          from: 'memberships',
          let: { userId: { $toString: '$_id' } },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$user', '$$userId'] },
                    { $eq: ['$conversation', conversationId] },
                  ],
                },
              },
            },
            {
              $project: {
                id: '$_id',
                _id: 0,
                role: 1,
                status: 1,
              },
            },
          ],
          as: 'membership',
        },
      },
      {
        $unwind: {
          path: '$membership',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          id: '$_id',
          _id: 0,
          firstName: 1,
          lastName: 1,
          email: 1,
          membership: 1,
        },
      },
    ];

    const memberships = await this.userModel
      .aggregate(pipeline)
      .skip(skip)
      .limit(size)
      .sort({
        [sortBy]: orderBy.toLowerCase() === 'asc' ? 1 : -1,
      })
      .exec();
    return {
      data: memberships,
      metadata: {
        pagination: {
          page,
          size,
          totalPage,
        },
        count: memberships.length,
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
      this.logger.fatal(error);
      throw new InternalServerErrorException('Failed to update user', error);
    }
  }

  async updatePassword(
    userId: string,
    changePasswordDto: ChangePasswordDto,
  ): Promise<User> {
    const user: UserDocument = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const oldPasswordMatch = bcrypt.compareSync(
      changePasswordDto.currentPassword,
      user.password,
    );
    if (!oldPasswordMatch) {
      throw new UnauthorizedException('Wrong password');
    }

    try {
      const hashedPassword: string = await bcrypt.hash(
        changePasswordDto.newPassword,
        10,
      );

      const data = await this.userModel
        .findByIdAndUpdate(userId, {
          password: hashedPassword,
        })
        .exec();
      return await this.findById(userId);
    } catch (error: any) {
      this.logger.fatal(error);
      throw new InternalServerErrorException(
        'Failed to update user password',
        error,
      );
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
      this.logger.fatal(error);
      throw new InternalServerErrorException('Failed to delete user', error);
    }
  }
}

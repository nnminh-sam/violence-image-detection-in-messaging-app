import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  UnauthorizedException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Conversation,
  ConversationDocument,
  PopulatedConversation,
} from './entities/conversation.entity';
import { UserService } from 'src/user/user.service';
import { User } from 'src/user/entities/user.entity';
import { MongooseDocumentTransformer } from 'src/helper/mongoose/document-transofrmer';

@Injectable()
export class ConversationService {
  private readonly logger: Logger = new Logger(ConversationService.name);

  constructor(
    @InjectModel(Conversation.name)
    private conversationModel: Model<Conversation>,

    private readonly userService: UserService,
  ) {}

  async create(
    createConversationDto: CreateConversationDto,
  ): Promise<PopulatedConversation> {
    const creator: User = await this.userService.findById(
      createConversationDto.createdBy,
    );
    if (!creator) throw new NotFoundException('Conversation creator not found');

    const host: User = await this.userService.findById(
      createConversationDto.host,
    );
    if (!host) throw new NotFoundException('Conversation host not found');

    const existedName = await this.isNameExisted(createConversationDto.name);
    if (existedName)
      throw new BadRequestException("Conversation's name is taken");

    try {
      const data: ConversationDocument = await new this.conversationModel({
        ...createConversationDto,
      }).save();
      return await this.findById(data._id.toString());
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to create conversation',
        error,
      );
    }
  }

  async isNameExisted(name: string): Promise<Boolean> {
    const conversation: ConversationDocument =
      await this.conversationModel.findOne({
        name: name,
        deletedAt: null,
      });
    return conversation != null ? true : false;
  }

  async findById(id: string): Promise<PopulatedConversation> {
    return (await this.conversationModel
      .findOne({
        _id: id,
        deletedAt: null,
      })
      .populate({
        path: 'createdBy',
        select: '-__v -deletedAt -password',
        transform: MongooseDocumentTransformer,
      })
      .populate({
        path: 'host',
        select: '-__v -deletedAt -password',
        transform: MongooseDocumentTransformer,
      })
      .select('-__v -deletedAt')
      .lean()
      .transform(MongooseDocumentTransformer)
      .exec()) as PopulatedConversation;
  }

  async isConversationHost(
    conversationId: string,
    userId: string,
  ): Promise<boolean> {
    const conversation: PopulatedConversation =
      await this.findById(conversationId);
    const host: User = conversation.host as User;
    return host.id === userId;
  }

  async update(
    id: string,
    updateConversationDto: UpdateConversationDto,
    requestedUser: string,
  ): Promise<PopulatedConversation> {
    const conversation: PopulatedConversation = await this.findById(id);
    if (!conversation) throw new NotFoundException('Conversation not found');

    const isAuthorizedUser: boolean = await this.isConversationHost(
      id,
      requestedUser,
    );
    if (!isAuthorizedUser) throw new UnauthorizedException('Unauthorized user');

    try {
      const data: ConversationDocument = await this.conversationModel
        .findByIdAndUpdate(id, { ...updateConversationDto }, { new: true })
        .exec();

      return await this.findById(data._id.toString());
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException(
        'Failed to update conversation',
        error,
      );
    }
  }

  async remove(
    id: string,
    requestedUser: string,
  ): Promise<PopulatedConversation> {
    const conversation: PopulatedConversation = await this.findById(id);
    if (!conversation) throw new NotFoundException('Conversation not found');

    const isAuthorizedUser: boolean = await this.isConversationHost(
      id,
      requestedUser,
    );
    if (!isAuthorizedUser) throw new UnauthorizedException('Unauthorized user');

    try {
      const timestamp: Date = new Date();
      const data: ConversationDocument = await this.conversationModel
        .findByIdAndUpdate(id, { deletedAt: timestamp }, { new: true })
        .exec();

      return {
        ...conversation,
        deletedAt: timestamp,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to remove conversation',
        error,
      );
    }
  }
}

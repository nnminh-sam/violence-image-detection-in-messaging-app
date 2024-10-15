import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  NotFoundException,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ConversationService } from './conversation.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';
import { JwtGuard } from 'src/auth/guards/jwt.guard';
import * as dotenv from 'dotenv';
import { RequestedUser } from 'src/decorator/requested-user.decorator';
import { PopulatedConversation } from './entities/conversation.entity';
dotenv.config();

const envVar = process.env;
const API_URL = `${envVar.API_PREFIX}/${envVar.API_VERSION}/conversations`;

@UseGuards(JwtGuard)
@Controller(API_URL)
export class ConversationController {
  constructor(private readonly conversationService: ConversationService) {}

  @Post()
  async create(
    @Body() createConversationDto: CreateConversationDto,
  ): Promise<PopulatedConversation> {
    return await this.conversationService.create(createConversationDto);
  }

  @Get('')
  async findOneByName(@Query('name') name: string) {
    const conversation: PopulatedConversation =
      await this.conversationService.findOneByName(name);
    if (!conversation) throw new NotFoundException('Conversation not found');
    return conversation;
  }

  @Get(':id')
  async findOne(
    @RequestedUser() user: any,
    @Param('id') id: string,
  ): Promise<PopulatedConversation> {
    const conversation: PopulatedConversation =
      await this.conversationService.findById(id);
    if (!conversation) throw new NotFoundException('Conversation not found');
    return conversation;
  }

  @Patch(':id')
  async update(
    @RequestedUser() user: any,
    @Param('id') id: string,
    @Body() updateConversationDto: UpdateConversationDto,
  ): Promise<PopulatedConversation> {
    return await this.conversationService.update(
      id,
      updateConversationDto,
      user.id,
    );
  }

  @Delete(':id')
  async remove(
    @RequestedUser() user: any,
    @Param('id') id: string,
  ): Promise<PopulatedConversation> {
    return await this.conversationService.remove(id, user.id);
  }
}

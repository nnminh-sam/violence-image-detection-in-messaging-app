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
} from '@nestjs/common';
import { ConversationService } from './conversation.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';
import { JwtGuard } from 'src/auth/guards/jwt.guard';
import * as dotenv from 'dotenv';
import { RequestedUser } from 'src/decorator/requested-user.decorator';
import { Conversation } from './entities/conversation.entity';
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
  ): Promise<Conversation> {
    return await this.conversationService.create(createConversationDto);
  }

  @Get('/:id')
  async findOne(
    @RequestedUser() user: any,
    @Param('id') id: string,
  ): Promise<Conversation> {
    const conversation: Conversation =
      await this.conversationService.findById(id);
    if (!conversation) throw new NotFoundException('Conversation not found');
    return conversation;
  }

  @Patch('/:id')
  async update(
    @RequestedUser() user: any,
    @Param('id') id: string,
    @Body() updateConversationDto: UpdateConversationDto,
  ): Promise<Conversation> {
    return await this.conversationService.update(
      id,
      updateConversationDto,
      user.id,
    );
  }

  @Delete('/:id')
  async remove(
    @RequestedUser() user: any,
    @Param('id') id: string,
  ): Promise<Conversation> {
    return await this.conversationService.remove(id, user.id);
  }
}

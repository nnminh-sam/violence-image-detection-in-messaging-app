import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  NotFoundException,
} from '@nestjs/common';
import { ConversationService } from './conversation.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';

import * as dotenv from 'dotenv';

dotenv.config();

const envVar = process.env;
const API_URL = `${envVar.API_PREFIX}/${envVar.API_VERSION}/conversations`;

@Controller(API_URL)
export class ConversationController {
  constructor(private readonly conversationService: ConversationService) {}

  @Post()
  async create(@Body() createConversationDto: CreateConversationDto) {
    return await this.conversationService.create(createConversationDto);
  }

  @Get('/:id')
  async findOne(@Param('id') id: string) {
    const conversation = await this.conversationService.findById(id);
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    return conversation;
  }

  @Patch('/:id')
  async update(
    @Param('id') id: string,
    @Body() updateConversationDto: UpdateConversationDto,
  ) {
    return await this.conversationService.update(id, updateConversationDto);
  }

  @Delete('/:id')
  async remove(@Param('id') id: string) {
    return await this.conversationService.remove(id);
  }
}

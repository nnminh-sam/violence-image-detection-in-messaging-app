import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ConversationHistoryService } from './conversation-history.service';
import { CreateConversationHistoryDto } from './dto/create-conversation-history.dto';
import { UpdateConversationHistoryDto } from './dto/update-conversation-history.dto';

import * as dotenv from 'dotenv';
dotenv.config();

const envVar = process.env;
const API_URL = `${envVar.API_PREFIX}/${envVar.API_VERSION}/conversation-histories`;

@Controller(API_URL)
export class ConversationHistoryController {
  constructor(
    private readonly conversationHistoryService: ConversationHistoryService,
  ) {}

  @Post()
  create(@Body() createConversationHistoryDto: CreateConversationHistoryDto) {
    return this.conversationHistoryService.create(createConversationHistoryDto);
  }

  @Get('/:id')
  findOne(@Param('id') id: string) {
    return this.conversationHistoryService.findById(id);
  }

  @Patch('/:id')
  update(
    @Param('id') id: string,
    @Body() updateConversationHistoryDto: UpdateConversationHistoryDto,
  ) {
    return this.conversationHistoryService.update(
      id,
      updateConversationHistoryDto,
    );
  }

  @Delete('/:id')
  remove(@Param('id') id: string) {
    return this.conversationHistoryService.remove(id);
  }
}

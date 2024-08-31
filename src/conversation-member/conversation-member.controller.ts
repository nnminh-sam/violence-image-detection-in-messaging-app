import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ConversationMemberService } from './conversation-member.service';
import { CreateConversationMemberDto } from './dto/create-conversation-member.dto';
import { UpdateConversationMemberDto } from './dto/update-conversation-member.dto';

import * as dotenv from 'dotenv';
dotenv.config();
const envVar = process.env;
const API_URL = `${envVar.API_PREFIX}/${envVar.API_VERSION}/conversation-members`;

@Controller(API_URL)
export class ConversationMemberController {
  constructor(
    private readonly conversationMemberService: ConversationMemberService,
  ) {}

  @Post()
  create(@Body() createConversationMemberDto: CreateConversationMemberDto) {
    return this.conversationMemberService.create(createConversationMemberDto);
  }

  @Get('/:id')
  findOne(@Param('id') id: string) {
    return this.conversationMemberService.findById(id);
  }

  @Patch('/:id')
  update(
    @Param('id') id: string,
    @Body() updateConversationMemberDto: UpdateConversationMemberDto,
  ) {
    return this.conversationMemberService.update(
      id,
      updateConversationMemberDto,
    );
  }

  @Delete('/:id')
  remove(@Param('id') id: string) {
    return this.conversationMemberService.remove(id);
  }
}

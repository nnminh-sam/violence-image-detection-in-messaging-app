import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  NotFoundException,
} from '@nestjs/common';
import { ConversationMemberService } from './conversation-member.service';
import { CreateConversationMemberDto } from './dto/create-conversation-member.dto';
import { UpdateConversationMemberDto } from './dto/update-conversation-member.dto';

import * as dotenv from 'dotenv';
import { JwtGuard } from 'src/auth/guards/jwt.guard';
dotenv.config();
const envVar = process.env;
const API_URL = `${envVar.API_PREFIX}/${envVar.API_VERSION}/conversation-members`;

@UseGuards(JwtGuard)
@Controller(API_URL)
export class ConversationMemberController {
  constructor(
    private readonly conversationMemberService: ConversationMemberService,
  ) {}

  @Post()
  async create(
    @Req() request: any,
    @Body() createConversationMemberDto: CreateConversationMemberDto,
  ) {
    const user: any = request.user;
    return await this.conversationMemberService.create(
      user.id,
      createConversationMemberDto,
    );
  }

  @Get('/:id')
  async findOne(@Param('id') id: string) {
    const data = await this.conversationMemberService.findById(id);
    if (!data) throw new NotFoundException('Conversation membership not found');
    return data;
  }

  @Patch('/:id')
  async update(
    @Req() request: any,
    @Param('id') id: string,
    @Body() updateConversationMemberDto: UpdateConversationMemberDto,
  ) {
    const user: any = request.user;
    return await this.conversationMemberService.update(
      id,
      user.id,
      updateConversationMemberDto,
    );
  }

  @Delete('/:id')
  async remove(@Req() request: any, @Param('id') id: string) {
    const user: any = request.user;
    return await this.conversationMemberService.remove(id, user.id);
  }
}

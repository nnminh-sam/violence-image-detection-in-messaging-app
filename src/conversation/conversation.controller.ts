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
  Req,
} from '@nestjs/common';
import { ConversationService } from './conversation.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';
import { JwtGuard } from 'src/auth/guards/jwt.guard';
import * as dotenv from 'dotenv';
dotenv.config();

const envVar = process.env;
const API_URL = `${envVar.API_PREFIX}/${envVar.API_VERSION}/conversations`;

@UseGuards(JwtGuard)
@Controller(API_URL)
export class ConversationController {
  constructor(private readonly conversationService: ConversationService) {}

  @Post()
  async create(@Body() createConversationDto: CreateConversationDto) {
    return await this.conversationService.create(createConversationDto);
  }

  @Get('/:id')
  async findOne(@Req() request: any, @Param('id') id: string) {
    const user: any = request.user;
    const conversation = await this.conversationService.findById(id);
    if (!conversation) throw new NotFoundException('Conversation not found');
    return conversation;
  }

  @Patch('/:id')
  async update(
    @Req() request: any,
    @Param('id') id: string,
    @Body() updateConversationDto: UpdateConversationDto,
  ) {
    const user: any = request.user;
    return await this.conversationService.update(
      id,
      updateConversationDto,
      user.id,
    );
  }

  @Delete('/:id')
  async remove(@Req() request: any, @Param('id') id: string) {
    const user: any = request.user;
    return await this.conversationService.remove(id, user.id);
  }
}

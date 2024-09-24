import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  NotFoundException,
  Query,
} from '@nestjs/common';
import { MessageService } from './message.service';
import { CreateMessageDto } from './dto/create-conversation-history.dto';
import { UpdateMessageDto } from './dto/update-conversation-history.dto';
import { JwtGuard } from 'src/auth/guards/jwt.guard';
import * as dotenv from 'dotenv';
import { RequestedUser } from 'src/decorator/requested-user.decorator';
dotenv.config();

const envVar = process.env;
const API_URL = `${envVar.API_PREFIX}/${envVar.API_VERSION}/conversation-histories`;

@UseGuards(JwtGuard)
@Controller(API_URL)
export class MessageController {
  constructor(private readonly MessageService: MessageService) {}

  @Post()
  async create(
    @RequestedUser() user: any,
    @Body() createMessageDto: CreateMessageDto,
  ) {
    return await this.MessageService.create(createMessageDto, user.id);
  }

  @Get('conversation/:conversationId')
  async findHistoryOfConversation(
    @RequestedUser() user: any,
    @Param('conversationId') conversationId: string,
    @Query('page')
    page: number,
    @Query('size') size: number,
  ) {
    return await this.MessageService.findMessage(
      conversationId,
      page,
      size,
      user.id,
    );
  }

  @Get('/:id')
  async findOne(@Param('id') id: string) {
    const data = await this.MessageService.findById(id);
    if (!data) throw new NotFoundException('History not found');
    return data;
  }

  @Patch('/:id')
  async update(
    @RequestedUser() user: any,
    @Param('id') id: string,
    @Body() updateMessageDto: UpdateMessageDto,
  ) {
    return await this.MessageService.update(id, updateMessageDto, user.id);
  }

  @Delete('/:id')
  async remove(@RequestedUser() user: any, @Param('id') id: string) {
    return await this.MessageService.remove(id, user.id);
  }
}

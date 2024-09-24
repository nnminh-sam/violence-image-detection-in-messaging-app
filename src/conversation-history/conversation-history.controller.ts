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
  Query,
} from '@nestjs/common';
import { ConversationHistoryService } from './conversation-history.service';
import { CreateConversationHistoryDto } from './dto/create-conversation-history.dto';
import { UpdateConversationHistoryDto } from './dto/update-conversation-history.dto';
import { JwtGuard } from 'src/auth/guards/jwt.guard';
import { PopulatedConversationHistoryDocument } from './entities/conversation-history.entity';
import * as dotenv from 'dotenv';
dotenv.config();

const envVar = process.env;
const API_URL = `${envVar.API_PREFIX}/${envVar.API_VERSION}/conversation-histories`;

@UseGuards(JwtGuard)
@Controller(API_URL)
export class ConversationHistoryController {
  constructor(
    private readonly conversationHistoryService: ConversationHistoryService,
  ) {}

  @Post()
  async create(
    @Req() request: any,
    @Body() createConversationHistoryDto: CreateConversationHistoryDto,
  ) {
    const user: any = request.user;
    return await this.conversationHistoryService.create(
      createConversationHistoryDto,
      user.id,
    );
  }

  @Get('conversation/:conversationId')
  async findHistoryOfConversation(
    @Req() request: any,
    @Param('conversationId') conversationId: string,
    @Query('page')
    page: number,
    @Query('size') size: number,
  ): Promise<PopulatedConversationHistoryDocument[]> {
    const user: any = request.user;
    return await this.conversationHistoryService.findConversationHistory(
      conversationId,
      page,
      size,
      user.id,
    );
  }

  @Get('/:id')
  async findOne(@Param('id') id: string) {
    const data = await this.conversationHistoryService.findById(id);
    if (!data) throw new NotFoundException('History not found');
    return data;
  }

  @Patch('/:id')
  async update(
    @Req() request: any,
    @Param('id') id: string,
    @Body() updateConversationHistoryDto: UpdateConversationHistoryDto,
  ) {
    const user: any = request.user;
    return await this.conversationHistoryService.update(
      id,
      updateConversationHistoryDto,
      user.id,
    );
  }

  @Delete('/:id')
  async remove(@Req() request: any, @Param('id') id: string) {
    const user: any = request.user;
    return await this.conversationHistoryService.remove(id, user.id);
  }
}

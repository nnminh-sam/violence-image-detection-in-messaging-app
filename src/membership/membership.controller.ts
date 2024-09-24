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
import { MembershipService } from './membership.service';
import { CreateMembershipDto } from './dto/create-membership.dto';
import { UpdateMembershipDto } from './dto/update-membership.dto';

import * as dotenv from 'dotenv';
import { JwtGuard } from 'src/auth/guards/jwt.guard';
import { RequestedUser } from 'src/decorator/requested-user.decorator';
dotenv.config();
const envVar = process.env;
const API_URL = `${envVar.API_PREFIX}/${envVar.API_VERSION}/conversation-members`;

@UseGuards(JwtGuard)
@Controller(API_URL)
export class MembershipController {
  constructor(private readonly MembershipService: MembershipService) {}

  @Post()
  async create(
    @Req() request: any,
    @Body() createMembershipDto: CreateMembershipDto,
  ) {
    const user: any = request.user;
    return await this.MembershipService.create(user.id, createMembershipDto);
  }

  @Get('conversation/:conversationId')
  async findMemberships(
    @RequestedUser() user: any,
    @Param('conversationId') conversationId: string,
  ) {
    return this.MembershipService.findMemberships(conversationId, user.id);
  }

  @Get('/:id')
  async findOne(@Param('id') id: string) {
    const data = await this.MembershipService.findById(id);
    if (!data) throw new NotFoundException('Conversation membership not found');
    return data;
  }

  @Patch('/:id')
  async update(
    @RequestedUser() user: any,
    @Param('id') id: string,
    @Body() updateMembershipDto: UpdateMembershipDto,
  ) {
    return await this.MembershipService.update(
      id,
      user.id,
      updateMembershipDto,
    );
  }

  @Delete('/:id')
  async remove(@RequestedUser() user: any, @Param('id') id: string) {
    return await this.MembershipService.remove(id, user.id);
  }
}

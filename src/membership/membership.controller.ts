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
import { RequestedUser } from 'src/decorator/requested-user.decorator';
import { CreateMembershipDto } from './dto/create-membership.dto';
import { UpdateMembershipDto } from './dto/update-membership.dto';
import { MembershipService } from './membership.service';
import { JwtGuard } from 'src/auth/guards/jwt.guard';
import * as dotenv from 'dotenv';
dotenv.config();

const envVar = process.env;
const API_URL = `${envVar.API_PREFIX}/${envVar.API_VERSION}/memberships`;

@UseGuards(JwtGuard)
@Controller(API_URL)
export class MembershipController {
  constructor(private readonly membershipService: MembershipService) {}

  @Post()
  async create(
    @Req() request: any,
    @Body() createMembershipDto: CreateMembershipDto,
  ) {
    const user: any = request.user;
    return await this.membershipService.create(user.id, createMembershipDto);
  }

  @Get('conversation/:conversationId')
  async findMemberships(
    @RequestedUser() user: any,
    @Param('conversationId') conversationId: string,
    @Query('page') page: number,
    @Query('size') size: number,
    @Query('sortBy') sortBy: string,
    @Query('orderBy') orderBy: string,
  ) {
    page = page || 1;
    size = size || 10;
    sortBy = sortBy || 'id';
    orderBy = orderBy?.toLowerCase() || 'asc';

    return this.membershipService.findMemberships(
      conversationId,
      user.id,
      page,
      size,
      sortBy,
      orderBy,
    );
  }

  @Get('participated-conversations/')
  async findParticipatedConversations(
    @RequestedUser() user: any,
    @Query('page') page: number,
    @Query('size') size: number,
    @Query('sortBy') sortBy: string,
    @Query('orderBy') orderBy: string,
  ) {
    page = page || 1;
    size = size || 10;
    sortBy = sortBy || 'id';
    orderBy = orderBy?.toLowerCase() || 'asc';

    return await this.membershipService.findParticipatedConversations(
      user.id,
      page,
      size,
      sortBy,
      orderBy,
    );
  }

  @Get('/:id')
  async findOne(@Param('id') id: string) {
    const data = await this.membershipService.findById(id);
    if (!data) throw new NotFoundException('Conversation membership not found');
    return data;
  }

  @Patch('/:id')
  async update(
    @RequestedUser() user: any,
    @Param('id') id: string,
    @Body() updateMembershipDto: UpdateMembershipDto,
  ) {
    return await this.membershipService.update(
      id,
      user.id,
      updateMembershipDto,
    );
  }

  @Delete('/:id')
  async remove(@RequestedUser() user: any, @Param('id') id: string) {
    return await this.membershipService.remove(id, user.id);
  }
}

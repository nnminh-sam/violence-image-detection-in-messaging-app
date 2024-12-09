import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  Query,
  Delete,
} from '@nestjs/common';
import { RelationshipService } from './relationship.service';
import { CreateRelationshipDto } from './dto/create-relationship.dto';
import { UpdateRelationshipDto } from './dto/update-relationship.dto';
import { JwtGuard } from 'src/auth/guards/jwt.guard';
import { BlockUserDto } from './dto/block-user.dto';
import { RequestedUser } from 'src/decorator/requested-user.decorator';
import { PopulatedRelationship } from './entities/relationship.entity';
import * as dotenv from 'dotenv';
dotenv.config();

const envVar = process.env;
const API_URL = `${envVar.API_PREFIX}/${envVar.API_VERSION}/relationships`;

@UseGuards(JwtGuard)
@Controller(API_URL)
export class RelationshipController {
  constructor(private readonly relationshipService: RelationshipService) {}

  @Post()
  async create(
    @RequestedUser() user: any,
    @Body() createRelationshipDto: CreateRelationshipDto,
  ): Promise<PopulatedRelationship> {
    return await this.relationshipService.create(
      createRelationshipDto,
      user.id,
    );
  }

  @Get('/my')
  async findRelationshipOf(
    @RequestedUser() user: any,
    @Query('page') page: number,
    @Query('size') size: number,
    @Query('sortBy') sortBy: string,
    @Query('orderBy') orderBy: string,
    @Query('name') name: string,
  ) {
    return await this.relationshipService.findMyRelationships(
      user.id,
      page || 1,
      size || 10,
      sortBy || 'createdAt',
      orderBy || 'desc',
      name,
    );
  }

  @Get(':id')
  async findOne(
    @RequestedUser() user: any,
    @Param('id') id: string,
  ): Promise<PopulatedRelationship> {
    return await this.relationshipService.findMyRelationshipById(id, user.id);
  }

  @Patch('accept/:relationshipId')
  async confirmFriend(
    @RequestedUser() user: any,
    @Param('relationshipId') relationshipId: string,
  ) {
    return await this.relationshipService.acceptRelationshipRequest(
      user.id,
      relationshipId,
    );
  }

  @Patch('unblock/:relationshipId')
  async unblockUser(
    @RequestedUser() user: any,
    @Param('relationshipId') relationshipId: string,
  ) {
    return await this.relationshipService.unblockUser(user.id, relationshipId);
  }

  @Patch('block')
  async blockUser(
    @RequestedUser() user: any,
    @Body() blockUserDto: BlockUserDto,
  ): Promise<PopulatedRelationship> {
    return await this.relationshipService.blockUser(user.id, blockUserDto);
  }

  @Patch(':id')
  async update(
    @RequestedUser() user: any,
    @Param('id') id: string,
    @Body() updateRelationshipDto: UpdateRelationshipDto,
  ): Promise<PopulatedRelationship> {
    return await this.relationshipService.update(
      id,
      updateRelationshipDto,
      user.id,
    );
  }

  @Delete(':id')
  async delete(@RequestedUser() user: any, @Param('id') id: string) {
    return await this.relationshipService.delete(id, user.id);
  }
}

import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  Query,
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
    @Body() createRelationshipDto: CreateRelationshipDto,
  ): Promise<PopulatedRelationship> {
    return await this.relationshipService.create(createRelationshipDto);
  }

  @Get('/my')
  async findRelationshipOf(
    @RequestedUser() user: any,
    @Query('page') page: number,
    @Query('size') size: number,
    @Query('sortBy') sortBy: string,
    @Query('orderBy') orderBy: string,
    @Query('status') status: string,
  ) {
    return await this.relationshipService.findAll(
      user.id,
      page || 1,
      size || 10,
      sortBy || 'createdAt',
      orderBy || 'desc',
      status || 'friends',
    );
  }

  @Get(':id')
  async findOne(
    @RequestedUser() user: any,
    @Param('id') id: string,
  ): Promise<PopulatedRelationship> {
    return await this.relationshipService.findMyRelationship(id, user.id);
  }

  @Patch('block-user')
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
}

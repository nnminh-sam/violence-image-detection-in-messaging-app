import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { RelationshipService } from './relationship.service';
import { CreateRelationshipDto } from './dto/create-relationship.dto';
import { UpdateRelationshipDto } from './dto/update-relationship.dto';
import { JwtGuard } from 'src/auth/guards/jwt.guard';
import { BlockUserDto } from './dto/block-user.dto';
import { RequestedUser } from 'src/decorator/requested-user.decorator';
import * as dotenv from 'dotenv';
import { Relationship } from './entities/relationship.entity';
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
  ): Promise<Relationship> {
    return await this.relationshipService.create(createRelationshipDto);
  }

  @Get('/my')
  async findRelationshipOf(
    @RequestedUser() user: any,
  ): Promise<Relationship[]> {
    return await this.relationshipService.findAllMyRelationship(user.id);
  }

  @Get(':id')
  async findOne(
    @RequestedUser() user: any,
    @Param('id') id: string,
  ): Promise<Relationship> {
    const data: Relationship = await this.relationshipService.findById(
      id,
      user.id,
    );
    if (!data) throw new NotFoundException('Relationship not found');
    return data;
  }

  @Patch('block-user')
  async blockUser(
    @RequestedUser() user: any,
    @Body() blockUserDto: BlockUserDto,
  ): Promise<Relationship> {
    return await this.relationshipService.blockUser(user.id, blockUserDto);
  }

  @Patch(':id')
  async update(
    @RequestedUser() user: any,
    @Param('id') id: string,
    @Body() updateRelationshipDto: UpdateRelationshipDto,
  ): Promise<Relationship> {
    return await this.relationshipService.update(
      id,
      updateRelationshipDto,
      user.id,
    );
  }
}

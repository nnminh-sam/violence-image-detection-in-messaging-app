import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  NotFoundException,
} from '@nestjs/common';
import { RelationshipService } from './relationship.service';
import { CreateRelationshipDto } from './dto/create-relationship.dto';
import { UpdateRelationshipDto } from './dto/update-relationship.dto';

import * as dotenv from 'dotenv';

dotenv.config();

const envVar = process.env;
const API_URL = `${envVar.API_PREFIX}/${envVar.API_VERSION}/relationships`;

@Controller(API_URL)
export class RelationshipController {
  constructor(private readonly relationshipService: RelationshipService) {}

  @Post()
  async create(@Body() createRelationshipDto: CreateRelationshipDto) {
    return await this.relationshipService.create(createRelationshipDto);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const relationship = await this.relationshipService.findById(id);
    if (!relationship) {
      throw new NotFoundException('Relationship not found');
    }
    return relationship;
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateRelationshipDto: UpdateRelationshipDto,
  ) {
    return await this.relationshipService.update(id, updateRelationshipDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.relationshipService.remove(id);
  }
}

import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  UseGuards,
} from '@nestjs/common';
import { RelationshipService } from './relationship.service';
import { CreateRelationshipDto } from './dto/create-relationship.dto';
import { UpdateRelationshipDto } from './dto/update-relationship.dto';

import * as dotenv from 'dotenv';
import { JwtGuard } from 'src/auth/guards/jwt.guard';

dotenv.config();

const envVar = process.env;
const API_URL = `${envVar.API_PREFIX}/${envVar.API_VERSION}/relationships`;

@UseGuards(JwtGuard)
@Controller(API_URL)
export class RelationshipController {
  constructor(private readonly relationshipService: RelationshipService) {}

  @Post()
  async create(@Body() createRelationshipDto: CreateRelationshipDto) {
    return await this.relationshipService.create(createRelationshipDto);
  }

  @Get('/my')
  async findRelationshipOf(@Req() request: any) {
    const user: any = request.user;
    return await this.relationshipService.findAllMyRelationship(user.id);
  }

  @Get(':id')
  async findOne(@Req() request: any, @Param('id') id: string) {
    const user: any = request.user;
    return await this.relationshipService.findById(id, null, user.id);
  }

  @Patch(':id')
  async update(
    @Req() request: any,
    @Param('id') id: string,
    @Body() updateRelationshipDto: UpdateRelationshipDto,
  ) {
    const user: any = request.user;
    return await this.relationshipService.update(
      id,
      updateRelationshipDto,
      user.id,
    );
  }

  @Delete(':id')
  async remove(@Req() request: any, @Param('id') id: string) {
    const user: any = request.user;
    return await this.relationshipService.remove(id, user.id);
  }
}

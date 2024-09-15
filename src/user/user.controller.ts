import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

import * as dotenv from 'dotenv';

dotenv.config();
const envVar = process.env;
const API_URL = `${envVar.API_PREFIX}/${envVar.API_VERSION}/users`;

@Controller(API_URL)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('/:id')
  findOne(@Param('id') id: string) {
    return this.userService.findById(id);
  }

  @Patch('/:id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(id, updateUserDto);
  }

  @Delete('/:id')
  remove(@Param('id') id: string) {
    return this.userService.remove(id);
  }
}

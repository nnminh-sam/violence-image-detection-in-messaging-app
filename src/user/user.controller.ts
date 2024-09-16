import {
  Controller,
  Get,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  NotFoundException,
} from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtGuard } from 'src/auth/guards/jwt.guard';

import * as dotenv from 'dotenv';
import { UserResponse } from './dto/user-response.dto';

dotenv.config();
const envVar = process.env;
const API_URL = `${envVar.API_PREFIX}/${envVar.API_VERSION}/users`;

@UseGuards(JwtGuard)
@Controller(API_URL)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('/my')
  async findOne(@Req() request: any) {
    const user: UserResponse = await this.userService.findById(request.user.id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  @Patch()
  async update(@Req() request: any, @Body() updateUserDto: UpdateUserDto) {
    const user: any = request.user;
    return this.userService.update(user.id, updateUserDto);
  }

  @Delete()
  async remove(@Req() request: any) {
    const user: any = request.user;
    return this.userService.remove(user.id);
  }
}

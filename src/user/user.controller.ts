import {
  Controller,
  Get,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtGuard } from 'src/auth/guards/jwt.guard';

import * as dotenv from 'dotenv';
import { UserResponse } from './dto/user-response.dto';
import { CustomApiResponse } from 'src/helper/dto/custom-api-response.dto';

dotenv.config();
const envVar = process.env;
const API_URL = `${envVar.API_PREFIX}/${envVar.API_VERSION}/users`;

@Controller(API_URL)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('/my')
  @UseGuards(JwtGuard)
  async findOne(@Req() request: any) {
    const user: UserResponse = await this.userService.findById(request.user.id);
    if (!user) {
      return {
        data: null,
        error: {
          status: 404,
          name: 'NotFoundError',
          message: 'Cannot find user',
          details: [],
        },
      };
    }

    return user;
  }

  @Patch('/:id')
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(id, updateUserDto);
  }

  @Delete('/:id')
  async remove(@Param('id') id: string) {
    return this.userService.remove(id);
  }
}

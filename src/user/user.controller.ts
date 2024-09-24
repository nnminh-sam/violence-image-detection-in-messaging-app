import {
  Controller,
  Get,
  Body,
  Patch,
  Delete,
  UseGuards,
  Req,
  NotFoundException,
} from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtGuard } from 'src/auth/guards/jwt.guard';
import { RequestedUser } from 'src/decorator/requested-user.decorator';
import { User } from './entities/user.entity';
import * as dotenv from 'dotenv';
dotenv.config();

const envVar = process.env;
const API_URL = `${envVar.API_PREFIX}/${envVar.API_VERSION}/users`;

@UseGuards(JwtGuard)
@Controller(API_URL)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('/my')
  async findOne(@RequestedUser() user: any) {
    const response: User = await this.userService.findById(user.id);
    if (!response) throw new NotFoundException('User not found');
    return response;
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

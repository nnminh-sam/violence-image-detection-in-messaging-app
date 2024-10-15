import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  UseGuards,
  Headers,
  BadRequestException,
  Patch,
} from '@nestjs/common';
import { RequestedUser } from 'src/decorator/requested-user.decorator';
import { RegistrationPayloadDto } from './dto/registration-payload.dto';
import { LocalGuard } from './guards/local.guard';
import { AuthService } from './auth.service';
import * as dotenv from 'dotenv';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtGuard } from './guards/jwt.guard';

dotenv.config();
const envVar = process.env;
const API_URL = `${envVar.API_PREFIX}/${envVar.API_VERSION}/auth`;

@Controller(API_URL)
// @UseGuards()
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @UseGuards(LocalGuard)
  @HttpCode(200)
  async login(@RequestedUser() user) {
    return await this.authService.login(user);
  }

  @Post('register')
  @HttpCode(200)
  async register(
    @Body()
    registrationPayload: RegistrationPayloadDto,
  ) {
    return await this.authService.register(registrationPayload);
  }

  @Get('validate-token')
  async validateToken(@Headers('authorization') authHeader: string) {
    if (!authHeader) throw new BadRequestException('Token not found');
    const token: string = authHeader.split(' ')[1];
    if (!token) throw new BadRequestException('Token not found');
    return await this.authService.validateToken(token);
  }

  @UseGuards(JwtGuard)
  @Patch('change-password')
  async changePassword(
    @RequestedUser() user: any,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return await this.authService.changePassword(user.id, changePasswordDto);
  }
}

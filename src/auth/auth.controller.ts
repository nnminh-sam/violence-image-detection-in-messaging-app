import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import * as dotenv from 'dotenv';
import { LocalGuard } from './guards/local.guard';
import { RegistrationPayloadDto } from './dto/registration-payload.dto';
import { ValidationPipe } from '../helper/pipe/validation.pipe';

dotenv.config();
const envVar = process.env;
const API_URL = `${envVar.API_PREFIX}/${envVar.API_VERSION}/auth`;

@Controller(API_URL)
@UseGuards()
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @UseGuards(LocalGuard)
  async login(@Req() request) {
    return await this.authService.login(request.user);
  }

  @Post('register')
  async register(
    @Body()
    registrationPayload: RegistrationPayloadDto,
  ) {
    return await this.authService.register(registrationPayload);
  }
}

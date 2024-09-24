import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { RequestedUser } from 'src/decorator/requested-user.decorator';
import { RegistrationPayloadDto } from './dto/registration-payload.dto';
import { LocalGuard } from './guards/local.guard';
import { AuthService } from './auth.service';
import * as dotenv from 'dotenv';

dotenv.config();
const envVar = process.env;
const API_URL = `${envVar.API_PREFIX}/${envVar.API_VERSION}/auth`;

@Controller(API_URL)
@UseGuards()
export class AuthController {
  constructor(private authService: AuthService) {}

  @UseGuards(LocalGuard)
  @Post('login')
  async login(@RequestedUser() user) {
    return await this.authService.login(user);
  }

  @Post('register')
  async register(
    @Body()
    registrationPayload: RegistrationPayloadDto,
  ) {
    return await this.authService.register(registrationPayload);
  }
}

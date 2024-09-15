import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthenticationPayloadDto } from './dto/authentication-payload.dto';
import { UserService } from 'src/user/user.service';
import { UserDocument } from 'src/user/entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { RegistrationPayloadDto } from './dto/registration-payload.dto';
import { AuthenticationResponseDto } from './dto/authentication-response.dto';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private userService: UserService,
  ) {}

  async validateUser({
    email,
    password,
  }: AuthenticationPayloadDto): Promise<UserDocument> {
    const user: UserDocument = await this.userService.findByEmail(email);
    if (!user) {
      throw new BadRequestException('User not found');
    }
    const isPasswordMatch: boolean = bcrypt.compareSync(
      password,
      user.password,
    );
    if (!isPasswordMatch) {
      throw new UnauthorizedException('Wrong password');
    }

    return user;
  }

  async login(user: UserDocument): Promise<AuthenticationResponseDto> {
    const payload = { email: user.email, id: user.id };
    return {
      accessToken: this.jwtService.sign(payload),
    };
  }

  async register(
    registrationPayload: RegistrationPayloadDto,
  ): Promise<AuthenticationResponseDto> {
    const newUser: UserDocument =
      await this.userService.create(registrationPayload);
    return await this.login(newUser);
  }
}

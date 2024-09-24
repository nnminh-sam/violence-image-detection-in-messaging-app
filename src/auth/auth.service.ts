import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuthenticationPayloadDto } from './dto/authentication-payload.dto';
import { UserService } from 'src/user/user.service';
import { User, UserDocument } from 'src/user/entities/user.entity';
import { RegistrationPayloadDto } from './dto/registration-payload.dto';
import { AuthenticationResponseDto } from './dto/authentication-response.dto';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private userService: UserService,
  ) {}

  async validateUser({
    email,
    password,
  }: AuthenticationPayloadDto): Promise<User> {
    const user: UserDocument = await this.userService.findByEmail(email);
    if (!user) throw new NotFoundException('User not found');

    const isPasswordMatch: boolean = bcrypt.compareSync(
      password,
      user.password,
    );
    if (!isPasswordMatch) throw new BadRequestException('Wrong password');

    return {
      id: user._id,
      ...user,
    };
  }

  async login(user: any): Promise<AuthenticationResponseDto> {
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

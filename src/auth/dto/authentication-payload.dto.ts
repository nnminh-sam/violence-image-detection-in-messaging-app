import { IsEmail, IsNotEmpty, Length } from 'class-validator';

export class AuthenticationPayloadDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @Length(8, 256, {
    message: 'Password must be from 8 to 256 characters',
  })
  password: string;
}

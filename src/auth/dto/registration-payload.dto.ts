import { Type } from 'class-transformer';
import {
  IsDate,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  Length,
} from 'class-validator';
import { Gender } from 'src/user/entities/gender.enum';

export class RegistrationPayloadDto {
  @IsNotEmpty()
  @IsString({ message: 'First name must be a string' })
  @Length(1, 30, { message: 'First name length must be from 1 to 30' })
  firstName: string;

  @IsNotEmpty()
  @IsString({ message: 'Last name must be a string' })
  @Length(1, 30, { message: 'Last name length must be from 1 to 30' })
  lastName: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  password: string;

  @IsNotEmpty()
  @IsString({ message: 'Username must be a string' })
  @Length(1, 30, { message: 'Username length must be from 1 to 30' })
  username: string;

  @IsNotEmpty()
  phone: string;

  @IsNotEmpty()
  @IsEnum(Gender)
  gender: Gender;

  @IsNotEmpty()
  @Type(() => Date)
  @IsDate()
  dateOfBirth: Date;
}

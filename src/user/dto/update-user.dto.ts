import { IsDate, IsEnum, IsOptional, IsString, Length } from 'class-validator';
import { Gender } from '../entities/gender.enum';
import { Type } from 'class-transformer';

export class UpdateUserDto {
  @IsOptional()
  @IsString({ message: 'First name must be a string' })
  @Length(2, 30, { message: 'First name length must be from 2 to 30' })
  firstName?: string;

  @IsOptional()
  @IsString({ message: 'Last name must be a string' })
  @Length(2, 30, { message: 'Last name length must be from 2 to 30' })
  lastName?: string;

  @IsOptional()
  @IsString({ message: 'Username must be a string' })
  @Length(1, 30, { message: 'Username length must be from 1 to 30' })
  username?: string;

  @IsOptional()
  phone?: string;

  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dateOfBirth?: Date;
}

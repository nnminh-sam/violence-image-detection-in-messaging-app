import { IsDate, IsPhoneNumber, IsString, Length } from 'class-validator';

export class UpdateUserDto {
  @IsString()
  @Length(1, 30)
  firstName: string;

  @IsString()
  @Length(1, 30)
  lastName: string;

  @IsString()
  @Length(1, 30)
  username: string;

  @IsPhoneNumber()
  phone: string;

  gender: string;

  @IsDate()
  dateOfBirth: Date;
}

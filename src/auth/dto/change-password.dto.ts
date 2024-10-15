import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @IsString({ message: 'Password must be a string' })
  @MinLength(8)
  currentPassword: string;

  @IsString({ message: 'New password must be a string' })
  @MinLength(8)
  newPassword: string;
}

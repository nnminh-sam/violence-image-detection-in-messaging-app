import { Gender } from 'src/user/entities/gender.enum';

export class RegistrationPayloadDto {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  usernanme: string;
  phone: string;
  gender: Gender;
  dateOfBirth: Date;
}

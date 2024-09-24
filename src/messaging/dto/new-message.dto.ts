import { UserResponse } from 'src/user/dto/user-response.dto';

export class NewMessage {
  message: string;

  attachment?: string;

  sender: UserResponse;

  room: string;

  timestamp: Date;
}

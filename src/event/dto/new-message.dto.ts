import { User } from 'src/user/entities/user.entity';

export class NewMessage {
  message: string;

  attachment?: string;

  sender: User;

  room: string;

  timestamp: Date;
}

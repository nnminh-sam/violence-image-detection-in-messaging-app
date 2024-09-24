import { JoinRoomDto } from '../dto/join-room-payload.dto';
import { NewMessage } from '../dto/new-message.dto';

export interface ServerToClientEvents {
  joinRoom: (payload: JoinRoomDto) => void;
  newMessage: (payload: NewMessage) => void;
}

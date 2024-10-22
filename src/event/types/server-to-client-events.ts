import { PopulatedMessage } from 'src/message/entities/message.entity';
import { JoinRoomDto } from '../dto/join-room-payload.dto';
import { NewMessage } from '../dto/new-message.dto';
import { NewMediaDto } from '../dto/new-media.dto';

export interface ServerToClientEvents {
  joinRoom: (payload: JoinRoomDto) => void;
  newMessage: (payload: PopulatedMessage) => void;
  newMedia: (payload: NewMediaDto) => void;
  connectionStatus: any;
  joinRoomStatus: any;
}

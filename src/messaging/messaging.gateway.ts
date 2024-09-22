import { UserResponse } from 'src/user/dto/user-response.dto';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MessagingService } from './messaging.service';
import * as dotenv from 'dotenv';
import { JoinRoomDto } from './dto/join-room-payload.dto';
import { ClientInfo } from './dto/client-info.dto';
dotenv.config();

const WEBSOCKET_GATEWAY_PORT: number = +process.env.WEBSOCKET_PORT;
const ALLOWED_ORIGIN: string =
  process.env.MODE === 'dev' ? '*' : process.env.CLIENT;

@WebSocketGateway(WEBSOCKET_GATEWAY_PORT, {
  cors: {
    origin: ALLOWED_ORIGIN,
  },
})
export class MessagingGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  private readonly server: Server;

  constructor(private readonly messagingService: MessagingService) {}

  async handleConnection(client: Socket, ...args: any[]) {
    const user: ClientInfo =
      await this.messagingService.connectToSocket(client);
  }

  async handleDisconnect(client: Socket) {
    this.messagingService.disconnectToSocket(client);
  }

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(client: Socket, payload: JoinRoomDto) {
    const user: ClientInfo =
      await this.messagingService.authorizeClient(client);
    if (!user) this.messagingService.disconnectToSocket(client);

    await this.messagingService.joinRoom(client, payload.roomId);
  }
}

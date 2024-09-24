import {
  ConnectedSocket,
  MessageBody,
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
import { ClientInfo } from './types/client-info';
import { UseGuards } from '@nestjs/common';
import { SocketGuard } from './guard/socket-jwt.guard';
import { ServerToClientEvents } from './types/server-to-client-events';
import { NewMessage } from './dto/new-message.dto';
dotenv.config();

const WEBSOCKET_GATEWAY_PORT: number = +process.env.WEBSOCKET_PORT;
const ALLOWED_ORIGIN: string =
  process.env.MODE === 'dev' ? '*' : process.env.CLIENT;

@WebSocketGateway(WEBSOCKET_GATEWAY_PORT, {
  namespace: 'chat',
  cors: {
    origin: ALLOWED_ORIGIN,
  },
})
export class MessagingGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  private readonly server: Server<any, ServerToClientEvents>;

  constructor(private readonly messagingService: MessagingService) {}

  async handleConnection(client: Socket, ...args: any[]) {
    const connectedClient: ClientInfo =
      await this.messagingService.connectToSocket(client);
    if (!connectedClient) return;
  }

  async handleDisconnect(client: Socket) {
    this.messagingService.disconnectToSocket(client);
  }

  @UseGuards(SocketGuard)
  @SubscribeMessage('joinRoom')
  handleJoinRoom(
    @ConnectedSocket()
    client: Socket,
    @MessageBody()
    payload: JoinRoomDto,
  ) {
    const { roomId } = payload;
    this.messagingService.joinRoom(client, roomId);
  }

  @UseGuards(SocketGuard)
  @SubscribeMessage('saveMessage')
  handleNewMessage(
    @ConnectedSocket()
    client: Socket,
    @MessageBody()
    payload: NewMessage,
  ) {}
}

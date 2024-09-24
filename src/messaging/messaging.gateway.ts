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
import { JoinRoomDto } from './dto/join-room-payload.dto';
import { ClientInfo } from './types/client-info';
import { UseGuards } from '@nestjs/common';
import { SocketGuard } from './guard/socket-jwt.guard';
import { ServerToClientEvents } from './types/server-to-client-events';
import { NewMessage } from './dto/new-message.dto';
import * as dotenv from 'dotenv';
dotenv.config();

const SOCKET_PORT: number = +process.env.SOCKET_PORT;
const SOCKET_NAMESPACE: string = process.env.SOCKET_NAMESPACE;
const ALLOWED_ORIGIN: string =
  process.env.MODE === 'dev' ? '*' : process.env.CLIENT;

@WebSocketGateway(SOCKET_PORT, {
  // namespace: SOCKET_NAMESPACE,
  cors: {
    origin: ALLOWED_ORIGIN,
  },
})
export class MessagingGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  // private readonly server: Server<any, ServerToClientEvents>;
  private readonly server: Server;

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
  sendNewMessage(payload: NewMessage) {
    const { room } = payload;
    this.server.to(room).emit('newMessage', payload);
  }
}

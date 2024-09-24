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
import { EventService } from './event.service';
import { JoinRoomDto } from './dto/join-room-payload.dto';
import { ClientInfo } from './types/client-info';
import { UseGuards } from '@nestjs/common';
import { SocketGuard } from './guard/socket-jwt.guard';
import { NewMessage } from './dto/new-message.dto';
import { ServerToClientEvents } from './types/server-to-client-events';
import * as dotenv from 'dotenv';
dotenv.config();

const SOCKET_PORT: number = +process.env.SOCKET_PORT;
const ALLOWED_ORIGIN: string =
  process.env.MODE === 'dev' ? '*' : process.env.CLIENT;

@WebSocketGateway(SOCKET_PORT, {
  cors: {
    origin: ALLOWED_ORIGIN,
  },
})
export class EventGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  private readonly server: Server<any, ServerToClientEvents>;

  constructor(private readonly EventService: EventService) {}

  async handleConnection(client: Socket, ...args: any[]) {
    const connectedClient: ClientInfo =
      await this.EventService.connectToSocket(client);
    if (!connectedClient) return;
  }

  async handleDisconnect(client: Socket) {
    this.EventService.disconnectToSocket(client);
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
    this.EventService.joinRoom(client, roomId);
  }

  @UseGuards(SocketGuard)
  sendNewMessage(payload: NewMessage) {
    const { room } = payload;
    this.server.to(room).emit('newMessage', payload);
  }
}

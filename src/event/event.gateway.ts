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
import { Logger, UseGuards } from '@nestjs/common';
import { SocketGuard } from './guard/socket-jwt.guard';
import { NewMessage } from './dto/new-message.dto';
import { ServerToClientEvents } from './types/server-to-client-events';
import * as dotenv from 'dotenv';
import { PopulatedMessage } from 'src/message/entities/message.entity';
import { Conversation } from 'src/conversation/entities/conversation.entity';
dotenv.config();

const SOCKET_PORT: number = +process.env.SOCKET_PORT;
const ALLOWED_ORIGIN: string =
  process.env.MODE === 'dev' ? '*' : process.env.CLIENT;

@WebSocketGateway(SOCKET_PORT, {
  cors: {
    origin: 'http://localhost:5173',
    allowedHeaders: ['Authorization', 'Content-Type'],
  },
})
export class EventGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  private readonly server: Server<any, ServerToClientEvents>;

  constructor(private readonly EventService: EventService) {}

  async handleConnection(client: Socket, ...args: any[]) {
    const connectedClient: ClientInfo =
      await this.EventService.connectToSocket(client);
    this.server.emit('connectionStatus', {
      client: client.id,
      status: connectedClient ? 'success' : 'failed',
      timestamp: Date.now().toString(),
    });
    if (!connectedClient) {
      client.disconnect();
    }
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
    this.server.emit('joinRoomStatus', {
      client: client.id,
      room: roomId,
      status: 'success',
      timestamp: Date.now().toString(),
    });
  }

  @UseGuards(SocketGuard)
  sendNewMessage(payload: PopulatedMessage) {
    const { conversation } = payload;
    console.log('payload:', payload);
    const room: string = (conversation as Conversation).id.toString();
    console.log(`emitting message to room ${room} with payload:`, payload);
    this.server.to(room).emit('newMessage', payload);
  }
}

import { UserService } from 'src/user/user.service';
import { Injectable, Logger } from '@nestjs/common';
import { Socket } from 'socket.io';
import * as dotenv from 'dotenv';
import { JwtService, TokenExpiredError } from '@nestjs/jwt';
import { UserResponse } from 'src/user/dto/user-response.dto';
import { ClientInfo } from './dto/client-info.dto';

dotenv.config();

@Injectable()
export class MessagingService {
  private readonly logger = new Logger(MessagingService.name);

  private clients: Map<Socket, ClientInfo> = new Map<Socket, ClientInfo>();

  private roomAttendants: Map<string, Set<ClientInfo>> = new Map<
    string,
    Set<ClientInfo>
  >();

  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
  ) {}

  private getAuthenticationToken(client: Socket): string {
    return client.handshake.headers.bearer as string;
  }

  private async decodeToken(token: string) {
    try {
      return await this.jwtService.verify(token);
    } catch (error) {
      if (error instanceof TokenExpiredError) {
        this.logger.log(`${token} is expired`);
      } else {
        this.logger.log(`Invalid token [${token}]`);
      }
      return null;
    }
  }

  async authorizeClient(client: Socket): Promise<ClientInfo> {
    const token: string = this.getAuthenticationToken(client);
    if (!token) {
      this.logger.log(`Unauthorized client: ${client.id}`);
      client.disconnect();
      return null;
    }

    const claims = await this.decodeToken(token);
    if (!claims) {
      this.logger.log(`Unauthorized client: ${client.id}`);
      client.disconnect();
      return null;
    }

    const user: UserResponse = await this.userService.findById(claims.id);
    if (!user) {
      this.logger.log(`User ${user.email} at client [${client.id}] not found`);
      client.disconnect();
      return null;
    }

    this.logger.log(
      `User ${user.email} at client [${client.id}] is authorized`,
    );
    return {
      clientId: client.id,
      userId: user.id,
      ...user,
    };
  }

  async connectToSocket(client: Socket): Promise<ClientInfo> {
    const connectedClient: ClientInfo = await this.authorizeClient(client);
    if (!connectedClient) return;

    if (this.clients.has(client)) return connectedClient;
    this.clients.set(client, connectedClient);

    this.logger.log(
      `User ${connectedClient.email} at client [${client.id}] is connected`,
    );
    return connectedClient;
  }

  disconnectToSocket(client: Socket): void {
    this.clients.delete(client);
    client.disconnect();
    this.logger.log(`Client [${client.id}] disconnected`);
  }

  async joinRoom(client: Socket, roomId: string) {
    const connectedClient: ClientInfo = this.clients.get(client);
    const attendants: Set<ClientInfo> = this.roomAttendants.get(roomId);
    if (attendants.has(connectedClient)) {
      this.logger.log(`Client ${client.id} already in room ${roomId}`);
    }
    attendants.add(connectedClient);
    this.roomAttendants[roomId] = attendants;
    client.join(roomId);
    this.logger.log(`Client ${client.id} joined room ${roomId}`);
  }
}

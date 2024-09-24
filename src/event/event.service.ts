import { UserService } from 'src/user/user.service';
import { Injectable, Logger } from '@nestjs/common';
import { Socket } from 'socket.io';
import { JwtService, TokenExpiredError } from '@nestjs/jwt';
import { ClientInfo } from './types/client-info';
import { User } from 'src/user/entities/user.entity';
import * as dotenv from 'dotenv';
dotenv.config();

@Injectable()
export class EventService {
  private readonly logger = new Logger(EventService.name);

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

  private leaveAllRoom(client: Socket) {
    const clientPrivateRoom: string = client.id;
    client.rooms.forEach((room) => {
      if (room !== clientPrivateRoom) {
        client.leave(room);
      }
    });
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

    const user: User = await this.userService.findById(claims.id);
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

    this.logger.log(
      `User ${connectedClient.email} at client [${client.id}] is connected`,
    );
    return connectedClient;
  }

  disconnectToSocket(client: Socket): void {
    client.disconnect();
    this.logger.log(`Client [${client.id}] disconnected`);
  }

  joinRoom(client: Socket, roomId: string) {
    this.leaveAllRoom(client);
    client.join(roomId);
    this.logger.log(`Client ${client.id} joined room ${roomId}`);
  }
}

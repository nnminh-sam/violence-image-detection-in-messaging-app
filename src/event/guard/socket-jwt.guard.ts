import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { Observable } from 'rxjs';
import { Socket } from 'socket.io';
import * as dotenv from 'dotenv';
dotenv.config();

@Injectable()
export class SocketGuard implements CanActivate {
  private readonly logger: Logger = new Logger(SocketGuard.name);

  constructor(private readonly jwtService: JwtService) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const client: Socket = context.switchToWs().getClient();
    const token: string = client.handshake.headers.bearer as string;
    if (!token) throw new WsException('Unauthorized connection');

    try {
      const claims = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET,
      });
      if (!claims) throw new WsException('Invalid connection');
      return true;
    } catch (error) {
      this.logger.log(error);
      client.disconnect();
      return false;
    }
  }
}

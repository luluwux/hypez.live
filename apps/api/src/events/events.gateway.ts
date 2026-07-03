import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

interface VoteUpdatePayload {
  votes: number;
  lastVoterId: string;
}

interface HypeUpdatePayload {
  pointsAwarded: number;
  lastHyperId: string;
}

@WebSocketGateway({
  cors: {
    // Never fall back to '*' — explicit whitelist prevents cross-origin WebSocket abuse
    origin: process.env.WEB_URL
      ? process.env.WEB_URL.split(',').map((o) => o.trim())
      : ['https://hypez.live', 'https://www.hypez.live', 'http://localhost:3000'],
  },
  namespace: '/live',
  maxHttpBufferSize: 1e6, // 1MB max
  connectTimeout: 10000,
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(EventsGateway.name);
  private connectionCounts = new Map<string, number>();
  private readonly MAX_CONNECTIONS_PER_IP = 3;

  // Subscribe event rate limiter — keyed by socket ID, reset every second
  private subscribeRateLimits = new Map<string, { count: number; resetAt: number }>();
  private readonly MAX_SUBSCRIBE_EVENTS_PER_SECOND = 10;

  constructor(private jwtService: JwtService) {}

  private getClientIp(client: Socket): string {
    // Prefer Cloudflare's trusted header; fall back to direct socket address.
    // Never read X-Forwarded-For directly — it is client-controlled and spoofable.
    return (client.handshake.headers['cf-connecting-ip'] as string | undefined)?.toString()
      ?? client.handshake.address;
  }

  private checkSubscribeRateLimit(clientId: string): boolean {
    const now = Date.now();
    const entry = this.subscribeRateLimits.get(clientId);
    if (!entry || now > entry.resetAt) {
      this.subscribeRateLimits.set(clientId, { count: 1, resetAt: now + 1000 });
      return true;
    }
    if (entry.count >= this.MAX_SUBSCRIBE_EVENTS_PER_SECOND) {
      return false;
    }
    entry.count++;
    return true;
  }

  async handleConnection(client: Socket) {
    // IP bazlı bağlantı limiti
    const ip = this.getClientIp(client);

    const count = this.connectionCounts.get(ip) || 0;
    if (count >= this.MAX_CONNECTIONS_PER_IP) {
      client.emit('error', { message: 'Too many connections from this IP' });
      client.disconnect();
      return;
    }
    this.connectionCounts.set(ip, count + 1);

    // Token doğrulama — token yoksa guest olarak bağlan (sadece okuma)
    const token = client.handshake.auth?.token;
    if (token) {
      try {
        const payload = this.jwtService.verify(token, {
          secret: process.env.JWT_SECRET,
        });
        client.data.user = payload;
      } catch {
        // Geçersiz token — guest olarak devam et
        client.data.user = null;
      }
    }
    this.logger.debug(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    const ip = this.getClientIp(client);
    const count = this.connectionCounts.get(ip) || 0;
    if (count <= 1) {
      this.connectionCounts.delete(ip);
    } else {
      this.connectionCounts.set(ip, count - 1);
    }
    this.subscribeRateLimits.delete(client.id);
    this.logger.debug(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('subscribeToServer')
  async handleSubscribeToServer(
    @ConnectedSocket() client: Socket,
    @MessageBody() serverId: string,
  ) {
    if (!this.checkSubscribeRateLimit(client.id)) {
      return { status: 'error', message: 'Rate limit exceeded — slow down' };
    }
    if (typeof serverId === 'string' && serverId.trim() !== '') {
      const room = `server_${serverId}`;
      await client.join(room);
      this.logger.debug(`Client ${client.id} joined room ${room}`);
      return { status: 'subscribed', room };
    }
    return { status: 'error', message: 'Invalid server ID' };
  }

  @SubscribeMessage('unsubscribeFromServer')
  async handleUnsubscribeFromServer(
    @ConnectedSocket() client: Socket,
    @MessageBody() serverId: string,
  ) {
    if (!this.checkSubscribeRateLimit(client.id)) {
      return { status: 'error', message: 'Rate limit exceeded — slow down' };
    }
    if (typeof serverId === 'string' && serverId.trim() !== '') {
      const room = `server_${serverId}`;
      await client.leave(room);
      this.logger.debug(`Client ${client.id} left room ${room}`);
      return { status: 'unsubscribed', room };
    }
    return { status: 'error', message: 'Invalid server ID' };
  }

  // API Methods
  emitVoteUpdate(serverId: string, data: VoteUpdatePayload) {
    this.server.to(`server_${serverId}`).emit('serverVoted', data);
  }

  emitHypeUpdate(serverId: string, data: HypeUpdatePayload) {
    this.server.to(`server_${serverId}`).emit('serverHyped', data);
  }
}

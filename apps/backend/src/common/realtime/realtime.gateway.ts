import { Injectable } from "@nestjs/common";
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer
} from "@nestjs/websockets";
import { Server } from "socket.io";
import type { Socket } from "socket.io";

@Injectable()
@WebSocketGateway({
  cors: {
    origin: (process.env.WEB_ORIGIN ?? "http://localhost:3000,http://localhost:3001,http://localhost:3002")
      .split(",")
      .map((origin) => origin.trim()),
    credentials: true
  }
})
export class RealtimeGateway implements OnGatewayConnection {
  @WebSocketServer()
  server?: Server;

  handleConnection(client: Socket) {
    const projectId = readQueryValue(client.handshake.query.projectId);
    const conversationId = readQueryValue(client.handshake.query.conversationId);

    if (projectId) {
      void client.join(`project:${projectId}`);
    }

    if (conversationId) {
      void client.join(`conversation:${conversationId}`);
    }
  }

  @SubscribeMessage("project:subscribe")
  subscribeProject(@ConnectedSocket() client: Socket, @MessageBody() projectId?: string) {
    if (projectId) {
      void client.join(`project:${projectId}`);
    }
  }

  @SubscribeMessage("conversation:subscribe")
  subscribeConversation(@ConnectedSocket() client: Socket, @MessageBody() conversationId?: string) {
    if (conversationId) {
      void client.join(`conversation:${conversationId}`);
    }
  }

  emitProject(projectId: string, event: string, payload: unknown) {
    this.server?.to(`project:${projectId}`).emit(event, payload);
  }

  emitConversation(conversationId: string, event: string, payload: unknown) {
    this.server?.to(`conversation:${conversationId}`).emit(event, payload);
  }
}

function readQueryValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

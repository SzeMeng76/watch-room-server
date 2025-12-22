// Socket.IO 观影室服务器逻辑
import { Server as SocketIOServer, Socket } from 'socket.io';
import type {
  Room,
  Member,
  PlayState,
  LiveState,
  ChatMessage,
  ServerToClientEvents,
  ClientToServerEvents,
  RoomMemberInfo,
} from './types.js';

type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

export class WatchRoomServer {
  private rooms: Map<string, Room> = new Map();
  private members: Map<string, Map<string, Member>> = new Map();
  private socketToRoom: Map<string, RoomMemberInfo> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(private io: SocketIOServer<ClientToServerEvents, ServerToClientEvents>) {
    this.setupEventHandlers();
    this.startCleanupTimer();
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket: TypedSocket) => {
      console.log(`[WatchRoom] Client connected: ${socket.id}`);

      // 创建房间
      socket.on('room:create', (data, callback) => {
        try {
          const roomId = this.generateRoomId();
          const userId = socket.id;
          const ownerToken = this.generateRoomId();

          const room: Room = {
            id: roomId,
            name: data.name,
            description: data.description,
            password: data.password,
            isPublic: data.isPublic,
            ownerId: userId,
            ownerName: data.userName,
            ownerToken: ownerToken,
            memberCount: 1,
            currentState: null,
            createdAt: Date.now(),
            lastOwnerHeartbeat: Date.now(),
          };

          const member: Member = {
            id: userId,
            name: data.userName,
            isOwner: true,
            lastHeartbeat: Date.now(),
          };

          this.rooms.set(roomId, room);
          this.members.set(roomId, new Map([[userId, member]]));
          this.socketToRoom.set(socket.id, {
            roomId,
            userId,
            userName: data.userName,
            isOwner: true,
          });

          socket.join(roomId);

          console.log(`[WatchRoom] Room created: ${roomId} by ${data.userName}`);
          callback({ success: true, room });
        } catch (error) {
          console.error('[WatchRoom] Error creating room:', error);
          callback({ success: false, error: '创建房间失败' });
        }
      });

      // 加入房间
      socket.on('room:join', (data, callback) => {
        try {
          const room = this.rooms.get(data.roomId);
          if (!room) {
            return callback({ success: false, error: '房间不存在' });
          }

          if (room.password && room.password !== data.password) {
            return callback({ success: false, error: '密码错误' });
          }

          const userId = socket.id;
          const member: Member = {
            id: userId,
            name: data.userName,
            isOwner: false,
            lastHeartbeat: Date.now(),
          };

          const roomMembers = this.members.get(data.roomId);
          if (roomMembers) {
            roomMembers.set(userId, member);
            room.memberCount = roomMembers.size;
            this.rooms.set(data.roomId, room);
          }

          this.socketToRoom.set(socket.id, {
            roomId: data.roomId,
            userId,
            userName: data.userName,
            isOwner: false,
          });

          socket.join(data.roomId);
          socket.to(data.roomId).emit('room:member-joined', member);

          console.log(`[WatchRoom] User ${data.userName} joined room ${data.roomId}`);

          const members = Array.from(roomMembers?.values() || []);
          callback({ success: true, room, members });
        } catch (error) {
          console.error('[WatchRoom] Error joining room:', error);
          callback({ success: false, error: '加入房间失败' });
        }
      });

      // 离开房间
      socket.on('room:leave', () => {
        this.handleLeaveRoom(socket);
      });

      // 获取房间列表
      socket.on('room:list', (callback) => {
        const publicRooms = Array.from(this.rooms.values()).filter((room) => room.isPublic);
        callback(publicRooms);
      });

      // 播放状态更新
      socket.on('play:update', (state) => {
        const roomInfo = this.socketToRoom.get(socket.id);
        if (!roomInfo || !roomInfo.isOwner) return;

        const room = this.rooms.get(roomInfo.roomId);
        if (room) {
          room.currentState = state;
          this.rooms.set(roomInfo.roomId, room);
          socket.to(roomInfo.roomId).emit('play:update', state);
        }
      });

      // 播放进度跳转
      socket.on('play:seek', (currentTime) => {
        const roomInfo = this.socketToRoom.get(socket.id);
        if (!roomInfo) return;
        socket.to(roomInfo.roomId).emit('play:seek', currentTime);
      });

      // 播放
      socket.on('play:play', () => {
        const roomInfo = this.socketToRoom.get(socket.id);
        if (!roomInfo) return;
        socket.to(roomInfo.roomId).emit('play:play');
      });

      // 暂停
      socket.on('play:pause', () => {
        const roomInfo = this.socketToRoom.get(socket.id);
        if (!roomInfo) return;
        socket.to(roomInfo.roomId).emit('play:pause');
      });

      // 切换视频/集数
      socket.on('play:change', (state) => {
        const roomInfo = this.socketToRoom.get(socket.id);
        if (!roomInfo || !roomInfo.isOwner) return;

        const room = this.rooms.get(roomInfo.roomId);
        if (room) {
          room.currentState = state;
          this.rooms.set(roomInfo.roomId, room);
          socket.to(roomInfo.roomId).emit('play:change', state);
        }
      });

      // 切换直播频道
      socket.on('live:change', (state) => {
        const roomInfo = this.socketToRoom.get(socket.id);
        if (!roomInfo || !roomInfo.isOwner) return;

        const room = this.rooms.get(roomInfo.roomId);
        if (room) {
          room.currentState = state;
          this.rooms.set(roomInfo.roomId, room);
          socket.to(roomInfo.roomId).emit('live:change', state);
        }
      });

      // 聊天消息
      socket.on('chat:message', (data) => {
        const roomInfo = this.socketToRoom.get(socket.id);
        if (!roomInfo) return;

        const message: ChatMessage = {
          id: this.generateMessageId(),
          userId: roomInfo.userId,
          userName: roomInfo.userName,
          content: data.content,
          type: data.type,
          timestamp: Date.now(),
        };

        this.io.to(roomInfo.roomId).emit('chat:message', message);
      });

      // WebRTC 信令
      socket.on('voice:offer', (data) => {
        const roomInfo = this.socketToRoom.get(socket.id);
        if (!roomInfo) return;

        this.io.to(data.targetUserId).emit('voice:offer', {
          userId: socket.id,
          offer: data.offer,
        });
      });

      socket.on('voice:answer', (data) => {
        const roomInfo = this.socketToRoom.get(socket.id);
        if (!roomInfo) return;

        this.io.to(data.targetUserId).emit('voice:answer', {
          userId: socket.id,
          answer: data.answer,
        });
      });

      socket.on('voice:ice', (data) => {
        const roomInfo = this.socketToRoom.get(socket.id);
        if (!roomInfo) return;

        this.io.to(data.targetUserId).emit('voice:ice', {
          userId: socket.id,
          candidate: data.candidate,
        });
      });

      // 清除房间播放状态
      socket.on('state:clear', (callback) => {
        console.log('[WatchRoom] Received state:clear from', socket.id);
        const roomInfo = this.socketToRoom.get(socket.id);

        if (!roomInfo) {
          console.log('[WatchRoom] No room info found for socket');
          if (callback) callback({ success: false, error: 'Not in a room' });
          return;
        }

        if (!roomInfo.isOwner) {
          console.log('[WatchRoom] User is not owner');
          if (callback) callback({ success: false, error: 'Not owner' });
          return;
        }

        const room = this.rooms.get(roomInfo.roomId);
        if (room) {
          console.log(`[WatchRoom] Clearing room state for ${roomInfo.roomId}`);
          room.currentState = null;
          this.rooms.set(roomInfo.roomId, room);
          socket.to(roomInfo.roomId).emit('state:cleared');
          if (callback) callback({ success: true });
        } else {
          console.log('[WatchRoom] Room not found');
          if (callback) callback({ success: false, error: 'Room not found' });
        }
      });

      // 心跳
      socket.on('heartbeat', () => {
        const roomInfo = this.socketToRoom.get(socket.id);
        if (!roomInfo) return;

        const roomMembers = this.members.get(roomInfo.roomId);
        const member = roomMembers?.get(roomInfo.userId);
        if (member) {
          member.lastHeartbeat = Date.now();
          roomMembers?.set(roomInfo.userId, member);
        }

        if (roomInfo.isOwner) {
          const room = this.rooms.get(roomInfo.roomId);
          if (room) {
            room.lastOwnerHeartbeat = Date.now();
            this.rooms.set(roomInfo.roomId, room);
          }
        }

        socket.emit('heartbeat:pong', { timestamp: Date.now() });
      });

      // 断开连接
      socket.on('disconnect', () => {
        console.log(`[WatchRoom] Client disconnected: ${socket.id}`);
        this.handleLeaveRoom(socket);
      });
    });
  }

  private handleLeaveRoom(socket: TypedSocket) {
    const roomInfo = this.socketToRoom.get(socket.id);
    if (!roomInfo) return;

    const { roomId, userId, isOwner } = roomInfo;

    const roomMembers = this.members.get(roomId);
    if (roomMembers) {
      roomMembers.delete(userId);

      const room = this.rooms.get(roomId);
      if (room) {
        room.memberCount = roomMembers.size;
        this.rooms.set(roomId, room);
      }

      socket.to(roomId).emit('room:member-left', userId);

      if (isOwner) {
        console.log(`[WatchRoom] Owner left room ${roomId}, will auto-delete after 5 minutes`);
      }

      if (roomMembers.size === 0) {
        this.deleteRoom(roomId);
      }
    }

    socket.leave(roomId);
    this.socketToRoom.delete(socket.id);
  }

  private deleteRoom(roomId: string) {
    console.log(`[WatchRoom] Deleting room ${roomId}`);
    this.io.to(roomId).emit('room:deleted');
    this.rooms.delete(roomId);
    this.members.delete(roomId);
  }

  private startCleanupTimer() {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      const deleteTimeout = 5 * 60 * 1000;
      const clearStateTimeout = 30 * 1000;

      this.rooms.forEach((room, roomId) => {
        const timeSinceHeartbeat = now - room.lastOwnerHeartbeat;

        if (timeSinceHeartbeat > clearStateTimeout && room.currentState !== null) {
          console.log(`[WatchRoom] Room ${roomId} owner inactive for 30s, clearing play state`);
          room.currentState = null;
          this.rooms.set(roomId, room);
          this.io.to(roomId).emit('state:cleared');
        }

        if (timeSinceHeartbeat > deleteTimeout) {
          console.log(`[WatchRoom] Room ${roomId} owner timeout, deleting...`);
          this.deleteRoom(roomId);
        }
      });
    }, 10000);
  }

  private generateRoomId(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  private generateMessageId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  public destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }

  public getStats() {
    return {
      totalRooms: this.rooms.size,
      totalMembers: Array.from(this.members.values()).reduce((sum, m) => sum + m.size, 0),
      rooms: Array.from(this.rooms.values()).map((room) => ({
        id: room.id,
        name: room.name,
        memberCount: room.memberCount,
        isPublic: room.isPublic,
        hasPassword: !!room.password,
        createdAt: room.createdAt,
      })),
    };
  }
}

// 观影室相关类型定义

// WebRTC 类型定义（用于 Node.js 环境）
export type RTCSessionDescriptionInit = {
  type: 'offer' | 'answer';
  sdp: string;
};

export type RTCIceCandidateInit = {
  candidate: string;
  sdpMLineIndex?: number | null;
  sdpMid?: string | null;
};

export interface Room {
  id: string;
  name: string;
  description: string;
  password?: string;
  isPublic: boolean;
  ownerId: string;
  ownerName: string;
  ownerToken: string;
  memberCount: number;
  currentState: PlayState | LiveState | null;
  createdAt: number;
  lastOwnerHeartbeat: number;
}

export interface Member {
  id: string;
  name: string;
  isOwner: boolean;
  lastHeartbeat: number;
}

export interface PlayState {
  type: 'play';
  url: string;
  currentTime: number;
  isPlaying: boolean;
  videoId: string;
  videoName: string;
  videoYear?: string;
  searchTitle?: string;
  episode?: number;
  source: string;
}

export interface LiveState {
  type: 'live';
  channelId: string;
  channelName: string;
  channelUrl: string;
}

export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  content: string;
  type: 'text' | 'emoji';
  timestamp: number;
}

export interface RoomMemberInfo {
  roomId: string;
  userId: string;
  userName: string;
  isOwner: boolean;
}

// Socket.IO 事件类型
export interface ServerToClientEvents {
  'room:created': (room: Room) => void;
  'room:joined': (data: { room: Room; members: Member[] }) => void;
  'room:left': () => void;
  'room:list': (rooms: Room[]) => void;
  'room:member-joined': (member: Member) => void;
  'room:member-left': (userId: string) => void;
  'room:deleted': () => void;
  'play:update': (state: PlayState) => void;
  'play:seek': (currentTime: number) => void;
  'play:play': () => void;
  'play:pause': () => void;
  'play:change': (state: PlayState) => void;
  'live:change': (state: LiveState) => void;
  'chat:message': (message: ChatMessage) => void;
  'voice:offer': (data: { userId: string; offer: RTCSessionDescriptionInit }) => void;
  'voice:answer': (data: { userId: string; answer: RTCSessionDescriptionInit }) => void;
  'voice:ice': (data: { userId: string; candidate: RTCIceCandidateInit }) => void;
  'voice:mic-enabled': (data: { userId: string }) => void;
  'voice:audio-chunk': (data: { userId: string; audioData: number[]; sampleRate?: number }) => void;
  'state:cleared': () => void;
  'heartbeat:pong': (data: { timestamp: number }) => void;
  error: (message: string) => void;
}

export interface ClientToServerEvents {
  'room:create': (
    data: {
      name: string;
      description: string;
      password?: string;
      isPublic: boolean;
      userName: string;
    },
    callback: (response: { success: boolean; room?: Room; error?: string }) => void
  ) => void;

  'room:join': (
    data: {
      roomId: string;
      password?: string;
      userName: string;
      ownerToken?: string;
    },
    callback: (response: { success: boolean; room?: Room; members?: Member[]; error?: string }) => void
  ) => void;

  'room:leave': () => void;

  'room:list': (callback: (rooms: Room[]) => void) => void;

  'play:update': (state: PlayState) => void;
  'play:seek': (currentTime: number) => void;
  'play:play': () => void;
  'play:pause': () => void;
  'play:change': (state: PlayState) => void;

  'live:change': (state: LiveState) => void;

  'chat:message': (data: { content: string; type: 'text' | 'emoji' }) => void;

  'voice:offer': (data: { targetUserId: string; offer: RTCSessionDescriptionInit }) => void;
  'voice:answer': (data: { targetUserId: string; answer: RTCSessionDescriptionInit }) => void;
  'voice:ice': (data: { targetUserId: string; candidate: RTCIceCandidateInit }) => void;
  'voice:audio-chunk': (data: { roomId: string; audioData: number[]; sampleRate?: number }) => void;

  'state:clear': (callback?: (response: { success: boolean; error?: string }) => void) => void;

  heartbeat: () => void;
}

import { io, Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;
  private readonly url = 'http://127.0.0.1:3003';

  connect(token: string): void {
    if (this.socket?.connected) {
      return;
    }

    this.socket = io(this.url, {
      auth: { token },
    });

    this.socket.on('connect', () => {
      console.log('🔗 Connected to server');
    });

    this.socket.on('disconnect', () => {
      console.log('❌ Disconnected from server');
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Join/leave conversation rooms
  joinConversation(conversationId: number): void {
    this.socket?.emit('join-conversation', conversationId);
  }

  leaveConversation(conversationId: number): void {
    this.socket?.emit('leave-conversation', conversationId);
  }

  // Send message
  sendMessage(data: any): void {
    this.socket?.emit('send-message', data);
  }

  // Typing indicators
  setTyping(conversationId: number, userId: number, isTyping: boolean): void {
    this.socket?.emit('typing', { conversationId, userId, isTyping });
  }

  // Event listeners
  onNewMessage(callback: (data: any) => void): void {
    this.socket?.on('new-message', callback);
  }

  onUserTyping(callback: (data: any) => void): void {
    this.socket?.on('user-typing', callback);
  }

  // Remove listeners
  off(event: string, callback?: (data: any) => void): void {
    this.socket?.off(event, callback);
  }
}

export const socketService = new SocketService();
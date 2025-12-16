import type { IUser, IConversation, IMessage } from '@src/types';

const API_BASE_URL = 'http://127.0.0.1:3003/api';

class ApiService {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('auth_token');
  }

  private async request<T>(url: string, options: RequestInit = {}): Promise<T> {
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(`${API_BASE_URL}${url}`, config);

    if (!response.ok) {
      let errorBody: any = null;
      try {
        errorBody = await response.json();
      } catch (e) {
        // ignore JSON parse error
      }
      const message = errorBody?.error || errorBody?.message || `Request failed (${response.status})`;
      const err = new Error(message);
      (err as any).status = response.status;
      (err as any).body = errorBody;
      throw err;
    }

    return response.json();
  }

  // Auth methods
  async login(email: string, password: string): Promise<{ token: string; user: IUser }> {
    const result = await this.request<{ token: string; user: IUser }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    this.token = result.token;
    localStorage.setItem('auth_token', result.token);
    return result;
  }

  async register(userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  }): Promise<{ token: string; user: IUser }> {
    const result = await this.request<{ token: string; user: IUser }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    this.token = result.token;
    localStorage.setItem('auth_token', result.token);
    return result;
  }

  logout(): void {
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  // User methods
  async getCurrentUser(): Promise<IUser> {
    return this.request<IUser>('/users/me');
  }

  async searchUsers(query: string): Promise<IUser[]> {
    return this.request<IUser[]>(`/users/search?q=${encodeURIComponent(query)}`);
  }

  async addContact(contactId: number): Promise<void> {
    await this.request('/users/contacts', {
      method: 'POST',
      body: JSON.stringify({ contactId }),
    });
  }

  async removeContact(contactId: number): Promise<void> {
    await this.request(`/users/contacts/${contactId}`, {
      method: 'DELETE',
    });
  }

  // Conversation methods
  async getConversations(): Promise<IConversation[]> {
    return this.request<IConversation[]>('/conversations');
  }

  async createConversation(data: {
    type: string;
    name?: string;
    participantIds: number[];
    displayPhoto?: string;
    avatarA?: string;
    avatarB?: string;
  }): Promise<{ id: number }> {
    return this.request<{ id: number }>('/conversations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateConversation(conversationId: number, data: {
    name?: string;
    displayPhoto?: string;
    avatarA?: string;
    avatarB?: string;
  }): Promise<IConversation> {
    return this.request<IConversation>(`/conversations/${conversationId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async archiveConversation(conversationId: number, archived: boolean): Promise<{ success: boolean; archived: boolean }> {
    return this.request<{ success: boolean; archived: boolean }>(`/conversations/${conversationId}/archive`, {
      method: 'PATCH',
      body: JSON.stringify({ archived }),
    });
  }

  async deleteConversation(conversationId: number): Promise<void> {
    await this.request(`/conversations/${conversationId}`, {
      method: 'DELETE',
    });
  }

  async getArchivedConversations(): Promise<IConversation[]> {
    return this.request<IConversation[]>('/conversations?archived=true');
  }

  async pinMessage(conversationId: number, messageId: number | null): Promise<void> {
    await this.request(`/conversations/${conversationId}/pin`, {
      method: 'PATCH',
      body: JSON.stringify({ messageId }),
    });
  }

  // Message methods
  async getMessages(conversationId: number, limit = 50, offset = 0): Promise<IMessage[]> {
    return this.request<IMessage[]>(`/messages/${conversationId}?limit=${limit}&offset=${offset}`);
  }

  async sendMessage(data: {
    conversationId: number;
    content: string;
    type?: string;
    replyTo?: number;
    avatarUrl?: string;
  }): Promise<IMessage> {
    console.log('[API Service] Sending message with data:', data);
    const result = await this.request<IMessage>('/messages', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    console.log('[API Service] Received message response:', result);
    return result;
  }

  async sendAttachments(data: {
    conversationId: number;
    files: File[];
    caption?: string;
    avatarUrl?: string;
  }): Promise<IMessage> {
    console.log('[API] Sending attachments:', {
      filesCount: data.files.length,
      totalSize: data.files.reduce((sum, f) => sum + f.size, 0),
      caption: data.caption
    });
    
    const formData = new FormData();
    
    // Add files to FormData
    data.files.forEach((file) => {
      formData.append('files', file);
      console.log('[API] File:', file.name, 'Size:', file.size, 'bytes');
    });
    
    // Add other data
    formData.append('conversationId', data.conversationId.toString());
    formData.append('caption', data.caption || '');
    if (data.avatarUrl) {
      formData.append('avatarUrl', data.avatarUrl);
    }
    
    // Use fetch directly for FormData (don't set Content-Type header)
    const config: RequestInit = {
      method: 'POST',
      headers: {
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
      },
      body: formData,
    };

    console.log('[API] Sending to:', `${API_BASE_URL}/messages/attachments`);
    
    try {
      const response = await fetch(`${API_BASE_URL}/messages/attachments`, config);

      console.log('[API] Response status:', response.status);

      if (!response.ok) {
        let errorBody: any = null;
        try {
          errorBody = await response.json();
        } catch (e) {
          // ignore JSON parse error
        }
        const message = errorBody?.error || errorBody?.message || `Request failed (${response.status})`;
        console.error('[API] Error response:', errorBody);
        const err = new Error(message);
        (err as any).status = response.status;
        (err as any).body = errorBody;
        throw err;
      }

      return response.json();
    } catch (error) {
      console.error('[API] Network error:', error);
      throw error;
    }
  }

  async markMessageAsRead(messageId: number): Promise<void> {
    await this.request(`/messages/${messageId}/read`, {
      method: 'POST',
    });
  }

  async deleteMessage(messageId: number): Promise<void> {
    await this.request(`/messages/${messageId}`, {
      method: 'DELETE',
    });
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.token;
  }
}

export const apiService = new ApiService();
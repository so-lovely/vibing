import { apiClient } from './api';

export interface ChatMessage {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  senderRole: 'buyer' | 'seller';
  timestamp: string;
  isRead: boolean;
}

export interface Conversation {
  id: string;
  otherUserId: string;
  otherUserName: string;
  productId?: string;
  productName?: string;
  unreadCount: number;
  updatedAt: string;
  otherPartyDeleted?: boolean;
  lastMessage?: {
    text: string;
    timestamp: string;
    senderId: string;
  };
}

export interface ConversationsResponse {
  conversations: Conversation[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

export interface MessagesResponse {
  messages: ChatMessage[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

export interface CreateConversationRequest {
  sellerId: string;
  sellerName: string;
  productId?: string;
  productName?: string;
}

export interface CreateConversationResponse {
  conversation: {
    id: string;
    buyerId: string;
    sellerId: string;
    productId?: string;
    productName?: string;
  };
}

export interface SendMessageRequest {
  text: string;
}

export interface SendMessageResponse {
  message: ChatMessage;
}

class ChatApiService {
  async getConversations(page = 1, limit = 20): Promise<ConversationsResponse> {
    const response = await apiClient.get<ConversationsResponse>(`/chat/conversations?page=${page}&limit=${limit}`);
    return response;
  }

  async createConversation(data: CreateConversationRequest): Promise<CreateConversationResponse> {
    const response = await apiClient.post<CreateConversationResponse>('/chat/conversations', data);
    return response;
  }

  async getMessages(conversationId: string, page = 1, limit = 50): Promise<MessagesResponse> {
    const response = await apiClient.get<MessagesResponse>(`/chat/conversations/${conversationId}/messages?page=${page}&limit=${limit}`);
    return response;
  }

  async sendMessage(conversationId: string, data: SendMessageRequest): Promise<SendMessageResponse> {
    const response = await apiClient.post<SendMessageResponse>(`/chat/conversations/${conversationId}/messages`, data);
    return response;
  }

  async markAsRead(conversationId: string): Promise<{ message: string }> {
    const response = await apiClient.put<{ message: string }>(`/chat/conversations/${conversationId}/read`);
    return response;
  }

  async deleteConversation(conversationId: string): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(`/chat/conversations/${conversationId}`);
    return response;
  }
}

export const chatApi = new ChatApiService();
import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { chatApi, type Conversation as ApiConversation, type ChatMessage as ApiChatMessage } from '../services/chatApi';

export interface ChatMessage {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  senderRole: 'buyer' | 'seller';
  timestamp: Date;
  isRead: boolean;
  messageType: 'text' | 'image';
  imageUrl?: string;
  avatar?: string;
}

export interface Conversation {
  id: string;
  otherUserId: string;
  otherUserName: string;
  productId?: string;
  productName?: string;
  lastMessage?: {
    text: string;
    timestamp: string;
    senderId: string;
  };
  unreadCount: number;
  messages: ChatMessage[];
}

interface ChatContextType {
  conversations: Conversation[];
  activeConversationId: string | null;
  isOpen: boolean;
  isTyping: boolean;
  unreadCount: number;
  loading: boolean;
  toggleChat: () => void;
  sendMessage: (text: string, conversationId: string) => Promise<void>;
  sendImage: (file: File, conversationId: string) => Promise<void>;
  startConversation: (sellerId: string, sellerName: string, productId?: string, productName?: string) => Promise<string>;
  selectConversation: (conversationId: string) => void;
  markAsRead: (conversationId: string) => Promise<void>;
  loadMessages: (conversationId: string) => Promise<void>;
  getActiveConversation: () => Conversation | null;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

interface ChatProviderProps {
  children: ReactNode;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(false);

  const unreadCount = conversations.reduce((total, conv) => total + conv.unreadCount, 0);

  // Load conversations from API when user changes
  const loadConversations = useCallback(async () => {
    if (!user) {
      setConversations([]);
      return;
    }
    
    try {
      setLoading(true);
      const response = await chatApi.getConversations();
      setConversations((response.conversations || []).map(conv => ({
        ...conv,
        messages: []
      })));
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Reload conversations while preserving existing messages
  const reloadConversationsPreservingMessages = useCallback(async () => {
    if (!user) return;
    
    try {
      const response = await chatApi.getConversations();
      setConversations(prev => {
        const updatedConversations = (response.conversations || []).map(apiConv => {
          const existingConv = prev.find(conv => conv.id === apiConv.id);
          return {
            ...apiConv,
            messages: existingConv?.messages || []
          };
        });
        return updatedConversations;
      });
    } catch (error) {
      console.error('Failed to reload conversations:', error);
    }
  }, [user]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Poll for new messages every 5 seconds
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      reloadConversationsPreservingMessages();
    }, 5000);

    return () => clearInterval(interval);
  }, [user, reloadConversationsPreservingMessages]);

  const toggleChat = () => {
    const wasOpen = isOpen;
    setIsOpen(!isOpen);
    
    // When opening chat, refresh conversations
    if (!wasOpen && user) {
      reloadConversationsPreservingMessages();
    }
  };

  const startConversation = async (sellerId: string, sellerName: string, productId?: string, productName?: string): Promise<string> => {
    if (!user) return '';

    try {
      const response = await chatApi.createConversation({
        sellerId,
        sellerName,
        productId,
        productName
      });
      
      const conversationId = response.conversation.id;
      
      // Add the new conversation to local state immediately
      const newConversation: Conversation = {
        id: conversationId,
        otherUserId: sellerId,
        otherUserName: sellerName,
        productId,
        productName,
        unreadCount: 0,
        messages: []
      };
      
      setConversations(prev => {
        // Check if conversation already exists
        const existingIndex = prev.findIndex(conv => conv.id === conversationId);
        if (existingIndex >= 0) {
          return prev;
        }
        return [newConversation, ...prev];
      });
      
      setActiveConversationId(conversationId);
      
      // Reload conversations to get updated data from server
      setTimeout(() => {
        reloadConversationsPreservingMessages();
      }, 500);
      
      return conversationId;
    } catch (error) {
      console.error('Failed to create conversation:', error);
      return '';
    }
  };

  const selectConversation = (conversationId: string) => {
    setActiveConversationId(conversationId);
    markAsRead(conversationId);
  };

  const sendMessage = async (text: string, conversationId: string) => {
    if (!user) return;

    try {
      const response = await chatApi.sendMessage(conversationId, { text });
      
      // Add message to local state for immediate UI update
      const newMessage: ChatMessage = {
        id: response.message.id,
        text: response.message.text,
        senderId: response.message.senderId,
        senderName: response.message.senderName,
        senderRole: response.message.senderRole,
        timestamp: new Date(response.message.timestamp),
        isRead: response.message.isRead,
        messageType: response.message.messageType || 'text',
        imageUrl: response.message.imageUrl
      };

      setConversations(prev => prev.map(conv => {
        if (conv.id === conversationId) {
          return {
            ...conv,
            messages: [...conv.messages, newMessage],
            lastMessage: {
              text: newMessage.text,
              timestamp: response.message.timestamp,
              senderId: newMessage.senderId
            }
          };
        }
        return conv;
      }));

      // Reload conversations to get updated unread counts but preserve existing messages
      setTimeout(() => {
        reloadConversationsPreservingMessages();
      }, 500);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const markAsRead = async (conversationId: string) => {
    try {
      await chatApi.markAsRead(conversationId);
      
      // Update local state
      setConversations(prev => prev.map(conv => 
        conv.id === conversationId 
          ? { ...conv, unreadCount: 0 }
          : conv
      ));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const response = await chatApi.getMessages(conversationId);
      const messages: ChatMessage[] = response.messages.map(msg => ({
        id: msg.id,
        text: msg.text,
        senderId: msg.senderId,
        senderName: msg.senderName,
        senderRole: msg.senderRole,
        timestamp: new Date(msg.timestamp),
        isRead: msg.isRead,
        messageType: msg.messageType || 'text',
        imageUrl: msg.imageUrl
      }));

      setConversations(prev => prev.map(conv => 
        conv.id === conversationId 
          ? { ...conv, messages: messages } // Keep original order - newest last
          : conv
      ));
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const sendImage = async (file: File, conversationId: string) => {
    if (!user) return;

    try {
      // Upload image first
      const uploadResponse = await chatApi.uploadChatImage(file);
      
      // Send image message
      const response = await chatApi.sendImage(conversationId, { imageUrl: uploadResponse.imageUrl });
      
      // Add message to local state for immediate UI update
      const newMessage: ChatMessage = {
        id: response.message.id,
        text: response.message.text,
        senderId: response.message.senderId,
        senderName: response.message.senderName,
        senderRole: response.message.senderRole,
        timestamp: new Date(response.message.timestamp),
        isRead: response.message.isRead,
        messageType: response.message.messageType || 'image',
        imageUrl: response.message.imageUrl
      };

      setConversations(prev => prev.map(conv => {
        if (conv.id === conversationId) {
          return {
            ...conv,
            messages: [...conv.messages, newMessage],
            lastMessage: {
              text: '[Image]',
              timestamp: response.message.timestamp,
              senderId: newMessage.senderId
            }
          };
        }
        return conv;
      }));

      // Reload conversations to get updated unread counts but preserve existing messages
      setTimeout(() => {
        reloadConversationsPreservingMessages();
      }, 500);
    } catch (error) {
      console.error('Failed to send image:', error);
    }
  };

  const getActiveConversation = (): Conversation | null => {
    return conversations.find(conv => conv.id === activeConversationId) || null;
  };


  return (
    <ChatContext.Provider
      value={{
        conversations,
        activeConversationId,
        isOpen,
        isTyping,
        unreadCount,
        loading,
        toggleChat,
        sendMessage,
        sendImage,
        startConversation,
        selectConversation,
        markAsRead,
        loadMessages,
        getActiveConversation
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};
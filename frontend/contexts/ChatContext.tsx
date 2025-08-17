import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';

export interface ChatMessage {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  senderRole: 'buyer' | 'seller';
  timestamp: Date;
  avatar?: string;
}

export interface Conversation {
  id: string;
  buyerId: string;
  buyerName: string;
  sellerId: string;
  sellerName: string;
  productId?: string;
  productName?: string;
  lastMessage?: ChatMessage;
  unreadCount: number;
  messages: ChatMessage[];
}

interface ChatContextType {
  conversations: Conversation[];
  activeConversationId: string | null;
  isOpen: boolean;
  isTyping: boolean;
  unreadCount: number;
  toggleChat: () => void;
  sendMessage: (text: string, conversationId: string) => void;
  startConversation: (sellerId: string, sellerName: string, productId?: string, productName?: string) => string;
  selectConversation: (conversationId: string) => void;
  markAsRead: (conversationId: string) => void;
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

  const unreadCount = conversations.reduce((total, conv) => total + conv.unreadCount, 0);

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const startConversation = (sellerId: string, sellerName: string, productId?: string, productName?: string): string => {
    if (!user) return '';

    // Check if conversation already exists
    const existingConv = conversations.find(conv => 
      conv.buyerId === user.id && conv.sellerId === sellerId && conv.productId === productId
    );

    if (existingConv) {
      setActiveConversationId(existingConv.id);
      return existingConv.id;
    }

    // Create new conversation
    const newConversation: Conversation = {
      id: `conv_${Date.now()}`,
      buyerId: user.id,
      buyerName: user.name,
      sellerId,
      sellerName,
      productId,
      productName,
      unreadCount: 0,
      messages: []
    };

    setConversations(prev => [...prev, newConversation]);
    setActiveConversationId(newConversation.id);
    return newConversation.id;
  };

  const selectConversation = (conversationId: string) => {
    setActiveConversationId(conversationId);
    markAsRead(conversationId);
  };

  const sendMessage = (text: string, conversationId: string) => {
    if (!user) return;

    const message: ChatMessage = {
      id: `msg_${Date.now()}`,
      text,
      senderId: user.id,
      senderName: user.name,
      senderRole: user.role === 'seller' ? 'seller' : 'buyer',
      timestamp: new Date()
    };

    setConversations(prev => prev.map(conv => {
      if (conv.id === conversationId) {
        const updatedConv = {
          ...conv,
          messages: [...conv.messages, message],
          lastMessage: message
        };
        return updatedConv;
      }
      return conv;
    }));

    // Simulate typing indicator for the other party
    setIsTyping(true);
    
    // Simulate response from the other party
    setTimeout(() => {
      setIsTyping(false);
      
      const conversation = conversations.find(c => c.id === conversationId);
      if (!conversation) return;

      const isUserSeller = user.role === 'seller';
      const responseMessage: ChatMessage = {
        id: `msg_${Date.now() + 1}`,
        text: isUserSeller 
          ? "Thank you for your interest! I'll get back to you soon with more details."
          : "Thanks for reaching out! I'm happy to help with any questions about this product.",
        senderId: isUserSeller ? conversation.buyerId : conversation.sellerId,
        senderName: isUserSeller ? conversation.buyerName : conversation.sellerName,
        senderRole: isUserSeller ? 'buyer' : 'seller',
        timestamp: new Date()
      };

      setConversations(prev => prev.map(conv => {
        if (conv.id === conversationId) {
          return {
            ...conv,
            messages: [...conv.messages, responseMessage],
            lastMessage: responseMessage,
            unreadCount: !isOpen ? conv.unreadCount + 1 : conv.unreadCount
          };
        }
        return conv;
      }));
    }, 1000 + Math.random() * 2000);
  };

  const markAsRead = (conversationId: string) => {
    setConversations(prev => prev.map(conv => 
      conv.id === conversationId 
        ? { ...conv, unreadCount: 0 }
        : conv
    ));
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
        toggleChat,
        sendMessage,
        startConversation,
        selectConversation,
        markAsRead,
        getActiveConversation
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};
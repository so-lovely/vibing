import React, { useEffect, useRef, useState } from 'react';
import { MessageCircle, X, ArrowLeft } from 'lucide-react';
import { useChat } from '../../contexts/ChatContext';
import { useAuth } from '../../contexts/AuthContext';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { ConversationList } from './ConversationList';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

export const ChatWidget: React.FC = () => {
  const { user } = useAuth();
  const { 
    conversations,
    activeConversationId,
    isOpen, 
    isTyping, 
    unreadCount, 
    loading,
    toggleChat, 
    sendMessage,
    sendImage,
    selectConversation,
    loadMessages,
    getActiveConversation
  } = useChat();
  
  const [view, setView] = useState<'list' | 'chat'>('list');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const activeConversation = getActiveConversation();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (activeConversation?.messages.length) {
      scrollToBottom();
    }
  }, [activeConversation?.messages, isTyping]);

  useEffect(() => {
    // Auto-scroll when conversation is first loaded
    if (activeConversation && activeConversation.messages.length > 0) {
      setTimeout(() => scrollToBottom(), 100);
    }
  }, [activeConversationId]);

  useEffect(() => {
    // Auto-switch to chat view when a conversation is selected
    if (activeConversationId && isOpen) {
      setView('chat');
    } else if (isOpen) {
      // Default to list view when chat opens
      setView('list');
    }
  }, [activeConversationId, isOpen]);

  const handleSelectConversation = async (conversationId: string) => {
    selectConversation(conversationId);
    setView('chat');
    // Load messages for the selected conversation
    await loadMessages(conversationId);
  };

  const handleBackToList = () => {
    setView('list');
  };


  if (!user) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Chat Window */}
      {isOpen && (
        <div className="mb-4 w-80 sm:w-96 h-96 bg-background border rounded-lg shadow-lg flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              {view === 'chat' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBackToList}
                  className="h-6 w-6 p-0"
                >
                  <ArrowLeft className="h-3 w-3" />
                </Button>
              )}
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <h3 className="font-semibold text-sm">
                {view === 'chat' && activeConversation 
                  ? `Chat with ${activeConversation.otherUserName}`
                  : 'Messages'
                }
              </h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleChat}
              className="h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>

          {/* Content */}
          {view === 'list' || !activeConversation ? (
            <ConversationList 
              onSelectConversation={handleSelectConversation}
            />
          ) : (
            <>
              {/* Product Info */}
              {activeConversation.productName && (
                <div className="px-4 py-2 bg-muted/50 border-b">
                  <p className="text-xs text-muted-foreground">
                    About: <span className="font-medium">{activeConversation.productName}</span>
                  </p>
                </div>
              )}

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {/* Always show previous messages */}
                {activeConversation.messages.map((message) => (
                  <ChatMessage key={message.id} message={message} />
                ))}
                
                {/* Typing Indicator */}
                {isTyping && (
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center text-xs">
                      🛍️
                    </div>
                    <div className="bg-muted px-3 py-2 rounded-lg">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <ChatInput 
                onSendMessage={sendMessage}
                onSendImage={sendImage}
                conversationId={activeConversation.id}
                disabled={isTyping} 
              />
            </>
          )}
        </div>
      )}

      {/* Chat Toggle Button */}
      <Button
        onClick={toggleChat}
        className="relative w-14 h-14 rounded-full shadow-lg"
        size="sm"
      >
        <MessageCircle className="h-6 w-6" />
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 flex items-center justify-center text-xs"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </Button>
    </div>
  );
};
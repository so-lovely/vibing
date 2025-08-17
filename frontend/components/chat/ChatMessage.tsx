import React from 'react';
import { ChatMessage as ChatMessageType } from '../../contexts/ChatContext';
import { useAuth } from '../../contexts/AuthContext';

interface ChatMessageProps {
  message: ChatMessageType;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const { user } = useAuth();
  const isCurrentUser = message.senderId === user?.id;
  const isSeller = message.senderRole === 'seller';
  
  return (
    <div className={`flex gap-3 ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'} mb-4`}>
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs ${
        isSeller ? 'bg-green-500 text-white' : 'bg-blue-500 text-white'
      }`}>
        {message.avatar || (isSeller ? '🛍️' : '👤')}
      </div>
      
      <div className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'} max-w-[80%]`}>
        <div className="text-xs text-muted-foreground mb-1">
          {message.senderName} {isSeller && '(Seller)'}
        </div>
        
        <div
          className={`
            px-3 py-2 rounded-lg text-sm
            ${isCurrentUser 
              ? 'bg-primary text-primary-foreground' 
              : 'bg-muted text-foreground'
            }
          `}
        >
          {message.text}
        </div>
        
        <div className="text-xs text-muted-foreground mt-1">
          {message.timestamp.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </div>
      </div>
    </div>
  );
};
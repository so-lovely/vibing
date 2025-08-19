import React from 'react';
import { MessageCircle, ArrowLeft } from 'lucide-react';
import { useChat } from '../../contexts/ChatContext';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

interface ConversationListProps {
  onSelectConversation: (conversationId: string) => void;
  onBack?: () => void;
}

export const ConversationList: React.FC<ConversationListProps> = ({ 
  onSelectConversation,
  onBack 
}) => {
  const { conversations } = useChat();

  if (conversations.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No conversations yet</p>
        <p className="text-xs">Start a conversation with a seller!</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {onBack && (
        <div className="flex items-center gap-2 p-3 border-b">
          <Button variant="ghost" size="sm" onClick={onBack} className="h-6 w-6 p-0">
            <ArrowLeft className="h-3 w-3" />
          </Button>
          <h3 className="font-semibold text-sm">Conversations</h3>
        </div>
      )}
      
      <div className="flex-1 overflow-y-auto">
        {conversations.map((conversation) => (
          <div
            key={conversation.id}
            className="p-3 border-b cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => onSelectConversation(conversation.id)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-sm truncate">
                    {conversation.otherUserName}
                  </h4>
                  <div className="w-2 h-2 rounded-full flex-shrink-0 bg-green-500"></div>
                </div>
                
                {conversation.productName && (
                  <p className="text-xs text-muted-foreground truncate">
                    About: {conversation.productName}
                  </p>
                )}
                
                {conversation.lastMessage ? (
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    {conversation.lastMessage.text}
                  </p>
                ) : null}
              </div>
              
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                {conversation.lastMessage && (
                  <span className="text-xs text-muted-foreground">
                    {new Date(conversation.lastMessage.timestamp).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </span>
                )}
                
                {conversation.unreadCount > 0 && (
                  <Badge variant="destructive" className="h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                    {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
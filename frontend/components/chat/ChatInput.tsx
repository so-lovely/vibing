import React, { useState, KeyboardEvent, useCallback } from 'react';
import { Send } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

interface ChatInputProps {
  onSendMessage: (message: string, conversationId: string) => void;
  conversationId: string;
  disabled?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ 
  onSendMessage, 
  conversationId,
  disabled = false 
}) => {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSend = useCallback(async () => {
    const trimmedMessage = message.trim();
    if (trimmedMessage && !disabled && !isSending) {
      setIsSending(true);
      try {
        await onSendMessage(trimmedMessage, conversationId);
        setMessage('');
      } finally {
        setIsSending(false);
      }
    }
  }, [message, disabled, isSending, onSendMessage, conversationId]);

  const handleKeyPress = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  return (
    <div className="flex gap-2 p-3 border-t">
      <Input
        type="text"
        placeholder="Type your message..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyPress}
        disabled={disabled}
        className="flex-1"
      />
      <Button
        onClick={handleSend}
        disabled={disabled || !message.trim()}
        size="sm"
        className="px-3"
      >
        <Send className="h-4 w-4" />
      </Button>
    </div>
  );
};
import React, { useState, KeyboardEvent, useCallback, useRef } from 'react';
import { Send, Image } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

interface ChatInputProps {
  onSendMessage: (message: string, conversationId: string) => void;
  onSendImage?: (file: File, conversationId: string) => void;
  conversationId: string;
  disabled?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ 
  onSendMessage, 
  onSendImage,
  conversationId,
  disabled = false 
}) => {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleImageUpload = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onSendImage && !disabled && !isUploadingImage) {
      // Check if file is an image
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file.');
        return;
      }
      
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image must be smaller than 5MB.');
        return;
      }

      setIsUploadingImage(true);
      try {
        await onSendImage(file, conversationId);
      } finally {
        setIsUploadingImage(false);
        // Reset file input
        e.target.value = '';
      }
    }
  }, [onSendImage, conversationId, disabled, isUploadingImage]);

  return (
    <div className="flex gap-2 p-3 border-t">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        style={{ display: 'none' }}
      />
      
      <Button
        onClick={handleImageUpload}
        disabled={disabled || isUploadingImage}
        size="sm"
        variant="ghost"
        className="px-3"
        title="Send image"
      >
        <Image className={`h-4 w-4 ${isUploadingImage ? 'animate-pulse' : ''}`} />
      </Button>
      
      <Input
        type="text"
        placeholder="Type your message..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyPress}
        disabled={disabled || isUploadingImage}
        className="flex-1"
      />
      
      <Button
        onClick={handleSend}
        disabled={disabled || !message.trim() || isSending || isUploadingImage}
        size="sm"
        className="px-3"
      >
        <Send className={`h-4 w-4 ${isSending ? 'animate-pulse' : ''}`} />
      </Button>
    </div>
  );
};
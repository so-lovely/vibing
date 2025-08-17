import React from 'react';
import { MessageCircle } from 'lucide-react';
import { Button } from './ui/button';
import { useChat } from '../contexts/ChatContext';
import { useAuth } from '../contexts/AuthContext';

interface ContactSellerButtonProps {
  sellerId: string;
  sellerName: string;
  productId?: string;
  productName?: string;
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  children?: React.ReactNode;
  showIcon?: boolean;
}

export const ContactSellerButton: React.FC<ContactSellerButtonProps> = ({
  sellerId,
  sellerName,
  productId,
  productName,
  variant = 'outline',
  size = 'sm',
  className = '',
  children,
  showIcon = true
}) => {
  const { user } = useAuth();
  const { startConversation, toggleChat } = useChat();

  const handleContactSeller = () => {
    if (!user || !sellerId) return;
    
    // Don't allow sellers to contact themselves
    if (user.id === sellerId) return;
    
    // Start a conversation with the seller
    startConversation(sellerId, sellerName, productId, productName);
    toggleChat(); // Open the chat widget
  };

  // Don't show button if user is not logged in or is the same seller
  if (!user || user.id === sellerId) {
    return null;
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleContactSeller}
      className={className}
    >
      {showIcon && <MessageCircle className="w-4 h-4 mr-2" />}
      {children || 'Contact Seller'}
    </Button>
  );
};
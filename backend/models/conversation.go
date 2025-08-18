package models

import (
	"time"

	"gorm.io/gorm"
)

type Conversation struct {
	ID              string    `json:"id" gorm:"primaryKey"`
	BuyerID         string    `json:"buyerId" gorm:"not null"`
	BuyerName       string    `json:"buyerName"`
	SellerID        string    `json:"sellerId" gorm:"not null"`
	SellerName      string    `json:"sellerName"`
	ProductID       *string   `json:"productId"`
	ProductName     *string   `json:"productName"`
	BuyerDeleted    bool      `json:"-" gorm:"default:false"`
	SellerDeleted   bool      `json:"-" gorm:"default:false"`
	CreatedAt       time.Time `json:"createdAt"`
	UpdatedAt       time.Time `json:"updatedAt"`
	DeletedAt       gorm.DeletedAt `json:"-" gorm:"index"`

	// Relations
	Messages []ChatMessage `json:"messages" gorm:"foreignKey:ConversationID"`
	Buyer    User          `json:"buyer,omitempty" gorm:"foreignKey:BuyerID"`
	Seller   User          `json:"seller,omitempty" gorm:"foreignKey:SellerID"`
	Product  *Product      `json:"product,omitempty" gorm:"foreignKey:ProductID"`
}

type ChatMessage struct {
	ID             string    `json:"id" gorm:"primaryKey"`
	ConversationID string    `json:"conversationId" gorm:"not null"`
	Text           string    `json:"text" gorm:"type:text;not null" validate:"required,min=1,max=2000"`
	SenderID       string    `json:"senderId" gorm:"not null"`
	SenderName     string    `json:"senderName"`
	SenderRole     string    `json:"senderRole" gorm:"type:varchar(20);check:sender_role IN ('buyer','seller')" validate:"oneof=buyer seller"`
	IsRead         bool      `json:"isRead" gorm:"default:false"`
	CreatedAt      time.Time `json:"timestamp"`
	UpdatedAt      time.Time `json:"updatedAt"`
	DeletedAt      gorm.DeletedAt `json:"-" gorm:"index"`

	// Relations
	Conversation Conversation `json:"conversation,omitempty" gorm:"foreignKey:ConversationID"`
	Sender       User         `json:"sender,omitempty" gorm:"foreignKey:SenderID"`
}

// BeforeCreate hook to generate UUID for Conversation
func (c *Conversation) BeforeCreate(tx *gorm.DB) error {
	if c.ID == "" {
		c.ID = generateUUID()
	}
	return nil
}

// BeforeCreate hook to generate UUID for ChatMessage
func (m *ChatMessage) BeforeCreate(tx *gorm.DB) error {
	if m.ID == "" {
		m.ID = generateUUID()
	}
	return nil
}

// GetUnreadCount returns number of unread messages for a user
func (c *Conversation) GetUnreadCount(userID string) int64 {
	var count int64
	// Count messages where the recipient hasn't read them
	for _, message := range c.Messages {
		if message.SenderID != userID && !message.IsRead {
			count++
		}
	}
	return count
}

// GetLastMessage returns the most recent message in the conversation
func (c *Conversation) GetLastMessage() *ChatMessage {
	if len(c.Messages) == 0 {
		return nil
	}
	
	lastMessage := c.Messages[0]
	for _, message := range c.Messages {
		if message.CreatedAt.After(lastMessage.CreatedAt) {
			lastMessage = message
		}
	}
	return &lastMessage
}

// MarkAsRead marks all messages as read for the specified user
func (c *Conversation) MarkAsRead(db *gorm.DB, userID string) error {
	return db.Model(&ChatMessage{}).
		Where("conversation_id = ? AND sender_id != ? AND is_read = false", c.ID, userID).
		Update("is_read", true).Error
}

// CanUserAccess checks if user can access this conversation
func (c *Conversation) CanUserAccess(userID string) bool {
	return c.BuyerID == userID || c.SellerID == userID
}

// GetOtherParticipant returns the other participant's info
func (c *Conversation) GetOtherParticipant(userID string) (string, string) {
	if c.BuyerID == userID {
		return c.SellerID, c.SellerName
	}
	return c.BuyerID, c.BuyerName
}

// AddMessage adds a new message to the conversation
func (c *Conversation) AddMessage(db *gorm.DB, senderID, senderName, senderRole, text string) (*ChatMessage, error) {
	message := &ChatMessage{
		ConversationID: c.ID,
		Text:           text,
		SenderID:       senderID,
		SenderName:     senderName,
		SenderRole:     senderRole,
		IsRead:         false,
	}

	if err := db.Create(message).Error; err != nil {
		return nil, err
	}

	// Update conversation's updated_at timestamp
	db.Model(c).Update("updated_at", time.Now())

	return message, nil
}

// SoftDeleteForUser marks conversation as deleted for a specific user
func (c *Conversation) SoftDeleteForUser(db *gorm.DB, userID string) error {
	updateData := make(map[string]interface{})
	
	if c.BuyerID == userID {
		updateData["buyer_deleted"] = true
	} else if c.SellerID == userID {
		updateData["seller_deleted"] = true
	} else {
		return nil // User not part of this conversation
	}
	
	return db.Model(c).Where("id = ?", c.ID).Updates(updateData).Error
}

// IsDeletedForUser checks if conversation is deleted for a specific user
func (c *Conversation) IsDeletedForUser(userID string) bool {
	if c.BuyerID == userID {
		return c.BuyerDeleted
	} else if c.SellerID == userID {
		return c.SellerDeleted
	}
	return false
}

// UndeleteForUser marks conversation as not deleted for a specific user and resets both parties' deletion status
func (c *Conversation) UndeleteForUser(db *gorm.DB, userID string) error {
	updateData := make(map[string]interface{})
	
	if c.BuyerID == userID {
		updateData["buyer_deleted"] = false
		updateData["seller_deleted"] = false  // Reset both parties when restarting conversation
		c.BuyerDeleted = false
		c.SellerDeleted = false
	} else if c.SellerID == userID {
		updateData["seller_deleted"] = false
		updateData["buyer_deleted"] = false   // Reset both parties when restarting conversation
		c.SellerDeleted = false
		c.BuyerDeleted = false
	} else {
		return nil // User not part of this conversation
	}
	
	return db.Model(c).Where("id = ?", c.ID).Updates(updateData).Error
}
package handlers

import (
	"strconv"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
	"vibing-backend/database"
	"vibing-backend/models"
)

type CreateConversationRequest struct {
	SellerID    string  `json:"sellerId" validate:"required"`
	SellerName  string  `json:"sellerName" validate:"required"`
	ProductID   *string `json:"productId"`
	ProductName *string `json:"productName"`
}

type SendMessageRequest struct {
	Text string `json:"text" validate:"required,min=1,max=2000"`
}

// GetConversations returns user's conversations
func GetConversations(c *fiber.Ctx) error {
	user := c.Locals("user").(*models.User)
	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "20"))

	offset := (page - 1) * limit

	var conversations []models.Conversation
	var total int64

	// Count total conversations where user is either buyer or seller (excluding deleted ones)
	database.DB.Model(&models.Conversation{}).
		Where("(buyer_id = ? AND buyer_deleted = false) OR (seller_id = ? AND seller_deleted = false)", user.ID, user.ID).
		Count(&total)

	// Get conversations with recent messages (excluding deleted ones)
	database.DB.Where("(buyer_id = ? AND buyer_deleted = false) OR (seller_id = ? AND seller_deleted = false)", user.ID, user.ID).
		Preload("Messages", func(db *gorm.DB) *gorm.DB {
			return db.Order("created_at DESC").Limit(1)
		}).
		Order("updated_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&conversations)

	// Format response
	var conversationData []fiber.Map
	for _, conv := range conversations {
		otherUserID, otherUserName := conv.GetOtherParticipant(user.ID)
		unreadCount := conv.GetUnreadCount(user.ID)
		lastMessage := conv.GetLastMessage()

		// Check if the other party has deleted this conversation
		otherPartyDeleted := false
		if user.ID == conv.BuyerID {
			otherPartyDeleted = conv.SellerDeleted
		} else {
			otherPartyDeleted = conv.BuyerDeleted
		}

		convData := fiber.Map{
			"id":                conv.ID,
			"otherUserId":       otherUserID,
			"otherUserName":     otherUserName,
			"productId":         conv.ProductID,
			"productName":       conv.ProductName,
			"unreadCount":       unreadCount,
			"updatedAt":         conv.UpdatedAt,
			"otherPartyDeleted": otherPartyDeleted,
		}

		if lastMessage != nil {
			convData["lastMessage"] = fiber.Map{
				"text":      lastMessage.Text,
				"timestamp": lastMessage.CreatedAt,
				"senderId":  lastMessage.SenderID,
			}
		}

		conversationData = append(conversationData, convData)
	}

	return c.JSON(fiber.Map{
		"conversations": conversationData,
		"pagination": fiber.Map{
			"currentPage":  page,
			"totalPages":   (total + int64(limit) - 1) / int64(limit),
			"totalItems":   total,
			"itemsPerPage": limit,
		},
	})
}

// CreateConversation starts a new conversation
func CreateConversation(c *fiber.Ctx) error {
	user := c.Locals("user").(*models.User)

	var req CreateConversationRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error": fiber.Map{
				"code":    "VALIDATION_ERROR",
				"message": "Invalid request body",
			},
		})
	}

	// Check if conversation already exists (and is not deleted for this user)
	var existingConv models.Conversation
	query := database.DB.Where("(buyer_id = ? AND seller_id = ?) OR (buyer_id = ? AND seller_id = ?)",
		user.ID, req.SellerID, req.SellerID, user.ID)

	if req.ProductID != nil {
		query = query.Where("product_id = ?", *req.ProductID)
	}

	if err := query.First(&existingConv).Error; err == nil {
		// Check if conversation is deleted for this user
		if !existingConv.IsDeletedForUser(user.ID) {
			// Conversation exists and is not deleted - return it
			return c.JSON(fiber.Map{
				"conversation": fiber.Map{
					"id":          existingConv.ID,
					"buyerId":     existingConv.BuyerID,
					"sellerId":    existingConv.SellerID,
					"productId":   existingConv.ProductID,
					"productName": existingConv.ProductName,
				},
			})
		}
		// If conversation is deleted for this user, undelete it and return
		if err := existingConv.UndeleteForUser(database.DB, user.ID); err == nil {
			return c.JSON(fiber.Map{
				"conversation": fiber.Map{
					"id":          existingConv.ID,
					"buyerId":     existingConv.BuyerID,
					"sellerId":    existingConv.SellerID,
					"productId":   existingConv.ProductID,
					"productName": existingConv.ProductName,
				},
			})
		}
		// If undelete fails, continue to create new conversation
	}

	// Create new conversation
	conversation := models.Conversation{
		BuyerID:     user.ID,
		BuyerName:   user.Name,
		SellerID:    req.SellerID,
		SellerName:  req.SellerName,
		ProductID:   req.ProductID,
		ProductName: req.ProductName,
	}

	if err := database.DB.Create(&conversation).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": fiber.Map{
				"code":    "INTERNAL_ERROR",
				"message": "Failed to create conversation",
			},
		})
	}

	return c.Status(201).JSON(fiber.Map{
		"conversation": fiber.Map{
			"id":          conversation.ID,
			"buyerId":     conversation.BuyerID,
			"sellerId":    conversation.SellerID,
			"productId":   conversation.ProductID,
			"productName": conversation.ProductName,
		},
	})
}

// GetMessages returns conversation messages with pagination
func GetMessages(c *fiber.Ctx) error {
	user := c.Locals("user").(*models.User)
	conversationID := c.Params("id")
	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "50"))

	// Check if user can access this conversation
	var conversation models.Conversation
	if err := database.DB.Where("id = ?", conversationID).First(&conversation).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{
			"error": fiber.Map{
				"code":    "NOT_FOUND",
				"message": "Conversation not found",
			},
		})
	}

	if !conversation.CanUserAccess(user.ID) {
		return c.Status(403).JSON(fiber.Map{
			"error": fiber.Map{
				"code":    "FORBIDDEN",
				"message": "Access denied",
			},
		})
	}

	offset := (page - 1) * limit

	var messages []models.ChatMessage
	var total int64

	database.DB.Model(&models.ChatMessage{}).
		Where("conversation_id = ?", conversationID).
		Count(&total)

	database.DB.Where("conversation_id = ?", conversationID).
		Order("created_at ASC").
		Limit(limit).
		Offset(offset).
		Find(&messages)

	return c.JSON(fiber.Map{
		"messages": messages,
		"pagination": fiber.Map{
			"currentPage":  page,
			"totalPages":   (total + int64(limit) - 1) / int64(limit),
			"totalItems":   total,
			"itemsPerPage": limit,
		},
	})
}

// SendMessage sends a message in conversation
func SendMessage(c *fiber.Ctx) error {
	user := c.Locals("user").(*models.User)
	conversationID := c.Params("id")

	var req SendMessageRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error": fiber.Map{
				"code":    "VALIDATION_ERROR",
				"message": "Invalid request body",
			},
		})
	}

	// Check conversation access
	var conversation models.Conversation
	if err := database.DB.Where("id = ?", conversationID).First(&conversation).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{
			"error": fiber.Map{
				"code":    "NOT_FOUND",
				"message": "Conversation not found",
			},
		})
	}

	if !conversation.CanUserAccess(user.ID) {
		return c.Status(403).JSON(fiber.Map{
			"error": fiber.Map{
				"code":    "FORBIDDEN",
				"message": "Access denied",
			},
		})
	}

	// Check if the other party has deleted this conversation
	otherPartyDeleted := false
	if user.ID == conversation.BuyerID {
		otherPartyDeleted = conversation.SellerDeleted
	} else {
		otherPartyDeleted = conversation.BuyerDeleted
	}

	if otherPartyDeleted {
		return c.Status(403).JSON(fiber.Map{
			"error": fiber.Map{
				"code":    "CONVERSATION_DELETED",
				"message": "The other party has left this conversation",
			},
		})
	}

	// Determine sender role
	senderRole := "buyer"
	if user.ID == conversation.SellerID {
		senderRole = "seller"
	}

	// Create message
	message, err := conversation.AddMessage(database.DB, user.ID, user.Name, senderRole, req.Text)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": fiber.Map{
				"code":    "INTERNAL_ERROR",
				"message": "Failed to send message",
			},
		})
	}

	return c.Status(201).JSON(fiber.Map{
		"message": message,
	})
}

// MarkAsRead marks conversation as read for current user
func MarkAsRead(c *fiber.Ctx) error {
	user := c.Locals("user").(*models.User)
	conversationID := c.Params("id")

	var conversation models.Conversation
	if err := database.DB.Where("id = ?", conversationID).First(&conversation).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{
			"error": fiber.Map{
				"code":    "NOT_FOUND",
				"message": "Conversation not found",
			},
		})
	}

	if !conversation.CanUserAccess(user.ID) {
		return c.Status(403).JSON(fiber.Map{
			"error": fiber.Map{
				"code":    "FORBIDDEN",
				"message": "Access denied",
			},
		})
	}

	if err := conversation.MarkAsRead(database.DB, user.ID); err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": fiber.Map{
				"code":    "INTERNAL_ERROR",
				"message": "Failed to mark as read",
			},
		})
	}

	return c.JSON(fiber.Map{
		"message": "Marked as read",
	})
}

// DeleteConversation deletes a conversation for the current user
func DeleteConversation(c *fiber.Ctx) error {
	user := c.Locals("user").(*models.User)
	conversationID := c.Params("id")

	var conversation models.Conversation
	if err := database.DB.Where("id = ?", conversationID).First(&conversation).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{
			"error": fiber.Map{
				"code":    "NOT_FOUND",
				"message": "Conversation not found",
			},
		})
	}

	if !conversation.CanUserAccess(user.ID) {
		return c.Status(403).JSON(fiber.Map{
			"error": fiber.Map{
				"code":    "FORBIDDEN",
				"message": "Access denied",
			},
		})
	}

	// Soft delete - set deleted flag for this user only
	if err := conversation.SoftDeleteForUser(database.DB, user.ID); err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": fiber.Map{
				"code":    "INTERNAL_ERROR",
				"message": "Failed to delete conversation",
			},
		})
	}

	return c.JSON(fiber.Map{
		"message": "Conversation deleted",
	})
}
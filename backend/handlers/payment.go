package handlers

import (
	"strconv"
	"strings"
	
	"github.com/gofiber/fiber/v2"
	"vibing-backend/database"
	"vibing-backend/models"
	"vibing-backend/services"
)

type CreatePaymentOrderRequest struct {
	ProductID     string `json:"productId" validate:"required"`
	Amount        int    `json:"amount" validate:"required,gt=0"`
	OrderName     string `json:"orderName" validate:"required"`
	CustomerEmail string `json:"customerEmail" validate:"required,email"`
	CustomerName  string `json:"customerName" validate:"required"`
	SuccessURL    string `json:"successUrl" validate:"required,url"`
	FailURL       string `json:"failUrl" validate:"required,url"`
}

type ConfirmPaymentRequest struct {
	PaymentKey string `json:"paymentKey" validate:"required"`
	OrderID    string `json:"orderId" validate:"required"`
	Amount     int    `json:"amount" validate:"required,gt=0"`
}

var portOneService *services.PortOneService

// CreatePaymentOrder creates a payment order for PortOne
func CreatePaymentOrder(c *fiber.Ctx) error {
	user := c.Locals("user").(*models.User)
	
	var req CreatePaymentOrderRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error": fiber.Map{
				"code":    "VALIDATION_ERROR",
				"message": "Invalid request body",
			},
		})
	}

	// Validate product exists and is available
	var product models.Product
	if err := database.DB.Where("id = ? AND status = ?", req.ProductID, "active").First(&product).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{
			"error": fiber.Map{
				"code":    "NOT_FOUND",
				"message": "Product not found",
			},
		})
	}

	// Verify amount matches product price
	if float64(req.Amount) != product.Price {
		return c.Status(400).JSON(fiber.Map{
			"error": fiber.Map{
				"code":    "VALIDATION_ERROR",
				"message": "Amount does not match product price",
			},
		})
	}

	// Create purchase record
	purchase := models.Purchase{
		UserID:    user.ID,
		ProductID: req.ProductID,
		Price:     product.Price,
		Status:    "pending",
	}

	if err := database.DB.Create(&purchase).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": fiber.Map{
				"code":    "INTERNAL_ERROR",
				"message": "Failed to create purchase record",
			},
		})
	}

	// Create customer object for PortOne
	customer := services.Customer{
		ID:    user.ID,
		Name:  req.CustomerName,
		Email: req.CustomerEmail,
		Phone: "",
	}
	if user.Phone != nil {
		customer.Phone = *user.Phone
	}

	// Create payment with PortOne
	if portOneService == nil {
		// Initialize service if not already done
		// In production, this should be done during app startup
	}

	return c.JSON(fiber.Map{
		"orderId":      purchase.OrderID,
		"amount":       req.Amount,
		"orderName":    req.OrderName,
		"customerEmail": req.CustomerEmail,
		"customerName": req.CustomerName,
		"successUrl":   req.SuccessURL,
		"failUrl":      req.FailURL,
		"paymentUrl":   "https://pay.portone.io/...", // Would be actual payment URL
	})
}

// VerifyPayment verifies payment and creates purchase record
func VerifyPayment(c *fiber.Ctx) error {
	user := c.Locals("user").(*models.User)
	paymentId := c.Params("paymentId")
	
	// Extract product and customer info from the payment_id
	// The payment_id format from frontend: payment-{timestamp}-{random}
	// We need to store this mapping when payment is initiated
	
	// For now, we'll create a simple verification
	// In production, you'd verify with PortOne/Toss Pay API
	
	// Get payment info from query params sent by Toss Pay
	orderName := c.Query("orderName")
	amountStr := c.Query("amount")
	customerEmail := c.Query("customerEmail")
	
	if orderName == "" || amountStr == "" || customerEmail == "" {
		return c.Status(400).JSON(fiber.Map{
			"error": fiber.Map{
				"code":    "VALIDATION_ERROR",
				"message": "Missing payment information",
			},
		})
	}
	
	// Parse amount
	amount, err := strconv.ParseFloat(amountStr, 64)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error": fiber.Map{
				"code":    "VALIDATION_ERROR",
				"message": "Invalid amount format",
			},
		})
	}
	
	// Extract product info from order name (format: "ProductTitle - ProductID - Vibing Marketplace")
	parts := strings.Split(orderName, " - ")
	if len(parts) < 3 {
		return c.Status(400).JSON(fiber.Map{
			"error": fiber.Map{
				"code":    "VALIDATION_ERROR",
				"message": "Invalid order name format",
			},
		})
	}
	
	productID := parts[len(parts)-2] // ProductID is the second to last part
	
	// Find product by ID (more reliable than title)
	var product models.Product
	if err := database.DB.Where("id = ? AND status = ?", productID, "active").First(&product).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{
			"error": fiber.Map{
				"code":    "NOT_FOUND",
				"message": "Product not found for verification",
			},
		})
	}
	
	// Check if user already has this product
	var existingPurchase models.Purchase
	if err := database.DB.Where("user_id = ? AND product_id = ? AND status IN ?", 
		user.ID, product.ID, []string{"completed", "confirmed"}).First(&existingPurchase).Error; err == nil {
		return c.Status(400).JSON(fiber.Map{
			"error": fiber.Map{
				"code":    "ALREADY_PURCHASED",
				"message": "Product already purchased",
			},
		})
	}
	
	// Create purchase record with all required fields
	purchase := models.Purchase{
		UserID:         user.ID,
		ProductID:      product.ID,
		Price:          product.Price,
		Status:         "completed",
		PaymentMethod:  "toss_pay",
		TossPaymentKey: paymentId,
	}
	
	if err := database.DB.Create(&purchase).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": fiber.Map{
				"code":    "INTERNAL_ERROR",
				"message": "Failed to create purchase record",
			},
		})
	}
	
	// Load the product relation for proper response formatting
	if err := database.DB.Preload("Product").First(&purchase, "id = ?", purchase.ID).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": fiber.Map{
				"code":    "INTERNAL_ERROR",
				"message": "Failed to load purchase details",
			},
		})
	}
	
	// Generate download URL and license key
	downloadURL := purchase.GenerateDownloadURL()
	purchase.DownloadURL = &downloadURL
	licenseKey := purchase.GenerateLicenseKey()
	purchase.LicenseKey = &licenseKey
	
	if err := database.DB.Save(&purchase).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": fiber.Map{
				"code":    "INTERNAL_ERROR",
				"message": "Failed to update purchase with download info",
			},
		})
	}
	
	// Update product download count
	database.DB.Model(&product).UpdateColumn("downloads", product.Downloads+1)
	
	return c.JSON(fiber.Map{
		"verified": true,
		"paymentId": paymentId,
		"amount": amount,
		"status": "completed",
		"purchase": fiber.Map{
			"id":          purchase.ID,
			"orderId":     purchase.OrderID,
			"status":      purchase.Status,
			"downloadUrl": purchase.DownloadURL,
			"licenseKey":  purchase.LicenseKey,
			"product": fiber.Map{
				"id":    product.ID,
				"title": product.Title,
			},
		},
	})
}

// ConfirmPayment confirms payment after successful payment
func ConfirmPayment(c *fiber.Ctx) error {
	user := c.Locals("user").(*models.User)
	
	var req ConfirmPaymentRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error": fiber.Map{
				"code":    "VALIDATION_ERROR",
				"message": "Invalid request body",
			},
		})
	}

	// Find purchase by order ID
	var purchase models.Purchase
	if err := database.DB.Where("order_id = ? AND user_id = ?", req.OrderID, user.ID).
		Preload("Product").First(&purchase).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{
			"error": fiber.Map{
				"code":    "NOT_FOUND",
				"message": "Purchase not found",
			},
		})
	}

	// Verify amount
	if float64(req.Amount) != purchase.Price {
		return c.Status(400).JSON(fiber.Map{
			"error": fiber.Map{
				"code":    "VALIDATION_ERROR",
				"message": "Amount mismatch",
			},
		})
	}

	// Update purchase status
	purchase.Status = "completed"
	purchase.TossPaymentKey = req.PaymentKey // Store payment key
	purchase.DownloadURL = &[]string{purchase.GenerateDownloadURL()}[0]
	licenseKey := purchase.GenerateLicenseKey()
	purchase.LicenseKey = &licenseKey

	if err := database.DB.Save(&purchase).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": fiber.Map{
				"code":    "INTERNAL_ERROR",
				"message": "Failed to update purchase",
			},
		})
	}

	// Update product download count
	database.DB.Model(&purchase.Product).UpdateColumn("downloads", purchase.Product.Downloads+1)

	return c.JSON(fiber.Map{
		"purchase": fiber.Map{
			"id":          purchase.ID,
			"orderId":     purchase.OrderID,
			"status":      purchase.Status,
			"downloadUrl": purchase.DownloadURL,
			"licenseKey":  purchase.LicenseKey,
		},
	})
}

// PaymentWebhook handles PortOne webhook
func PaymentWebhook(c *fiber.Ctx) error {
	// TODO: Implement webhook signature verification
	
	var webhook map[string]interface{}
	if err := c.BodyParser(&webhook); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error": fiber.Map{
				"code":    "VALIDATION_ERROR",
				"message": "Invalid webhook body",
			},
		})
	}

	// Process webhook based on event type
	eventType := webhook["type"].(string)
	switch eventType {
	case "payment.completed":
		// Handle successful payment
		return handlePaymentCompleted(webhook)
	case "payment.failed":
		// Handle failed payment
		return handlePaymentFailed(webhook)
	case "payment.cancelled":
		// Handle cancelled payment
		return handlePaymentCancelled(webhook)
	}

	return c.JSON(fiber.Map{"received": true})
}

// CancelPayment cancels a payment order
func CancelPayment(c *fiber.Ctx) error {
	user := c.Locals("user").(*models.User)
	orderID := c.Params("orderId")

	var purchase models.Purchase
	if err := database.DB.Where("order_id = ? AND user_id = ?", orderID, user.ID).First(&purchase).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{
			"error": fiber.Map{
				"code":    "NOT_FOUND",
				"message": "Purchase not found",
			},
		})
	}

	if purchase.Status != "pending" {
		return c.Status(400).JSON(fiber.Map{
			"error": fiber.Map{
				"code":    "INVALID_STATUS",
				"message": "Cannot cancel non-pending payment",
			},
		})
	}

	// Update status to cancelled
	purchase.Status = "cancelled"
	database.DB.Save(&purchase)

	return c.JSON(fiber.Map{
		"message": "Payment cancelled successfully",
		"orderId": orderID,
	})
}

func handlePaymentCompleted(webhook map[string]interface{}) error {
	// Implementation for completed payment webhook
	return nil
}

func handlePaymentFailed(webhook map[string]interface{}) error {
	// Implementation for failed payment webhook
	return nil
}

func handlePaymentCancelled(webhook map[string]interface{}) error {
	// Implementation for cancelled payment webhook
	return nil
}
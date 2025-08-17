package handlers

import (
	"strconv"
	"time"

	"github.com/gofiber/fiber/v2"
	"vibing-backend/database"
	"vibing-backend/models"
)

// GetPurchaseHistory returns user's purchase history with pagination
func GetPurchaseHistory(c *fiber.Ctx) error {
	user := c.Locals("user").(*models.User)
	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "10"))
	
	offset := (page - 1) * limit
	
	var purchases []models.Purchase
	var total int64
	
	// Count total purchases
	database.DB.Model(&models.Purchase{}).Where("user_id = ?", user.ID).Count(&total)
	
	// Get paginated purchases with product details
	if err := database.DB.Where("user_id = ?", user.ID).
		Preload("Product").
		Order("created_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&purchases).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": fiber.Map{
				"code":    "INTERNAL_ERROR",
				"message": "Failed to fetch purchase history",
			},
		})
	}
	
	// Format response
	var purchaseHistory []fiber.Map
	for _, purchase := range purchases {
		purchaseData := fiber.Map{
			"id":           purchase.ID,
			"purchaseDate": purchase.CreatedAt,
			"price":        purchase.Price,
			"status":       purchase.Status,
			"orderId":      purchase.OrderID,
			"paymentMethod": purchase.PaymentMethod,
		}
		
		if purchase.Product.ID != "" {
			purchaseData["product"] = fiber.Map{
				"id":       purchase.Product.ID,
				"title":    purchase.Product.Title,
				"imageUrl": purchase.Product.ImageURL,
				"author":   purchase.Product.Author,
			}
		}
		
		if purchase.DownloadURL != nil {
			purchaseData["downloadUrl"] = *purchase.DownloadURL
		}
		
		if purchase.LicenseKey != nil {
			purchaseData["licenseKey"] = *purchase.LicenseKey
		}
		
		purchaseHistory = append(purchaseHistory, purchaseData)
	}
	
	return c.JSON(fiber.Map{
		"purchases": purchaseHistory,
		"pagination": fiber.Map{
			"currentPage":  page,
			"totalPages":   (total + int64(limit) - 1) / int64(limit),
			"totalItems":   total,
			"itemsPerPage": limit,
		},
	})
}

// GetDownloadURL generates secure download URL for purchased product
func GetDownloadURL(c *fiber.Ctx) error {
	user := c.Locals("user").(*models.User)
	purchaseID := c.Params("id")
	
	var purchase models.Purchase
	if err := database.DB.Where("id = ? AND user_id = ?", purchaseID, user.ID).
		Preload("Product").First(&purchase).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{
			"error": fiber.Map{
				"code":    "NOT_FOUND",
				"message": "Purchase not found",
			},
		})
	}
	
	// Check if download is allowed
	if !purchase.CanDownload() {
		return c.Status(403).JSON(fiber.Map{
			"error": fiber.Map{
				"code":    "FORBIDDEN",
				"message": "Download not allowed",
			},
		})
	}
	
	// Increment download count
	if err := purchase.IncrementDownload(database.DB); err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": fiber.Map{
				"code":    "INTERNAL_ERROR",
				"message": "Failed to update download count",
			},
		})
	}
	
	// Generate secure download URL (expires in 1 hour)
	downloadURL := purchase.GenerateDownloadURL()
	expiresAt := time.Now().Add(1 * time.Hour)
	
	return c.JSON(fiber.Map{
		"downloadUrl": downloadURL,
		"expiresAt":   expiresAt,
	})
}

// GenerateLicense generates new license key for purchase
func GenerateLicense(c *fiber.Ctx) error {
	user := c.Locals("user").(*models.User)
	purchaseID := c.Params("id")
	
	var purchase models.Purchase
	if err := database.DB.Where("id = ? AND user_id = ?", purchaseID, user.ID).
		Preload("Product").First(&purchase).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{
			"error": fiber.Map{
				"code":    "NOT_FOUND",
				"message": "Purchase not found",
			},
		})
	}
	
	// Check if purchase is completed
	if purchase.Status != "completed" {
		return c.Status(400).JSON(fiber.Map{
			"error": fiber.Map{
				"code":    "INVALID_STATUS",
				"message": "License can only be generated for completed purchases",
			},
		})
	}
	
	// Generate new license key
	newLicenseKey := purchase.GenerateLicenseKey()
	purchase.LicenseKey = &newLicenseKey
	
	if err := database.DB.Save(&purchase).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": fiber.Map{
				"code":    "INTERNAL_ERROR",
				"message": "Failed to generate license key",
			},
		})
	}
	
	return c.JSON(fiber.Map{
		"licenseKey": newLicenseKey,
		"message":    "License key generated successfully",
	})
}

// GetPurchaseStats returns purchase statistics for user
func GetPurchaseStats(c *fiber.Ctx) error {
	user := c.Locals("user").(*models.User)
	
	var totalPurchases int64
	var totalSpent float64
	var completedPurchases int64
	
	// Count total purchases
	database.DB.Model(&models.Purchase{}).Where("user_id = ?", user.ID).Count(&totalPurchases)
	
	// Count completed purchases and calculate total spent
	database.DB.Model(&models.Purchase{}).
		Where("user_id = ? AND status = ?", user.ID, "completed").
		Count(&completedPurchases)
	
	// Sum total amount spent
	database.DB.Model(&models.Purchase{}).
		Where("user_id = ? AND status = ?", user.ID, "completed").
		Select("COALESCE(SUM(price), 0)").Row().Scan(&totalSpent)
	
	return c.JSON(fiber.Map{
		"stats": fiber.Map{
			"totalPurchases":    totalPurchases,
			"completedPurchases": completedPurchases,
			"totalSpent":        totalSpent,
		},
	})
}

// CheckPurchaseStatus checks if user has purchased a specific product
func CheckPurchaseStatus(c *fiber.Ctx) error {
	user := c.Locals("user").(*models.User)
	productID := c.Params("productId")
	
	var purchase models.Purchase
	err := database.DB.Where("user_id = ? AND product_id = ? AND status = ?", 
		user.ID, productID, "completed").First(&purchase).Error
	
	if err != nil {
		return c.JSON(fiber.Map{
			"purchased": false,
		})
	}
	
	return c.JSON(fiber.Map{
		"purchased":   true,
		"purchaseId":  purchase.ID,
		"licenseKey":  purchase.LicenseKey,
		"downloadUrl": purchase.DownloadURL,
	})
}
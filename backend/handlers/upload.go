package handlers

import (
	"fmt"
	"time"

	"github.com/gofiber/fiber/v2"
	"vibing-backend/config"
	"vibing-backend/database"
	"vibing-backend/models"
	"vibing-backend/services"
)

var s3Service *services.S3Service

// InitS3Service initializes the S3 service
func InitS3Service(cfg *config.S3Config) error {
	service, err := services.NewS3Service(cfg)
	if err != nil {
		return err
	}
	s3Service = service
	return nil
}

// UploadImage uploads product image
func UploadImage(c *fiber.Ctx) error {
	// Get file from form
	file, err := c.FormFile("image")
	if err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error": fiber.Map{
				"code":    "VALIDATION_ERROR",
				"message": "No image file provided",
			},
		})
	}

	// Upload to S3
	if s3Service == nil {
		return c.Status(500).JSON(fiber.Map{
			"error": fiber.Map{
				"code":    "SERVICE_ERROR",
				"message": "File upload service not available",
			},
		})
	}

	imageURL, err := s3Service.UploadImage(file, "images")
	if err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error": fiber.Map{
				"code":    "UPLOAD_ERROR",
				"message": err.Error(),
			},
		})
	}

	return c.JSON(fiber.Map{
		"imageUrl": imageURL,
		"message":  "Image uploaded successfully",
	})
}

// UploadProductFiles uploads product ZIP files (seller only)
func UploadProductFiles(c *fiber.Ctx) error {
	user := c.Locals("user").(*models.User)

	// Get product ID from form
	productID := c.FormValue("productId")
	if productID == "" {
		return c.Status(400).JSON(fiber.Map{
			"error": fiber.Map{
				"code":    "VALIDATION_ERROR",
				"message": "Product ID is required",
			},
		})
	}

	// Verify user owns the product
	var product models.Product
	if err := database.DB.Where("id = ? AND author_id = ?", productID, user.ID).First(&product).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{
			"error": fiber.Map{
				"code":    "NOT_FOUND",
				"message": "Product not found or access denied",
			},
		})
	}

	// Get single file from form
	file, err := c.FormFile("file")
	if err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error": fiber.Map{
				"code":    "VALIDATION_ERROR",
				"message": "No file provided",
			},
		})
	}

	// Upload file to S3 (only ZIP files allowed)
	fileURL, fileSize, err := s3Service.UploadProductFile(file, productID)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error": fiber.Map{
				"code":    "UPLOAD_ERROR",
				"message": err.Error(),
			},
		})
	}

	// Update product with file URL and size
	product.FileURL = fileURL
	product.FileSize = fmt.Sprintf("%d", fileSize)
	
	if err := database.DB.Save(&product).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": fiber.Map{
				"code":    "DATABASE_ERROR",
				"message": "Failed to update product with file information",
			},
		})
	}

	return c.JSON(fiber.Map{
		"file": fiber.Map{
			"filename": file.Filename,
			"url":      fileURL,
			"size":     fileSize,
		},
		"message": "File uploaded successfully",
	})
}

// GetSignedURL generates signed URL for direct S3 upload (for large files)
func GetSignedURL(c *fiber.Ctx) error {
	filename := c.Query("filename")
	contentType := c.Query("contentType")

	if filename == "" || contentType == "" {
		return c.Status(400).JSON(fiber.Map{
			"error": fiber.Map{
				"code":    "VALIDATION_ERROR",
				"message": "filename and contentType are required",
			},
		})
	}

	// Only allow ZIP files for direct upload
	if contentType != "application/zip" {
		return c.Status(400).JSON(fiber.Map{
			"error": fiber.Map{
				"code":    "VALIDATION_ERROR",
				"message": "Only ZIP files are allowed",
			},
		})
	}

	// Generate presigned URL (expires in 1 hour)
	if s3Service == nil {
		return c.Status(500).JSON(fiber.Map{
			"error": fiber.Map{
				"code":    "SERVICE_ERROR",
				"message": "File upload service not available",
			},
		})
	}

	// For direct upload, generate presigned POST URL
	// This is a simplified version - in production, use presigned POST
	timestamp := time.Now().Unix()
	key := fmt.Sprintf("uploads/%d_%s", timestamp, filename)

	signedURL, err := s3Service.GeneratePresignedURL(key, time.Hour)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": fiber.Map{
				"code":    "SERVICE_ERROR",
				"message": "Failed to generate signed URL",
			},
		})
	}

	return c.JSON(fiber.Map{
		"uploadUrl": signedURL,
		"key":       key,
		"expiresIn": 3600, // 1 hour
	})
}

// UploadChatImage uploads chat image
func UploadChatImage(c *fiber.Ctx) error {
	// Get file from form
	file, err := c.FormFile("image")
	if err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error": fiber.Map{
				"code":    "VALIDATION_ERROR",
				"message": "No image file provided",
			},
		})
	}

	// Upload to S3
	if s3Service == nil {
		return c.Status(500).JSON(fiber.Map{
			"error": fiber.Map{
				"code":    "SERVICE_ERROR",
				"message": "File upload service not available",
			},
		})
	}

	imageURL, err := s3Service.UploadImage(file, "chat-images")
	if err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error": fiber.Map{
				"code":    "UPLOAD_ERROR",
				"message": err.Error(),
			},
		})
	}

	return c.JSON(fiber.Map{
		"imageUrl": imageURL,
		"message":  "Chat image uploaded successfully",
	})
}
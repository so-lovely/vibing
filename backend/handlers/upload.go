package handlers

import (
	"fmt"
	"time"

	"github.com/gofiber/fiber/v2"
	"vibing-backend/database"
	"vibing-backend/models"
	"vibing-backend/services"
)

var s3Service *services.S3Service

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

	// Get files from form (support multiple files)
	form, err := c.MultipartForm()
	if err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error": fiber.Map{
				"code":    "VALIDATION_ERROR",
				"message": "Invalid form data",
			},
		})
	}

	files := form.File["files"]
	if len(files) == 0 {
		return c.Status(400).JSON(fiber.Map{
			"error": fiber.Map{
				"code":    "VALIDATION_ERROR",
				"message": "No files provided",
			},
		})
	}

	// Upload each file (only ZIP files allowed)
	var uploadedFiles []fiber.Map
	var fileURLs []string
	var fileSizes []int64

	for _, file := range files {
		// Upload to S3
		fileURL, fileSize, err := s3Service.UploadProductFile(file, productID)
		if err != nil {
			return c.Status(400).JSON(fiber.Map{
				"error": fiber.Map{
					"code":    "UPLOAD_ERROR",
					"message": err.Error(),
				},
			})
		}

		uploadedFiles = append(uploadedFiles, fiber.Map{
			"filename": file.Filename,
			"url":      fileURL,
			"size":     fileSize,
		})

		fileURLs = append(fileURLs, fileURL)
		fileSizes = append(fileSizes, fileSize)
	}

	// Update product with file URLs and sizes
	product.FileURLs = fileURLs
	product.FileSizes = fileSizes
	database.DB.Save(&product)

	return c.JSON(fiber.Map{
		"files":   uploadedFiles,
		"message": "Files uploaded successfully",
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
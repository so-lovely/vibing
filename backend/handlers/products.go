package handlers

import (
	"fmt"
	"strconv"

	"github.com/gofiber/fiber/v2"
	"vibing-backend/database"
	"vibing-backend/models"
	"vibing-backend/utils"
)

// GetProducts returns paginated products with filters
func GetProducts(c *fiber.Ctx) error {
	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "12"))
	category := c.Query("category")
	search := c.Query("search")
	
	offset := (page - 1) * limit
	
	query := database.DB.Model(&models.Product{}).Where("status = ?", "active")
	
	if category != "" {
		query = query.Where("category = ?", category)
	}
	
	if search != "" {
		query = query.Where("title ILIKE ? OR description ILIKE ?", "%"+search+"%", "%"+search+"%")
	}
	
	var products []models.Product
	var total int64
	
	query.Count(&total)
	query.Offset(offset).Limit(limit).Find(&products)
	
	return c.JSON(fiber.Map{
		"products": products,
		"pagination": fiber.Map{
			"currentPage":  page,
			"totalPages":   (total + int64(limit) - 1) / int64(limit),
			"totalItems":   total,
			"itemsPerPage": limit,
		},
	})
}

// GetProduct returns single product details
func GetProduct(c *fiber.Ctx) error {
	id := c.Params("id")
	
	var product models.Product
	if err := database.DB.Where("id = ? AND status = ?", id, "active").First(&product).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{
			"error": fiber.Map{
				"code":    "NOT_FOUND",
				"message": "Product not found",
			},
		})
	}
	
	// Increment view count
	database.DB.Model(&product).UpdateColumn("views", product.Views+1)
	
	return c.JSON(product)
}

// CreateProduct creates a new product (seller only)
func CreateProduct(c *fiber.Ctx) error {
	user := c.Locals("user").(*models.User)
	
	var product models.Product
	if err := c.BodyParser(&product); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error": fiber.Map{
				"code":    "VALIDATION_ERROR",
				"message": "Invalid request body",
			},
		})
	}
	
	// Set author information from authenticated user
	product.AuthorID = user.ID
	product.Author = user.Name
	product.Status = "active" // Change from "pending" to "active" for immediate visibility
	
	// Debug: log what we're about to validate
	fmt.Printf("About to validate product: %+v\n", product)
	fmt.Printf("Product type: %T\n", product)
	
	// Validate product data
	if validationErrors := utils.ValidateStruct(product); len(validationErrors) > 0 {
		// Log validation errors for debugging
		fmt.Printf("Product validation failed: %+v\n", validationErrors)
		return c.Status(400).JSON(fiber.Map{
			"error": fiber.Map{
				"code":    "VALIDATION_ERROR",
				"message": "Validation failed",
				"details": validationErrors,
			},
		})
	}
	
	if err := database.DB.Create(&product).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": fiber.Map{
				"code":    "INTERNAL_ERROR",
				"message": "Failed to create product",
				"details": err.Error(),
			},
		})
	}
	
	return c.Status(201).JSON(product)
}

// UpdateProduct updates existing product
func UpdateProduct(c *fiber.Ctx) error {
	user := c.Locals("user").(*models.User)
	id := c.Params("id")
	
	var product models.Product
	if err := database.DB.Where("id = ?", id).First(&product).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{
			"error": fiber.Map{
				"code":    "NOT_FOUND",
				"message": "Product not found",
			},
		})
	}
	
	// Check if user owns the product or is admin
	if product.AuthorID != user.ID && user.Role != "admin" {
		return c.Status(403).JSON(fiber.Map{
			"error": fiber.Map{
				"code":    "FORBIDDEN",
				"message": "You can only update your own products",
			},
		})
	}
	
	var updateData struct {
		Title       string   `json:"title" validate:"required,min=1,max=200"`
		Description string   `json:"description" validate:"required,min=10,max=2000"`
		Category    string   `json:"category" validate:"required"`
		Price       float64  `json:"price" validate:"gte=0"`
		Tags        []string `json:"tags"`
		ImageUrl    string   `json:"imageUrl"`
	}
	
	if err := c.BodyParser(&updateData); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error": fiber.Map{
				"code":    "VALIDATION_ERROR",
				"message": "Invalid request body",
			},
		})
	}
	
	// Validate update data
	if validationErrors := utils.ValidateStruct(updateData); len(validationErrors) > 0 {
		return c.Status(400).JSON(fiber.Map{
			"error": fiber.Map{
				"code":    "VALIDATION_ERROR",
				"message": "Validation failed",
				"details": validationErrors,
			},
		})
	}
	
	// Update product fields
	product.Title = updateData.Title
	product.Description = updateData.Description
	product.Category = updateData.Category
	product.Price = updateData.Price
	product.Tags = updateData.Tags
	if updateData.ImageUrl != "" {
		product.ImageURL = updateData.ImageUrl
	}
	
	if err := database.DB.Save(&product).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": fiber.Map{
				"code":    "INTERNAL_ERROR",
				"message": "Failed to update product",
			},
		})
	}
	
	return c.JSON(product)
}

// DeleteProduct deletes product
func DeleteProduct(c *fiber.Ctx) error {
	user := c.Locals("user").(*models.User)
	id := c.Params("id")
	
	var product models.Product
	if err := database.DB.Where("id = ?", id).First(&product).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{
			"error": fiber.Map{
				"code":    "NOT_FOUND",
				"message": "Product not found",
			},
		})
	}
	
	// Check if user owns the product or is admin
	if product.AuthorID != user.ID && user.Role != "admin" {
		return c.Status(403).JSON(fiber.Map{
			"error": fiber.Map{
				"code":    "FORBIDDEN",
				"message": "You can only delete your own products",
			},
		})
	}
	
	// Soft delete by setting status to 'deleted'
	if err := database.DB.Model(&product).Update("status", "deleted").Error; err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": fiber.Map{
				"code":    "INTERNAL_ERROR",
				"message": "Failed to delete product",
			},
		})
	}
	
	return c.JSON(fiber.Map{
		"message": "Product deleted successfully",
	})
}

// ToggleLike toggles product like
func ToggleLike(c *fiber.Ctx) error {
	// Implementation placeholder
	return c.JSON(fiber.Map{"message": "Not implemented"})
}

// GetProductReviews gets product reviews
func GetProductReviews(c *fiber.Ctx) error {
	// Implementation placeholder
	return c.JSON(fiber.Map{"message": "Not implemented"})
}

// CreateReview creates product review
func CreateReview(c *fiber.Ctx) error {
	// Implementation placeholder
	return c.JSON(fiber.Map{"message": "Not implemented"})
}

// GetCategories returns categories with product counts
func GetCategories(c *fiber.Ctx) error {
	type CategoryCount struct {
		ID    string `json:"id"`
		Name  string `json:"name"`
		Count int64  `json:"count"`
	}

	categories := []CategoryCount{
		{ID: "all", Name: "All Categories", Count: 0},
		{ID: "libraries", Name: "Libraries & Frameworks", Count: 0},
		{ID: "cli-tools", Name: "CLI Tools", Count: 0},
		{ID: "web-templates", Name: "Web Templates", Count: 0},
		{ID: "mobile", Name: "Mobile Apps", Count: 0},
		{ID: "desktop", Name: "Desktop Apps", Count: 0},
		{ID: "design", Name: "Design Assets", Count: 0},
		{ID: "database", Name: "Database Tools", Count: 0},
		{ID: "ai-ml", Name: "AI & Machine Learning", Count: 0},
		{ID: "security", Name: "Security Tools", Count: 0},
	}

	// Get total count for "all" category
	var totalCount int64
	database.DB.Model(&models.Product{}).Where("status = ?", "active").Count(&totalCount)
	categories[0].Count = totalCount

	// Get count for each specific category
	for i := 1; i < len(categories); i++ {
		var count int64
		database.DB.Model(&models.Product{}).Where("status = ? AND category = ?", "active", categories[i].ID).Count(&count)
		categories[i].Count = count
	}

	return c.JSON(fiber.Map{
		"categories": categories,
	})
}
package handlers

import (
	"fmt"
	"log"
	"strconv"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
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

// GetProductReviews retrieves reviews for a specific product
func GetProductReviews(c *fiber.Ctx) error {
	productID := c.Params("id")
	if productID == "" {
		return c.Status(400).JSON(fiber.Map{
			"error": "Product ID is required",
		})
	}

	// Parse pagination parameters
	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "10"))

	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 10
	}

	// Get product reviews
	reviews, total, err := models.GetProductReviews(database.DB, productID, page, limit)
	if err != nil {
		log.Printf("Error getting product reviews: %v", err)
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to fetch reviews",
		})
	}

	hasMore := int64(page*limit) < total

	return c.JSON(fiber.Map{
		"reviews": reviews,
		"total":   total,
		"page":    page,
		"limit":   limit,
		"hasMore": hasMore,
	})
}

// CreateReview creates a new review
func CreateReview(c *fiber.Ctx) error {
	// Parse request body
	var req struct {
		ProductID string `json:"productId" validate:"required"`
		Rating    int    `json:"rating" validate:"required,min=1,max=5"`
		Comment   string `json:"comment" validate:"max=1000"`
	}

	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	productID := req.ProductID

	// Get user from context
	userIDLocal := c.Locals("userID")
	if userIDLocal == nil {
		return c.Status(401).JSON(fiber.Map{
			"error": "User not authenticated",
		})
	}
	userID, ok := userIDLocal.(string)
	if !ok {
		return c.Status(401).JSON(fiber.Map{
			"error": "Invalid user ID",
		})
	}

	// Validate request
	if req.Rating < 1 || req.Rating > 5 {
		return c.Status(400).JSON(fiber.Map{
			"error": "Rating must be between 1 and 5",
		})
	}

	// Check if user can review this product
	canReview, err := models.CanUserReview(database.DB, userID, productID)
	if err != nil {
		log.Printf("Error checking review eligibility: %v", err)
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to check review eligibility",
		})
	}

	if !canReview {
		return c.Status(403).JSON(fiber.Map{
			"error": "You cannot review this product. Either you haven't purchased it or you have already reviewed it.",
		})
	}

	// Create review
	review := models.Review{
		ProductID: productID,
		UserID:    userID,
		Rating:    req.Rating,
		Comment:   req.Comment,
	}

	if err := database.DB.Create(&review).Error; err != nil {
		log.Printf("Error creating review: %v", err)
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to create review",
		})
	}

	// Load user information
	if err := database.DB.Preload("User").First(&review, review.ID).Error; err != nil {
		log.Printf("Error loading review with user: %v", err)
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to load review",
		})
	}

	return c.Status(201).JSON(review)
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

// GetUserReviewForProduct gets user's review for a specific product
func GetUserReviewForProduct(c *fiber.Ctx) error {
	productID := c.Params("productId")
	if productID == "" {
		return c.Status(400).JSON(fiber.Map{
			"error": "Product ID is required",
		})
	}

	// Get user from context
	userIDLocal := c.Locals("userID")
	if userIDLocal == nil {
		return c.Status(401).JSON(fiber.Map{
			"error": "User not authenticated",
		})
	}
	userID, ok := userIDLocal.(string)
	if !ok {
		return c.Status(401).JSON(fiber.Map{
			"error": "Invalid user ID",
		})
	}

	// Get user's review for the product
	review, err := models.GetUserReviewForProduct(database.DB, userID, productID)
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return c.Status(404).JSON(fiber.Map{
				"error": "Review not found",
			})
		}
		log.Printf("Error getting user review: %v", err)
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to fetch review",
		})
	}

	return c.JSON(review)
}

// UpdateReview updates an existing review
func UpdateReview(c *fiber.Ctx) error {
	reviewID := c.Params("id")
	if reviewID == "" {
		return c.Status(400).JSON(fiber.Map{
			"error": "Review ID is required",
		})
	}

	// Get user from context
	userIDLocal := c.Locals("userID")
	if userIDLocal == nil {
		return c.Status(401).JSON(fiber.Map{
			"error": "User not authenticated",
		})
	}
	userID, ok := userIDLocal.(string)
	if !ok {
		return c.Status(401).JSON(fiber.Map{
			"error": "Invalid user ID",
		})
	}

	// Parse request body
	var req struct {
		Rating  *int    `json:"rating,omitempty" validate:"omitempty,min=1,max=5"`
		Comment *string `json:"comment,omitempty" validate:"omitempty,max=1000"`
	}

	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	// Find the review and verify ownership
	var review models.Review
	if err := database.DB.Where("id = ? AND user_id = ?", reviewID, userID).First(&review).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return c.Status(404).JSON(fiber.Map{
				"error": "Review not found or you don't have permission to update it",
			})
		}
		log.Printf("Error finding review: %v", err)
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to find review",
		})
	}

	// Update fields if provided
	if req.Rating != nil {
		if *req.Rating < 1 || *req.Rating > 5 {
			return c.Status(400).JSON(fiber.Map{
				"error": "Rating must be between 1 and 5",
			})
		}
		review.Rating = *req.Rating
	}

	if req.Comment != nil {
		review.Comment = *req.Comment
	}

	// Save the review
	if err := database.DB.Save(&review).Error; err != nil {
		log.Printf("Error updating review: %v", err)
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to update review",
		})
	}

	// Load user information
	if err := database.DB.Preload("User").First(&review, review.ID).Error; err != nil {
		log.Printf("Error loading review with user: %v", err)
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to load review",
		})
	}

	return c.JSON(review)
}

// DeleteReview deletes a review
func DeleteReview(c *fiber.Ctx) error {
	reviewID := c.Params("id")
	if reviewID == "" {
		return c.Status(400).JSON(fiber.Map{
			"error": "Review ID is required",
		})
	}

	// Get user from context
	userIDLocal := c.Locals("userID")
	if userIDLocal == nil {
		return c.Status(401).JSON(fiber.Map{
			"error": "User not authenticated",
		})
	}
	userID, ok := userIDLocal.(string)
	if !ok {
		return c.Status(401).JSON(fiber.Map{
			"error": "Invalid user ID",
		})
	}

	// Find the review and verify ownership
	var review models.Review
	if err := database.DB.Where("id = ? AND user_id = ?", reviewID, userID).First(&review).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return c.Status(404).JSON(fiber.Map{
				"error": "Review not found or you don't have permission to delete it",
			})
		}
		log.Printf("Error finding review: %v", err)
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to find review",
		})
	}

	// Delete the review
	if err := database.DB.Delete(&review).Error; err != nil {
		log.Printf("Error deleting review: %v", err)
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to delete review",
		})
	}

	return c.Status(204).Send(nil)
}

// CanUserReview checks if user can review a specific product
func CanUserReview(c *fiber.Ctx) error {
	productID := c.Params("productId")
	if productID == "" {
		return c.Status(400).JSON(fiber.Map{
			"error": "Product ID is required",
		})
	}

	// Get user from context
	userIDLocal := c.Locals("userID")
	if userIDLocal == nil {
		return c.Status(401).JSON(fiber.Map{
			"error": "User not authenticated",
		})
	}
	userID, ok := userIDLocal.(string)
	if !ok {
		return c.Status(401).JSON(fiber.Map{
			"error": "Invalid user ID",
		})
	}

	// Check if user can review
	canReview, err := models.CanUserReview(database.DB, userID, productID)
	if err != nil {
		log.Printf("Error checking review eligibility: %v", err)
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to check review eligibility",
		})
	}

	return c.JSON(fiber.Map{
		"canReview": canReview,
	})
}

// GetRatingDistribution gets rating distribution for a product
func GetRatingDistribution(c *fiber.Ctx) error {
	productID := c.Params("productId")
	if productID == "" {
		return c.Status(400).JSON(fiber.Map{
			"error": "Product ID is required",
		})
	}

	// Get rating distribution
	distribution, err := models.GetRatingDistribution(database.DB, productID)
	if err != nil {
		log.Printf("Error getting rating distribution: %v", err)
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to get rating distribution",
		})
	}

	return c.JSON(distribution)
}
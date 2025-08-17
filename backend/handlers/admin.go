package handlers

import (
	"strconv"

	"github.com/gofiber/fiber/v2"
	"vibing-backend/database"
	"vibing-backend/models"
)

type UpdateUserRoleRequest struct {
	Role string `json:"role" validate:"required,oneof=buyer seller admin"`
}

type UpdateProductStatusRequest struct {
	Status string `json:"status" validate:"required,oneof=active pending rejected deleted"`
}

// GetAdminStats returns admin dashboard statistics
func GetAdminStats(c *fiber.Ctx) error {
	var stats struct {
		TotalUsers    int64   `json:"totalUsers"`
		TotalProducts int64   `json:"totalProducts"`
		TotalSales    int64   `json:"totalSales"`
		TotalRevenue  float64 `json:"totalRevenue"`
		PendingProducts int64 `json:"pendingProducts"`
	}

	// Get total users
	database.DB.Model(&models.User{}).Count(&stats.TotalUsers)

	// Get total products
	database.DB.Model(&models.Product{}).Count(&stats.TotalProducts)

	// Get pending products
	database.DB.Model(&models.Product{}).Where("status = ?", "pending").Count(&stats.PendingProducts)

	// Get total sales and revenue
	database.DB.Model(&models.Purchase{}).
		Where("status = ?", "completed").
		Select("COUNT(*) as total_sales, COALESCE(SUM(price), 0) as total_revenue").
		Row().Scan(&stats.TotalSales, &stats.TotalRevenue)

	return c.JSON(fiber.Map{
		"stats": stats,
	})
}

// GetUsers returns paginated users list for admin
func GetUsers(c *fiber.Ctx) error {
	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "20"))
	role := c.Query("role", "")
	search := c.Query("search", "")

	offset := (page - 1) * limit

	query := database.DB.Model(&models.User{})

	if role != "" {
		query = query.Where("role = ?", role)
	}

	if search != "" {
		query = query.Where("name ILIKE ? OR email ILIKE ?", "%"+search+"%", "%"+search+"%")
	}

	var users []models.User
	var total int64

	query.Count(&total)
	query.Offset(offset).Limit(limit).Order("created_at DESC").Find(&users)

	// Format response to exclude sensitive data
	var userData []fiber.Map
	for _, user := range users {
		userData = append(userData, fiber.Map{
			"id":            user.ID,
			"email":         user.Email,
			"name":          user.Name,
			"role":          user.Role,
			"phoneVerified": user.PhoneVerified,
			"createdAt":     user.CreatedAt,
		})
	}

	return c.JSON(fiber.Map{
		"users": userData,
		"pagination": fiber.Map{
			"currentPage":  page,
			"totalPages":   (total + int64(limit) - 1) / int64(limit),
			"totalItems":   total,
			"itemsPerPage": limit,
		},
	})
}

// UpdateUserRole updates user role (admin only)
func UpdateUserRole(c *fiber.Ctx) error {
	userID := c.Params("id")

	var req UpdateUserRoleRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error": fiber.Map{
				"code":    "VALIDATION_ERROR",
				"message": "Invalid request body",
			},
		})
	}

	var user models.User
	if err := database.DB.First(&user, "id = ?", userID).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{
			"error": fiber.Map{
				"code":    "NOT_FOUND",
				"message": "User not found",
			},
		})
	}

	// Update user role
	user.Role = req.Role
	if err := database.DB.Save(&user).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": fiber.Map{
				"code":    "INTERNAL_ERROR",
				"message": "Failed to update user role",
			},
		})
	}

	return c.JSON(fiber.Map{
		"message": "User role updated successfully",
		"user": fiber.Map{
			"id":   user.ID,
			"role": user.Role,
		},
	})
}

// DeleteUser deletes a user (admin only)
func DeleteUser(c *fiber.Ctx) error {
	currentUser := c.Locals("user").(*models.User)
	userID := c.Params("id")

	// Prevent admin from deleting themselves
	if currentUser.ID == userID {
		return c.Status(400).JSON(fiber.Map{
			"error": fiber.Map{
				"code":    "INVALID_OPERATION",
				"message": "Cannot delete your own account",
			},
		})
	}

	var user models.User
	if err := database.DB.First(&user, "id = ?", userID).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{
			"error": fiber.Map{
				"code":    "NOT_FOUND",
				"message": "User not found",
			},
		})
	}

	// Soft delete user
	if err := database.DB.Delete(&user).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": fiber.Map{
				"code":    "INTERNAL_ERROR",
				"message": "Failed to delete user",
			},
		})
	}

	return c.JSON(fiber.Map{
		"message": "User deleted successfully",
	})
}

// GetAdminProducts returns all products for admin review
func GetAdminProducts(c *fiber.Ctx) error {
	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "20"))
	status := c.Query("status", "")
	category := c.Query("category", "")

	offset := (page - 1) * limit

	query := database.DB.Model(&models.Product{})

	if status != "" {
		query = query.Where("status = ?", status)
	}

	if category != "" {
		query = query.Where("category = ?", category)
	}

	var products []models.Product
	var total int64

	query.Count(&total)
	query.Preload("AuthorUser").
		Offset(offset).
		Limit(limit).
		Order("created_at DESC").
		Find(&products)

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

// UpdateProductStatus updates product status (admin only)
func UpdateProductStatus(c *fiber.Ctx) error {
	productID := c.Params("id")

	var req UpdateProductStatusRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error": fiber.Map{
				"code":    "VALIDATION_ERROR",
				"message": "Invalid request body",
			},
		})
	}

	var product models.Product
	if err := database.DB.First(&product, "id = ?", productID).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{
			"error": fiber.Map{
				"code":    "NOT_FOUND",
				"message": "Product not found",
			},
		})
	}

	// Update product status
	product.Status = req.Status
	if err := database.DB.Save(&product).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": fiber.Map{
				"code":    "INTERNAL_ERROR",
				"message": "Failed to update product status",
			},
		})
	}

	return c.JSON(fiber.Map{
		"message": "Product status updated successfully",
		"product": fiber.Map{
			"id":     product.ID,
			"status": product.Status,
		},
	})
}

// GetAdminSales returns platform sales data for admin
func GetAdminSales(c *fiber.Ctx) error {
	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "20"))

	offset := (page - 1) * limit

	var purchases []models.Purchase
	var total int64

	// Count total completed sales
	database.DB.Model(&models.Purchase{}).
		Where("status = ?", "completed").
		Count(&total)

	// Get paginated sales with product and user details
	database.DB.Where("status = ?", "completed").
		Preload("Product").
		Preload("User").
		Order("created_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&purchases)

	return c.JSON(fiber.Map{
		"sales": purchases,
		"pagination": fiber.Map{
			"currentPage":  page,
			"totalPages":   (total + int64(limit) - 1) / int64(limit),
			"totalItems":   total,
			"itemsPerPage": limit,
		},
	})
}
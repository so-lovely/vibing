package handlers

import (
	"strconv"

	"github.com/gofiber/fiber/v2"
	"vibing-backend/database"
	"vibing-backend/models"
)

// GetSellerDashboard returns seller dashboard data
func GetSellerDashboard(c *fiber.Ctx) error {
	user := c.Locals("user").(*models.User)

	var stats struct {
		TotalRevenue  float64 `json:"totalRevenue"`
		TotalSales    int64   `json:"totalSales"`
		TotalProducts int64   `json:"totalProducts"`
		AvgRating     float64 `json:"avgRating"`
	}

	// Get total revenue and sales from completed purchases
	database.DB.Model(&models.Purchase{}).
		Joins("JOIN products ON purchases.product_id = products.id").
		Where("products.author_id = ? AND purchases.status = ?", user.ID, "completed").
		Select("COALESCE(SUM(purchases.price), 0) as total_revenue, COUNT(*) as total_sales").
		Row().Scan(&stats.TotalRevenue, &stats.TotalSales)

	// Get total products count
	database.DB.Model(&models.Product{}).
		Where("author_id = ?", user.ID).
		Count(&stats.TotalProducts)

	// Get average rating across all products
	database.DB.Model(&models.Product{}).
		Where("author_id = ? AND review_count > 0", user.ID).
		Select("COALESCE(AVG(rating), 0)").
		Row().Scan(&stats.AvgRating)

	// Get recent products
	var products []models.Product
	database.DB.Where("author_id = ?", user.ID).
		Order("created_at DESC").
		Limit(10).
		Find(&products)

	// Format products with sales data
	var productData []fiber.Map
	for _, product := range products {
		var salesCount int64
		var revenue float64

		database.DB.Model(&models.Purchase{}).
			Where("product_id = ? AND status = ?", product.ID, "completed").
			Select("COUNT(*) as sales, COALESCE(SUM(price), 0) as revenue").
			Row().Scan(&salesCount, &revenue)

		productData = append(productData, fiber.Map{
			"id":        product.ID,
			"title":     product.Title,
			"category":  product.Category,
			"price":     product.Price,
			"sales":     salesCount,
			"revenue":   revenue,
			"views":     product.Views,
			"downloads": product.Downloads,
			"status":    product.Status,
			"createdAt": product.CreatedAt,
		})
	}

	return c.JSON(fiber.Map{
		"stats":    stats,
		"products": productData,
	})
}

// GetSellerProducts returns seller's products with pagination
func GetSellerProducts(c *fiber.Ctx) error {
	user := c.Locals("user").(*models.User)
	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "10"))
	status := c.Query("status", "")

	offset := (page - 1) * limit

	query := database.DB.Model(&models.Product{}).Where("author_id = ?", user.ID)

	if status != "" {
		query = query.Where("status = ?", status)
	}

	var products []models.Product
	var total int64

	query.Count(&total)
	query.Offset(offset).Limit(limit).Order("created_at DESC").Find(&products)

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

// GetSellerSales returns seller's sales history
func GetSellerSales(c *fiber.Ctx) error {
	user := c.Locals("user").(*models.User)
	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "10"))

	offset := (page - 1) * limit

	var purchases []models.Purchase
	var total int64

	// Count total sales
	database.DB.Model(&models.Purchase{}).
		Joins("JOIN products ON purchases.product_id = products.id").
		Where("products.author_id = ? AND purchases.status = ?", user.ID, "completed").
		Count(&total)

	// Get paginated sales with product and user details
	database.DB.
		Joins("JOIN products ON purchases.product_id = products.id").
		Where("products.author_id = ? AND purchases.status = ?", user.ID, "completed").
		Preload("Product").
		Preload("User").
		Order("purchases.created_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&purchases)

	// Format response
	var salesData []fiber.Map
	for _, purchase := range purchases {
		salesData = append(salesData, fiber.Map{
			"id":           purchase.ID,
			"orderId":      purchase.OrderID,
			"price":        purchase.Price,
			"paymentMethod": purchase.PaymentMethod,
			"createdAt":    purchase.CreatedAt,
			"product": fiber.Map{
				"id":    purchase.Product.ID,
				"title": purchase.Product.Title,
			},
			"customer": fiber.Map{
				"id":   purchase.User.ID,
				"name": purchase.User.Name,
			},
		})
	}

	return c.JSON(fiber.Map{
		"sales": salesData,
		"pagination": fiber.Map{
			"currentPage":  page,
			"totalPages":   (total + int64(limit) - 1) / int64(limit),
			"totalItems":   total,
			"itemsPerPage": limit,
		},
	})
}
package middleware

import (
	"strings"

	"github.com/gofiber/fiber/v2"
	"vibing-backend/database"
	"vibing-backend/models"
	"vibing-backend/utils"
)

// Auth middleware validates JWT token
func Auth() fiber.Handler {
	return func(c *fiber.Ctx) error {
		token := c.Get("Authorization")
		if token == "" {
			return c.Status(401).JSON(fiber.Map{
				"error": fiber.Map{
					"code":    "UNAUTHORIZED",
					"message": "Authorization header required",
				},
			})
		}

		// Remove "Bearer " prefix
		if strings.HasPrefix(token, "Bearer ") {
			token = token[7:]
		}

		claims, err := utils.ValidateJWT(token)
		if err != nil {
			return c.Status(401).JSON(fiber.Map{
				"error": fiber.Map{
					"code":    "UNAUTHORIZED",
					"message": "Invalid token",
				},
			})
		}

		// Get user from database
		var user models.User
		if err := database.DB.First(&user, "id = ?", claims.UserID).Error; err != nil {
			return c.Status(401).JSON(fiber.Map{
				"error": fiber.Map{
					"code":    "UNAUTHORIZED",
					"message": "User not found",
				},
			})
		}

		// Store user in context
		c.Locals("user", &user)
		return c.Next()
	}
}

// SellerOnly middleware checks if user is seller or admin
func SellerOnly() fiber.Handler {
	return func(c *fiber.Ctx) error {
		user := c.Locals("user").(*models.User)
		if !user.CanSell() {
			return c.Status(403).JSON(fiber.Map{
				"error": fiber.Map{
					"code":    "FORBIDDEN",
					"message": "Seller access required",
				},
			})
		}
		return c.Next()
	}
}

// AdminOnly middleware checks if user is admin
func AdminOnly() fiber.Handler {
	return func(c *fiber.Ctx) error {
		user := c.Locals("user").(*models.User)
		if !user.IsAdmin() {
			return c.Status(403).JSON(fiber.Map{
				"error": fiber.Map{
					"code":    "FORBIDDEN",
					"message": "Admin access required",
				},
			})
		}
		return c.Next()
	}
}
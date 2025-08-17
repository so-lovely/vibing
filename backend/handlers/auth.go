package handlers

import (
	"fmt"
	"github.com/gofiber/fiber/v2"
	"golang.org/x/crypto/bcrypt"
	"vibing-backend/database"
	"vibing-backend/models"
	"vibing-backend/utils"
)

type SignupRequest struct {
	Email         string `json:"email" validate:"required,email"`
	Password      string `json:"password" validate:"required,min=8"`
	Name          string `json:"name" validate:"required,min=2"`
	Role          string `json:"role" validate:"oneof=buyer seller"`
	Phone         string `json:"phone" validate:"omitempty,e164"`
	PhoneVerified bool   `json:"phoneVerified"`
	RecaptchaToken string `json:"recaptchaToken"`
}

type LoginRequest struct {
	Email         string `json:"email" validate:"required,email"`
	Password      string `json:"password" validate:"required"`
	RecaptchaToken string `json:"recaptchaToken"`
}

type RefreshRequest struct {
	RefreshToken string `json:"refreshToken" validate:"required"`
}

// Signup creates a new user account
func Signup(c *fiber.Ctx) error {
	var req SignupRequest
	if err := c.BodyParser(&req); err != nil {
		fmt.Printf("Body parsing error: %v\n", err)
		return c.Status(400).JSON(fiber.Map{
			"error": fiber.Map{
				"code":    "VALIDATION_ERROR",
				"message": "Invalid request body",
			},
		})
	}

	fmt.Printf("Signup request: %+v\n", req)

	// Validate request
	if err := utils.ValidateStruct(req); err != nil {
		fmt.Printf("Validation error: %v\n", err)
		return c.Status(400).JSON(fiber.Map{
			"error": fiber.Map{
				"code":    "VALIDATION_ERROR",
				"message": "Validation failed",
				"details": err,
			},
		})
	}

	// Check if user already exists
	var existingUser models.User
	if err := database.DB.Where("email = ?", req.Email).First(&existingUser).Error; err == nil {
		return c.Status(409).JSON(fiber.Map{
			"error": fiber.Map{
				"code":    "CONFLICT",
				"message": "User already exists",
			},
		})
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": fiber.Map{
				"code":    "INTERNAL_ERROR",
				"message": "Failed to process password",
			},
		})
	}

	// Create user
	user := models.User{
		Email:         req.Email,
		Name:          req.Name,
		PasswordHash:  string(hashedPassword),
		Role:          req.Role,
		PhoneVerified: req.PhoneVerified,
	}

	if req.Phone != "" {
		user.Phone = &req.Phone
	}

	if err := database.DB.Create(&user).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": fiber.Map{
				"code":    "INTERNAL_ERROR",
				"message": "Failed to create user",
			},
		})
	}

	// Generate tokens
	token, err := utils.GenerateJWT(user.ID, user.Email, user.Role)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": fiber.Map{
				"code":    "INTERNAL_ERROR",
				"message": "Failed to generate token",
			},
		})
	}

	refreshToken, err := utils.GenerateRefreshToken(user.ID)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": fiber.Map{
				"code":    "INTERNAL_ERROR",
				"message": "Failed to generate refresh token",
			},
		})
	}

	return c.Status(201).JSON(fiber.Map{
		"user":         user.Public(),
		"token":        token,
		"refreshToken": refreshToken,
	})
}

// Login authenticates user
func Login(c *fiber.Ctx) error {
	var req LoginRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error": fiber.Map{
				"code":    "VALIDATION_ERROR",
				"message": "Invalid request body",
			},
		})
	}

	// Find user
	var user models.User
	if err := database.DB.Where("email = ?", req.Email).First(&user).Error; err != nil {
		return c.Status(401).JSON(fiber.Map{
			"error": fiber.Map{
				"code":    "UNAUTHORIZED",
				"message": "Invalid credentials",
			},
		})
	}

	// Check password
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		return c.Status(401).JSON(fiber.Map{
			"error": fiber.Map{
				"code":    "UNAUTHORIZED",
				"message": "Invalid credentials",
			},
		})
	}

	// Generate tokens
	token, err := utils.GenerateJWT(user.ID, user.Email, user.Role)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": fiber.Map{
				"code":    "INTERNAL_ERROR",
				"message": "Failed to generate token",
			},
		})
	}

	refreshToken, err := utils.GenerateRefreshToken(user.ID)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": fiber.Map{
				"code":    "INTERNAL_ERROR",
				"message": "Failed to generate refresh token",
			},
		})
	}

	return c.JSON(fiber.Map{
		"user":         user.Public(),
		"token":        token,
		"refreshToken": refreshToken,
	})
}

// GetMe returns current user info
func GetMe(c *fiber.Ctx) error {
	user := c.Locals("user").(*models.User)
	return c.JSON(fiber.Map{
		"user": user.Public(),
	})
}

// Logout invalidates user tokens
func Logout(c *fiber.Ctx) error {
	// In a real implementation, you'd blacklist the token
	return c.JSON(fiber.Map{
		"message": "Logged out successfully",
	})
}

// RefreshToken generates new access token
func RefreshToken(c *fiber.Ctx) error {
	var req RefreshRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error": fiber.Map{
				"code":    "VALIDATION_ERROR",
				"message": "Invalid request body",
			},
		})
	}

	claims, err := utils.ValidateJWT(req.RefreshToken)
	if err != nil {
		return c.Status(401).JSON(fiber.Map{
			"error": fiber.Map{
				"code":    "UNAUTHORIZED",
				"message": "Invalid refresh token",
			},
		})
	}

	// Get user
	var user models.User
	if err := database.DB.First(&user, "id = ?", claims.UserID).Error; err != nil {
		return c.Status(401).JSON(fiber.Map{
			"error": fiber.Map{
				"code":    "UNAUTHORIZED",
				"message": "User not found",
			},
		})
	}

	// Generate new token
	token, err := utils.GenerateJWT(user.ID, user.Email, user.Role)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": fiber.Map{
				"code":    "INTERNAL_ERROR",
				"message": "Failed to generate token",
			},
		})
	}

	return c.JSON(fiber.Map{
		"token": token,
	})
}
package handlers

import (
	"github.com/gofiber/fiber/v2"
	"vibing-backend/services"
)

type VerifyReCAPTCHARequest struct {
	Token  string `json:"token" validate:"required"`
	Action string `json:"action" validate:"required"`
}

var recaptchaService *services.ReCAPTCHAService

// VerifyReCAPTCHA verifies reCAPTCHA token server-side
func VerifyReCAPTCHA(c *fiber.Ctx) error {
	var req VerifyReCAPTCHARequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error": fiber.Map{
				"code":    "VALIDATION_ERROR",
				"message": "Invalid request body",
			},
		})
	}

	if recaptchaService == nil {
		return c.Status(500).JSON(fiber.Map{
			"error": fiber.Map{
				"code":    "SERVICE_ERROR",
				"message": "reCAPTCHA service not available",
			},
		})
	}

	// Verify token with Google
	remoteIP := c.IP()
	response, err := recaptchaService.VerifyToken(req.Token, remoteIP)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": fiber.Map{
				"code":    "RECAPTCHA_ERROR",
				"message": "Failed to verify reCAPTCHA",
			},
		})
	}

	// Check for errors
	if response.HasErrors() {
		return c.Status(400).JSON(fiber.Map{
			"error": fiber.Map{
				"code":    "RECAPTCHA_FAILED",
				"message": response.GetErrorMessage(),
			},
		})
	}

	// Check minimum score (0.5 is recommended threshold)
	minScore := 0.5
	if !response.IsValidScore(minScore) {
		return c.Status(400).JSON(fiber.Map{
			"error": fiber.Map{
				"code":    "RECAPTCHA_FAILED",
				"message": "reCAPTCHA score too low",
			},
		})
	}

	// Verify action matches expected action
	if response.Action != req.Action {
		return c.Status(400).JSON(fiber.Map{
			"error": fiber.Map{
				"code":    "RECAPTCHA_FAILED",
				"message": "reCAPTCHA action mismatch",
			},
		})
	}

	return c.JSON(fiber.Map{
		"success": response.Success,
		"score":   response.Score,
		"action":  response.Action,
	})
}

// InitSecurityServices initializes security-related services
func InitSecurityServices(recaptchaSecretKey string) {
	recaptchaService = services.NewReCAPTCHAService(recaptchaSecretKey)
}
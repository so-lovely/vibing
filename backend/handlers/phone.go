package handlers

import (
	"github.com/gofiber/fiber/v2"
	"vibing-backend/services"
)

type SendVerificationCodeRequest struct {
	Phone         string `json:"phone" validate:"required,e164"`
	RecaptchaToken string `json:"recaptchaToken"`
}

type VerifyPhoneRequest struct {
	Phone string `json:"phone" validate:"required,e164"`
	Code  string `json:"code" validate:"required,len=6"`
}

// SendVerificationCode sends SMS verification code
func SendVerificationCode(c *fiber.Ctx) error {
	var req SendVerificationCodeRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error": fiber.Map{
				"code":    "VALIDATION_ERROR",
				"message": "Invalid request body",
			},
		})
	}

	// TODO: Verify reCAPTCHA token

	// Send SMS via SENS
	requestID, code, err := services.SendSMSVerification(req.Phone)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": fiber.Map{
				"code":    "SMS_FAILED",
				"message": "Failed to send verification code",
			},
		})
	}

	response := fiber.Map{
		"message":   "Verification code sent",
		"requestId": requestID,
	}
	
	// Include verification code in development mode for testing
	// In production with real SENS, this should be removed
	if code != "" {
		response["code"] = code
	}
	
	return c.JSON(response)
}

// VerifyPhone verifies phone number with SMS code
func VerifyPhone(c *fiber.Ctx) error {
	var req VerifyPhoneRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error": fiber.Map{
				"code":    "VALIDATION_ERROR",
				"message": "Invalid request body",
			},
		})
	}

	// Verify code
	verified, err := services.VerifySMSCode(req.Phone, req.Code)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": fiber.Map{
				"code":    "VERIFICATION_FAILED",
				"message": "Failed to verify code",
			},
		})
	}

	if !verified {
		return c.Status(400).JSON(fiber.Map{
			"error": fiber.Map{
				"code":    "INVALID_CODE",
				"message": "Invalid verification code",
			},
		})
	}

	return c.JSON(fiber.Map{
		"verified": true,
		"message":  "Phone number verified successfully",
	})
}
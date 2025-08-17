package middleware

import (
	"sync"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/limiter"
	"vibing-backend/models"
)

// RateLimitConfig holds rate limiting configuration
type RateLimitConfig struct {
	Max        int
	Expiration time.Duration
	Message    string
}

// defaultRateLimit creates default rate limiting middleware
func defaultRateLimit() fiber.Handler {
	return limiter.New(limiter.Config{
		Max:        100, // 100 requests
		Expiration: 1 * time.Minute,
		KeyGenerator: func(c *fiber.Ctx) string {
			return c.IP()
		},
		LimitReached: func(c *fiber.Ctx) error {
			return c.Status(429).JSON(fiber.Map{
				"error": fiber.Map{
					"code":    "RATE_LIMITED",
					"message": "Too many requests",
				},
			})
		},
	})
}

// AuthRateLimit creates rate limiting for authentication endpoints
func AuthRateLimit() fiber.Handler {
	return limiter.New(limiter.Config{
		Max:        10, // 10 attempts
		Expiration: 1 * time.Minute,
		KeyGenerator: func(c *fiber.Ctx) string {
			return c.IP()
		},
		LimitReached: func(c *fiber.Ctx) error {
			return c.Status(429).JSON(fiber.Map{
				"error": fiber.Map{
					"code":    "RATE_LIMITED",
					"message": "Too many authentication attempts. Please try again later.",
				},
			})
		},
	})
}

// SMSRateLimit creates rate limiting for SMS endpoints
func SMSRateLimit() fiber.Handler {
	return limiter.New(limiter.Config{
		Max:        3, // 3 SMS per hour
		Expiration: 1 * time.Hour,
		KeyGenerator: func(c *fiber.Ctx) string {
			return c.IP()
		},
		LimitReached: func(c *fiber.Ctx) error {
			return c.Status(429).JSON(fiber.Map{
				"error": fiber.Map{
					"code":    "RATE_LIMITED",
					"message": "Too many SMS requests. Please try again later.",
				},
			})
		},
	})
}

// PaymentRateLimit creates rate limiting for payment endpoints
func PaymentRateLimit() fiber.Handler {
	return limiter.New(limiter.Config{
		Max:        5, // 5 payment attempts per minute
		Expiration: 1 * time.Minute,
		KeyGenerator: func(c *fiber.Ctx) string {
			return c.IP()
		},
		LimitReached: func(c *fiber.Ctx) error {
			return c.Status(429).JSON(fiber.Map{
				"error": fiber.Map{
					"code":    "RATE_LIMITED",
					"message": "Too many payment attempts. Please try again later.",
				},
			})
		},
	})
}

// UploadRateLimit creates rate limiting for file upload endpoints
func UploadRateLimit() fiber.Handler {
	return limiter.New(limiter.Config{
		Max:        20, // 20 uploads per hour
		Expiration: 1 * time.Hour,
		KeyGenerator: func(c *fiber.Ctx) string {
			// Use user ID if authenticated, otherwise IP
			if user := c.Locals("user"); user != nil {
				return "user:" + user.(*models.User).ID
			}
			return c.IP()
		},
		LimitReached: func(c *fiber.Ctx) error {
			return c.Status(429).JSON(fiber.Map{
				"error": fiber.Map{
					"code":    "RATE_LIMITED",
					"message": "Too many upload attempts. Please try again later.",
				},
			})
		},
	})
}

// Custom in-memory rate limiter for specific scenarios
type MemoryLimiter struct {
	store map[string]*LimitData
	mutex sync.RWMutex
}

type LimitData struct {
	Count     int
	ResetTime time.Time
}

var phoneRateLimiter = &MemoryLimiter{
	store: make(map[string]*LimitData),
}

// PhoneNumberRateLimit limits SMS requests per phone number
func PhoneNumberRateLimit(maxAttempts int, window time.Duration) fiber.Handler {
	return func(c *fiber.Ctx) error {
		var requestData struct {
			Phone string `json:"phone"`
		}

		if err := c.BodyParser(&requestData); err != nil {
			return c.Next()
		}

		if requestData.Phone == "" {
			return c.Next()
		}

		phoneRateLimiter.mutex.Lock()
		defer phoneRateLimiter.mutex.Unlock()

		now := time.Now()
		key := "phone:" + requestData.Phone

		// Clean up expired entries
		if data, exists := phoneRateLimiter.store[key]; exists {
			if now.After(data.ResetTime) {
				delete(phoneRateLimiter.store, key)
			}
		}

		// Check or create limit data
		data, exists := phoneRateLimiter.store[key]
		if !exists {
			phoneRateLimiter.store[key] = &LimitData{
				Count:     1,
				ResetTime: now.Add(window),
			}
			return c.Next()
		}

		if data.Count >= maxAttempts {
			return c.Status(429).JSON(fiber.Map{
				"error": fiber.Map{
					"code":    "RATE_LIMITED",
					"message": "Too many SMS requests for this phone number. Please try again later.",
				},
			})
		}

		data.Count++
		return c.Next()
	}
}

// SecurityHeaders adds security headers to responses
func SecurityHeaders() fiber.Handler {
	return func(c *fiber.Ctx) error {
		c.Set("X-Content-Type-Options", "nosniff")
		c.Set("X-Frame-Options", "DENY")
		c.Set("X-XSS-Protection", "1; mode=block")
		c.Set("Referrer-Policy", "strict-origin-when-cross-origin")
		c.Set("Content-Security-Policy", "default-src 'self'")
		return c.Next()
	}
}
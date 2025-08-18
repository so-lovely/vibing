package routes

import (
	"log"
	"time"

	"github.com/gofiber/fiber/v2"
	"vibing-backend/config"
	"vibing-backend/handlers"
	"vibing-backend/middleware"
	"vibing-backend/services"
)

func Setup(app *fiber.App, cfg *config.Config) {
	// Initialize SMS service
	if err := services.InitSMSService(cfg.Redis.URL, &cfg.SENS); err != nil {
		log.Printf("Failed to initialize SMS service: %v", err)
	}

	// Initialize S3 service
	if err := handlers.InitS3Service(&cfg.S3); err != nil {
		log.Fatalf("Failed to initialize S3 service: %v", err)
	}

	// Add security headers
	app.Use(middleware.SecurityHeaders())

	api := app.Group("/api")

	// Health check
	api.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"status": "ok"})
	})

	// Auth routes with rate limiting
	authRoutes := api.Group("/auth")
	authRoutes.Use(middleware.AuthRateLimit())
	authRoutes.Post("/signup", handlers.Signup)
	authRoutes.Post("/login", handlers.Login)
	authRoutes.Post("/logout", middleware.Auth(), handlers.Logout)
	authRoutes.Post("/refresh", handlers.RefreshToken)
	authRoutes.Get("/me", middleware.Auth(), handlers.GetMe)
	authRoutes.Put("/profile", middleware.Auth(), handlers.UpdateProfile)
	authRoutes.Post("/send-verification-code", middleware.SMSRateLimit(), middleware.PhoneNumberRateLimit(3, time.Hour), handlers.SendVerificationCode)
	authRoutes.Post("/verify-phone", handlers.VerifyPhone)

	// Product routes
	productRoutes := api.Group("/products")
	productRoutes.Get("/", handlers.GetProducts)
	productRoutes.Get("/categories", handlers.GetCategories)
	productRoutes.Get("/:id", handlers.GetProduct)
	productRoutes.Post("/", middleware.Auth(), middleware.SellerOnly(), handlers.CreateProduct)
	productRoutes.Put("/:id", middleware.Auth(), handlers.UpdateProduct)
	productRoutes.Delete("/:id", middleware.Auth(), handlers.DeleteProduct)
	productRoutes.Post("/:id/like", middleware.Auth(), handlers.ToggleLike)
	productRoutes.Get("/:id/reviews", handlers.GetProductReviews)
	productRoutes.Post("/:id/reviews", middleware.Auth(), handlers.CreateReview)

	// Payment routes with rate limiting
	paymentRoutes := api.Group("/payment")
	paymentRoutes.Use(middleware.PaymentRateLimit())
	paymentRoutes.Post("/create-order", middleware.Auth(), handlers.CreatePaymentOrder)
	paymentRoutes.Post("/confirm", middleware.Auth(), handlers.ConfirmPayment)
	paymentRoutes.Post("/webhook", handlers.PaymentWebhook)
	paymentRoutes.Get("/cancel/:orderId", middleware.Auth(), handlers.CancelPayment)

	// Purchase routes
	purchaseRoutes := api.Group("/purchase")
	purchaseRoutes.Use(middleware.Auth())
	purchaseRoutes.Post("/create", handlers.CreatePurchase)
	purchaseRoutes.Get("/history", handlers.GetPurchaseHistory)
	purchaseRoutes.Get("/stats", handlers.GetPurchaseStats)
	purchaseRoutes.Get("/:id/download", handlers.GetDownloadURL)
	purchaseRoutes.Get("/check/:productId", handlers.CheckPurchaseStatus)
	purchaseRoutes.Post("/:id/generate-license", handlers.GenerateLicense)
	purchaseRoutes.Post("/:id/dispute", handlers.RequestDispute)

	// Seller routes
	sellerRoutes := api.Group("/seller")
	sellerRoutes.Use(middleware.Auth(), middleware.SellerOnly())
	sellerRoutes.Get("/dashboard", handlers.GetSellerDashboard)
	sellerRoutes.Get("/products", handlers.GetSellerProducts)
	sellerRoutes.Get("/sales", handlers.GetSellerSales)
	sellerRoutes.Get("/analytics", handlers.GetSellerAnalytics)

	// Chat routes
	chatRoutes := api.Group("/chat")
	chatRoutes.Use(middleware.Auth())
	chatRoutes.Get("/conversations", handlers.GetConversations)
	chatRoutes.Post("/conversations", handlers.CreateConversation)
	chatRoutes.Get("/conversations/:id/messages", handlers.GetMessages)
	chatRoutes.Post("/conversations/:id/messages", handlers.SendMessage)
	chatRoutes.Put("/conversations/:id/read", handlers.MarkAsRead)
	chatRoutes.Delete("/conversations/:id", handlers.DeleteConversation)

	// Admin routes
	adminRoutes := api.Group("/admin")
	adminRoutes.Use(middleware.Auth(), middleware.AdminOnly())
	adminRoutes.Get("/stats", handlers.GetAdminStats)
	adminRoutes.Get("/users", handlers.GetUsers)
	adminRoutes.Put("/users/:id/role", handlers.UpdateUserRole)
	adminRoutes.Delete("/users/:id", handlers.DeleteUser)
	adminRoutes.Get("/products", handlers.GetAdminProducts)
	adminRoutes.Put("/products/:id/status", handlers.UpdateProductStatus)
	adminRoutes.Get("/sales", handlers.GetAdminSales)
	adminRoutes.Get("/disputes", handlers.GetDisputedPurchases)
	adminRoutes.Put("/disputes/:id/process", handlers.ProcessDispute)
	adminRoutes.Put("/disputes/:id/resolve", handlers.ResolveDispute)

	// Upload routes with rate limiting
	uploadRoutes := api.Group("/upload")
	uploadRoutes.Use(middleware.Auth(), middleware.UploadRateLimit())
	uploadRoutes.Post("/image", middleware.SellerOnly(), handlers.UploadImage)
	uploadRoutes.Post("/product-files", middleware.SellerOnly(), handlers.UploadProductFiles)
	uploadRoutes.Get("/signed-url", middleware.SellerOnly(), handlers.GetSignedURL)

	// Security routes
	securityRoutes := api.Group("/security")
	securityRoutes.Post("/verify-recaptcha", handlers.VerifyReCAPTCHA)
}
package services

import (
	"fmt"
	"log"
	"strings"
	"time"

	"vibing-backend/config"
	"vibing-backend/database"
	"vibing-backend/models"
)

// SchedulerService manages automatic confirmation and dispute processing
type SchedulerService struct {
	stopChan chan bool
}

// NewSchedulerService creates a new scheduler service
func NewSchedulerService() *SchedulerService {
	return &SchedulerService{
		stopChan: make(chan bool),
	}
}

// Start begins the scheduled task processing
func (s *SchedulerService) Start() {
	go s.runScheduler()
}

// Stop terminates the scheduler
func (s *SchedulerService) Stop() {
	s.stopChan <- true
}

// runScheduler runs the scheduled tasks every hour
func (s *SchedulerService) runScheduler() {
	ticker := time.NewTicker(1 * time.Hour)
	defer ticker.Stop()

	log.Println("Purchase scheduler started")

	// Run immediately on start
	s.processAutoConfirmations()
	s.processPlatformInterventions()

	for {
		select {
		case <-ticker.C:
			s.processAutoConfirmations()
			s.processPlatformInterventions()
		case <-s.stopChan:
			log.Println("Purchase scheduler stopped")
			return
		}
	}
}

// processAutoConfirmations automatically confirms purchases after the waiting period
func (s *SchedulerService) processAutoConfirmations() {
	var purchases []models.Purchase

	// Find purchases that should be auto-confirmed
	err := database.DB.Where("status = ? AND auto_confirm_at IS NOT NULL AND auto_confirm_at <= ?", 
		"completed", time.Now()).Preload("Product").Find(&purchases).Error
	
	if err != nil {
		log.Printf("Error finding purchases for auto-confirmation: %v", err)
		return
	}

	confirmed := 0
	for _, purchase := range purchases {
		if purchase.ShouldAutoConfirm() {
			if err := purchase.AutoConfirm(); err != nil {
				log.Printf("Error auto-confirming purchase %s: %v", purchase.ID, err)
				continue
			}

			// Delete S3 file after confirmation
			if err := deleteS3FileForPurchase(purchase); err != nil {
				log.Printf("Warning: Failed to delete S3 file for purchase %s: %v", purchase.ID, err)
				// Don't fail the confirmation process if file deletion fails
			}

			if err := database.DB.Save(&purchase).Error; err != nil {
				log.Printf("Error saving auto-confirmed purchase %s: %v", purchase.ID, err)
				continue
			}

			confirmed++
			log.Printf("Auto-confirmed purchase %s (Order: %s)", purchase.ID, purchase.OrderID)
		}
	}

	if confirmed > 0 {
		log.Printf("Auto-confirmed %d purchases", confirmed)
	}
}

// processPlatformInterventions handles disputes that require platform intervention
func (s *SchedulerService) processPlatformInterventions() {
	var purchases []models.Purchase

	// Find disputes that require platform intervention
	err := database.DB.Where("status = ? AND platform_intervention_at IS NOT NULL AND platform_intervention_at <= ?", 
		"dispute_requested", time.Now()).Find(&purchases).Error
	
	if err != nil {
		log.Printf("Error finding disputes for platform intervention: %v", err)
		return
	}

	processed := 0
	for _, purchase := range purchases {
		if purchase.ShouldPlatformIntervene() {
			if err := purchase.ProcessDispute(); err != nil {
				log.Printf("Error processing dispute for purchase %s: %v", purchase.ID, err)
				continue
			}

			if err := database.DB.Save(&purchase).Error; err != nil {
				log.Printf("Error saving processed dispute for purchase %s: %v", purchase.ID, err)
				continue
			}

			processed++
			log.Printf("Platform intervention started for dispute %s (Order: %s)", purchase.ID, purchase.OrderID)
			
			// Here you could send notifications to admin/support team
			// s.notifyAdminOfDispute(purchase)
		}
	}

	if processed > 0 {
		log.Printf("Processed %d disputes for platform intervention", processed)
	}
}

// GetPendingConfirmations returns purchases pending auto-confirmation
func (s *SchedulerService) GetPendingConfirmations() ([]models.Purchase, error) {
	var purchases []models.Purchase
	
	err := database.DB.Where("status = ? AND auto_confirm_at IS NOT NULL AND auto_confirm_at > ?", 
		"completed", time.Now()).
		Preload("Product").
		Preload("User").
		Order("auto_confirm_at ASC").
		Find(&purchases).Error
	
	return purchases, err
}

// GetPendingInterventions returns disputes awaiting platform intervention
func (s *SchedulerService) GetPendingInterventions() ([]models.Purchase, error) {
	var purchases []models.Purchase
	
	err := database.DB.Where("status = ? AND platform_intervention_at IS NOT NULL", 
		"dispute_requested").
		Preload("Product").
		Preload("User").
		Order("platform_intervention_at ASC").
		Find(&purchases).Error
	
	return purchases, err
}

// ForceAutoConfirm manually triggers auto-confirmation for a purchase (admin use)
func (s *SchedulerService) ForceAutoConfirm(purchaseID string) error {
	var purchase models.Purchase
	if err := database.DB.Where("id = ?", purchaseID).Preload("Product").First(&purchase).Error; err != nil {
		return err
	}

	if err := purchase.AutoConfirm(); err != nil {
		return err
	}

	// Delete S3 file after confirmation
	if err := deleteS3FileForPurchase(purchase); err != nil {
		log.Printf("Warning: Failed to delete S3 file for purchase %s: %v", purchase.ID, err)
		// Don't fail the confirmation process if file deletion fails
	}

	return database.DB.Save(&purchase).Error
}

// ForceProcessDispute manually triggers dispute processing (admin use)
func (s *SchedulerService) ForceProcessDispute(purchaseID string) error {
	var purchase models.Purchase
	if err := database.DB.Where("id = ?", purchaseID).First(&purchase).Error; err != nil {
		return err
	}

	if err := purchase.ProcessDispute(); err != nil {
		return err
	}

	return database.DB.Save(&purchase).Error
}

// Global scheduler instance
var PurchaseScheduler *SchedulerService

// InitScheduler initializes the global scheduler
func InitScheduler() {
	PurchaseScheduler = NewSchedulerService()
	PurchaseScheduler.Start()
}

// StopScheduler stops the global scheduler
func StopScheduler() {
	if PurchaseScheduler != nil {
		PurchaseScheduler.Stop()
	}
}

// deleteS3FileForPurchase deletes the S3 file for a purchase
func deleteS3FileForPurchase(purchase models.Purchase) error {
	if purchase.Product.FileURL == "" {
		return nil // No file to delete
	}
	
	// Extract S3 key from the full S3 URL
	s3Key := extractS3KeyFromURL(purchase.Product.FileURL)
	if s3Key == "" {
		return fmt.Errorf("failed to extract S3 key from URL: %s", purchase.Product.FileURL)
	}
	
	// Load S3 configuration
	cfg, err := config.Load()
	if err != nil {
		return fmt.Errorf("failed to load config: %v", err)
	}
	
	// Create S3 service
	s3Service, err := NewS3Service(&cfg.S3)
	if err != nil {
		return fmt.Errorf("failed to create S3 service: %v", err)
	}
	
	// Delete the file
	if err := s3Service.DeleteFile(s3Key); err != nil {
		return fmt.Errorf("failed to delete S3 file: %v", err)
	}
	
	log.Printf("Successfully deleted S3 file for purchase %s: %s", purchase.ID, s3Key)
	return nil
}

// extractS3KeyFromURL extracts the S3 object key from a full S3 URL
// Example: https://bucket.s3.region.amazonaws.com/path/to/file.zip -> path/to/file.zip
func extractS3KeyFromURL(s3URL string) string {
	// Split by ".amazonaws.com/"
	parts := strings.Split(s3URL, ".amazonaws.com/")
	if len(parts) == 2 {
		return parts[1]
	}
	return ""
}
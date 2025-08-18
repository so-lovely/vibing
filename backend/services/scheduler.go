package services

import (
	"log"
	"time"

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
		"completed", time.Now()).Find(&purchases).Error
	
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
	if err := database.DB.Where("id = ?", purchaseID).First(&purchase).Error; err != nil {
		return err
	}

	if err := purchase.AutoConfirm(); err != nil {
		return err
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
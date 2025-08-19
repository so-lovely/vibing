package models

import (
	"time"

	"gorm.io/gorm"
)

type Purchase struct {
	ID                    string     `json:"id" gorm:"primaryKey"`
	UserID                string     `json:"userId" gorm:"not null"`
	ProductID             string     `json:"productId" gorm:"not null"`
	OrderID               string     `json:"orderId" gorm:"unique;not null"`
	Price                 float64    `json:"price" gorm:"not null"`
	Status                string     `json:"status" gorm:"type:varchar(20);default:'pending';check:status IN ('completed','pending','failed','refunded','cancelled','confirmed','dispute_requested','dispute_processing','dispute_resolved')"`
	PaymentMethod         string     `json:"paymentMethod"`
	TossPaymentKey        string     `json:"tossPaymentKey"`
	TossOrderID           string     `json:"tossOrderId"`
	DownloadURL           *string    `json:"downloadUrl"`
	LicenseKey            *string    `json:"licenseKey"`
	IsSubscription        bool       `json:"isSubscription" gorm:"default:false"`
	SubscriptionExpiresAt *time.Time `json:"subscriptionExpiresAt"`
	DownloadCount         int        `json:"downloadCount" gorm:"default:0"`
	MaxDownloads          int        `json:"maxDownloads" gorm:"default:5"`
	
	// Dispute system fields
	DisputeReason         *string    `json:"disputeReason"`
	DisputeRequestedAt    *time.Time `json:"disputeRequestedAt"`
	DisputeResolvedAt     *time.Time `json:"disputeResolvedAt"`
	AutoConfirmAt         *time.Time `json:"autoConfirmAt"`
	PlatformInterventionAt *time.Time `json:"platformInterventionAt"`
	DisputeNotes          *string    `json:"disputeNotes"`
	
	CreatedAt             time.Time  `json:"createdAt"`
	UpdatedAt             time.Time  `json:"updatedAt"`
	DeletedAt             gorm.DeletedAt `json:"-" gorm:"index"`

	// Relations
	User    User    `json:"user" gorm:"foreignKey:UserID"`
	Product Product `json:"product" gorm:"foreignKey:ProductID"`
}

// BeforeCreate hook to generate UUID and OrderID
func (p *Purchase) BeforeCreate(tx *gorm.DB) error {
	if p.ID == "" {
		p.ID = generateUUID()
	}
	if p.OrderID == "" {
		p.OrderID = generateOrderID()
	}
	
	// Set auto-confirm timer for completed purchases (7 days)
	if p.Status == "completed" {
		autoConfirmTime := time.Now().Add(7 * 24 * time.Hour)
		p.AutoConfirmAt = &autoConfirmTime
	}
	
	return nil
}

// CanDownload checks if purchase allows downloading
func (p *Purchase) CanDownload() bool {
	if p.Status != "completed" {
		return false
	}

	// Check subscription expiry
	if p.IsSubscription && p.SubscriptionExpiresAt != nil {
		if time.Now().After(*p.SubscriptionExpiresAt) {
			return false
		}
	}

	// Check download count
	if p.MaxDownloads > 0 && p.DownloadCount >= p.MaxDownloads {
		return false
	}

	return true
}

// IncrementDownload increments download count if within limits
func (p *Purchase) IncrementDownload(db *gorm.DB) error {
	if !p.CanDownload() {
		return ErrDownloadNotAllowed
	}

	return db.Model(p).UpdateColumn("download_count", gorm.Expr("download_count + ?", 1)).Error
}

// GenerateDownloadURL creates a secure download URL
func (p *Purchase) GenerateDownloadURL() string {
	// Return the actual file URL from the product
	// Pre-signed URL generation will be handled in the handler
	if p.Product.FileURL != "" {
		return p.Product.FileURL
	}
	// Fallback placeholder if no file URL
	return "https://download.vibing.com/secure/" + p.ID
}

// GenerateLicenseKey creates a license key for the purchase
func (p *Purchase) GenerateLicenseKey() string {
	// Generate a unique license key
	return "VB-" + generateRandomString(16) + "-" + p.ProductID[:8]
}

// IsExpired checks if subscription is expired
func (p *Purchase) IsExpired() bool {
	if !p.IsSubscription || p.SubscriptionExpiresAt == nil {
		return false
	}
	return time.Now().After(*p.SubscriptionExpiresAt)
}

// DaysUntilExpiry returns days until subscription expires
func (p *Purchase) DaysUntilExpiry() *int {
	if !p.IsSubscription || p.SubscriptionExpiresAt == nil {
		return nil
	}
	days := int(time.Until(*p.SubscriptionExpiresAt).Hours() / 24)
	return &days
}

// Dispute system methods
func (p *Purchase) CanRequestDispute() bool {
	return p.Status == "completed" && 
		   p.DisputeRequestedAt == nil &&
		   (p.AutoConfirmAt == nil || time.Now().Before(*p.AutoConfirmAt))
}

func (p *Purchase) RequestDispute(reason string) error {
	if !p.CanRequestDispute() {
		return ErrDisputeNotAllowed
	}
	
	now := time.Now()
	p.Status = "dispute_requested"
	p.DisputeReason = &reason
	p.DisputeRequestedAt = &now
	
	// Platform intervention after 3 days of dispute
	interventionTime := now.Add(3 * 24 * time.Hour)
	p.PlatformInterventionAt = &interventionTime
	
	return nil
}

func (p *Purchase) ProcessDispute() error {
	if p.Status != "dispute_requested" {
		return ErrInvalidDisputeStatus
	}
	
	p.Status = "dispute_processing"
	return nil
}

func (p *Purchase) ResolveDispute(resolution string, refund bool) error {
	if p.Status != "dispute_processing" && p.Status != "dispute_requested" {
		return ErrInvalidDisputeStatus
	}
	
	now := time.Now()
	p.DisputeResolvedAt = &now
	p.DisputeNotes = &resolution
	
	if refund {
		p.Status = "refunded"
	} else {
		p.Status = "confirmed"
		// Note: S3 file deletion will be handled in the service layer
	}
	
	return nil
}

func (p *Purchase) ShouldAutoConfirm() bool {
	return p.Status == "completed" &&
		   p.AutoConfirmAt != nil &&
		   time.Now().After(*p.AutoConfirmAt) &&
		   p.DisputeRequestedAt == nil
}

func (p *Purchase) ShouldPlatformIntervene() bool {
	return p.Status == "dispute_requested" &&
		   p.PlatformInterventionAt != nil &&
		   time.Now().After(*p.PlatformInterventionAt)
}

func (p *Purchase) AutoConfirm() error {
	if !p.ShouldAutoConfirm() {
		return ErrAutoConfirmNotAllowed
	}
	
	p.Status = "confirmed"
	// Note: S3 file deletion will be handled in the service layer
	return nil
}

func (p *Purchase) GetDisplayStatus() string {
	switch p.Status {
	case "completed":
		if p.AutoConfirmAt != nil && time.Now().Before(*p.AutoConfirmAt) {
			return "구매완료"
		}
		return "구매확정"
	case "confirmed":
		return "구매확정"
	case "dispute_requested":
		return "이의제기중"
	case "dispute_processing":
		return "플랫폼 검토중"
	case "dispute_resolved":
		return "이의제기 완료"
	case "refunded":
		return "환불완료"
	case "pending":
		return "결제대기"
	case "failed":
		return "결제실패"
	case "cancelled":
		return "취소됨"
	default:
		return p.Status
	}
}

func (p *Purchase) GetDaysUntilAutoConfirm() *int {
	if p.Status != "completed" || p.AutoConfirmAt == nil {
		return nil
	}
	days := int(time.Until(*p.AutoConfirmAt).Hours() / 24)
	if days < 0 {
		return nil
	}
	return &days
}
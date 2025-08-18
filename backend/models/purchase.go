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
	Status                string     `json:"status" gorm:"type:varchar(20);default:'pending';check:status IN ('completed','pending','failed','refunded','cancelled')"`
	PaymentMethod         string     `json:"paymentMethod"`
	TossPaymentKey        string     `json:"tossPaymentKey"`
	TossOrderID           string     `json:"tossOrderId"`
	DownloadURL           *string    `json:"downloadUrl"`
	LicenseKey            *string    `json:"licenseKey"`
	IsSubscription        bool       `json:"isSubscription" gorm:"default:false"`
	SubscriptionExpiresAt *time.Time `json:"subscriptionExpiresAt"`
	DownloadCount         int        `json:"downloadCount" gorm:"default:0"`
	MaxDownloads          int        `json:"maxDownloads" gorm:"default:5"`
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
	// In production, this could be a pre-signed S3 URL for security
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
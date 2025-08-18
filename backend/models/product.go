package models

import (
	"time"

	"gorm.io/gorm"
)

type Product struct {
	ID            string         `json:"id" gorm:"primaryKey"`
	Title         string         `json:"title" gorm:"not null" validate:"required,min=3,max=200"`
	Description   string         `json:"description" gorm:"type:text" validate:"required,min=10,max=5000"`
	Price         float64        `json:"price" gorm:"not null" validate:"required,gte=0"`
	OriginalPrice *float64       `json:"originalPrice" validate:"omitempty,gt=0"`
	Rating        float64        `json:"rating" gorm:"default:0"`
	ReviewCount   int            `json:"reviewCount" gorm:"default:0"`
	Downloads     int            `json:"downloads" gorm:"default:0"`
	Views         int            `json:"views" gorm:"default:0"`
	Category      string         `json:"category" gorm:"not null" validate:"required,oneof=libraries cli-tools web-templates mobile desktop design database ai-ml security"`
	Author        string         `json:"author" gorm:"not null"`
	AuthorID      string         `json:"authorId" gorm:"not null"`
	ImageURL      string         `json:"imageUrl" validate:"omitempty,url"`
	IsPro         bool           `json:"isPro" gorm:"default:false"`
	Featured      bool           `json:"featured" gorm:"default:false"`
	Tags          []string `json:"tags" gorm:"type:text[]"`
	Status        string         `json:"status" gorm:"type:varchar(20);default:'pending';check:status IN ('active','pending','rejected','deleted')" validate:"oneof=active pending rejected deleted"`
	FileURL       string `json:"fileUrl"`
	FileSize      string `json:"fileSize"`
	LicenseType   string         `json:"licenseType" validate:"omitempty,oneof=MIT Apache GPL BSD Custom Commercial"`
	CreatedAt     time.Time      `json:"createdAt"`
	UpdatedAt     time.Time      `json:"updatedAt"`
	DeletedAt     gorm.DeletedAt `json:"-" gorm:"index"`

	// Relations
	AuthorUser User       `json:"authorUser,omitempty" gorm:"foreignKey:AuthorID" validate:"-"`
	Purchases  []Purchase `json:"purchases,omitempty" gorm:"foreignKey:ProductID" validate:"-"`
	Reviews    []Review   `json:"reviews,omitempty" gorm:"foreignKey:ProductID" validate:"-"`
}

// BeforeCreate hook to generate UUID
func (p *Product) BeforeCreate(tx *gorm.DB) error {
	if p.ID == "" {
		p.ID = generateUUID()
	}
	return nil
}

// GetDiscountPercentage calculates discount percentage if original price exists
func (p *Product) GetDiscountPercentage() *float64 {
	if p.OriginalPrice == nil || *p.OriginalPrice <= p.Price {
		return nil
	}
	discount := ((*p.OriginalPrice - p.Price) / *p.OriginalPrice) * 100
	return &discount
}

// IsFree checks if product is free
func (p *Product) IsFree() bool {
	return p.Price == 0
}

// CanBeDownloaded checks if product can be downloaded by user
func (p *Product) CanBeDownloaded(userID string) bool {
	// Check if user owns the product through purchases
	for _, purchase := range p.Purchases {
		if purchase.UserID == userID && purchase.Status == "completed" {
			return true
		}
	}
	// Check if user is the author
	return p.AuthorID == userID
}

// UpdateRating recalculates average rating from reviews
func (p *Product) UpdateRating(db *gorm.DB) error {
	var avgRating float64
	var count int64

	result := db.Model(&Review{}).
		Where("product_id = ?", p.ID).
		Select("AVG(rating) as avg_rating, COUNT(*) as count").
		Row()

	if err := result.Scan(&avgRating, &count); err != nil {
		return err
	}

	return db.Model(p).Updates(map[string]interface{}{
		"rating":       avgRating,
		"review_count": count,
	}).Error
}
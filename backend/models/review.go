package models

import (
	"time"

	"gorm.io/gorm"
)

type Review struct {
	ID        string    `json:"id" gorm:"primaryKey"`
	ProductID string    `json:"productId" gorm:"not null"`
	UserID    string    `json:"userId" gorm:"not null"`
	Rating    int       `json:"rating" gorm:"not null;check:rating >= 1 AND rating <= 5" validate:"required,min=1,max=5"`
	Comment   string    `json:"comment" gorm:"type:text" validate:"max=1000"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`

	// Relations
	User    User    `json:"user" gorm:"foreignKey:UserID"`
	Product Product `json:"product" gorm:"foreignKey:ProductID"`
}

// BeforeCreate hook to generate UUID
func (r *Review) BeforeCreate(tx *gorm.DB) error {
	if r.ID == "" {
		r.ID = generateUUID()
	}
	return nil
}

// AfterCreate hook to update product rating
func (r *Review) AfterCreate(tx *gorm.DB) error {
	var product Product
	if err := tx.First(&product, "id = ?", r.ProductID).Error; err != nil {
		return err
	}
	return product.UpdateRating(tx)
}

// AfterUpdate hook to update product rating
func (r *Review) AfterUpdate(tx *gorm.DB) error {
	var product Product
	if err := tx.First(&product, "id = ?", r.ProductID).Error; err != nil {
		return err
	}
	return product.UpdateRating(tx)
}

// AfterDelete hook to update product rating
func (r *Review) AfterDelete(tx *gorm.DB) error {
	var product Product
	if err := tx.First(&product, "id = ?", r.ProductID).Error; err != nil {
		return err
	}
	return product.UpdateRating(tx)
}

// CanUserReview checks if user can review the product
func CanUserReview(db *gorm.DB, userID, productID string) (bool, error) {
	// Check if user has purchased the product
	var purchase Purchase
	err := db.Where("user_id = ? AND product_id = ? AND status = 'completed'", userID, productID).
		First(&purchase).Error
	
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return false, nil // User hasn't purchased the product
		}
		return false, err
	}

	// Check if user has already reviewed the product
	var existingReview Review
	err = db.Where("user_id = ? AND product_id = ?", userID, productID).
		First(&existingReview).Error
	
	if err == nil {
		return false, nil // User has already reviewed
	}
	
	if err != gorm.ErrRecordNotFound {
		return false, err
	}

	return true, nil
}

// GetUserReviewForProduct gets user's review for a specific product
func GetUserReviewForProduct(db *gorm.DB, userID, productID string) (*Review, error) {
	var review Review
	err := db.Where("user_id = ? AND product_id = ?", userID, productID).
		Preload("User").
		First(&review).Error
	
	if err != nil {
		return nil, err
	}
	
	return &review, nil
}

// GetProductReviews gets paginated reviews for a product
func GetProductReviews(db *gorm.DB, productID string, page, limit int) ([]Review, int64, error) {
	var reviews []Review
	var total int64

	// Count total reviews
	if err := db.Model(&Review{}).Where("product_id = ?", productID).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Get paginated reviews
	offset := (page - 1) * limit
	err := db.Where("product_id = ?", productID).
		Preload("User").
		Order("created_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&reviews).Error

	return reviews, total, err
}

// GetRatingDistribution gets rating distribution for a product
func GetRatingDistribution(db *gorm.DB, productID string) (map[int]int64, error) {
	distribution := make(map[int]int64)
	
	// Initialize all ratings to 0
	for i := 1; i <= 5; i++ {
		distribution[i] = 0
	}

	var results []struct {
		Rating int   `json:"rating"`
		Count  int64 `json:"count"`
	}

	err := db.Model(&Review{}).
		Select("rating, COUNT(*) as count").
		Where("product_id = ?", productID).
		Group("rating").
		Find(&results).Error

	if err != nil {
		return nil, err
	}

	for _, result := range results {
		distribution[result.Rating] = result.Count
	}

	return distribution, nil
}
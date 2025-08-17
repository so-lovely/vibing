package models

import (
	"time"

	"gorm.io/gorm"
)

type User struct {
	ID            string    `json:"id" gorm:"primaryKey"`
	Email         string    `json:"email" gorm:"unique;not null" validate:"required,email"`
	Name          string    `json:"name" gorm:"not null" validate:"required,min=2,max=100"`
	PasswordHash  string    `json:"-" gorm:"not null"`
	Avatar        *string   `json:"avatar"`
	Role          string    `json:"role" gorm:"type:varchar(20);default:'buyer';check:role IN ('buyer','seller','admin')" validate:"oneof=buyer seller admin"`
	Phone         *string   `json:"phone" validate:"omitempty,e164"`
	PhoneVerified bool      `json:"phoneVerified" gorm:"default:false"`
	CreatedAt     time.Time `json:"createdAt"`
	UpdatedAt     time.Time `json:"updatedAt"`
	DeletedAt     gorm.DeletedAt `json:"-" gorm:"index"`

	// Relations
	Products  []Product  `json:"products,omitempty" gorm:"foreignKey:AuthorID"`
	Purchases []Purchase `json:"purchases,omitempty" gorm:"foreignKey:UserID"`
	Reviews   []Review   `json:"reviews,omitempty" gorm:"foreignKey:UserID"`
}

// BeforeCreate hook to generate UUID
func (u *User) BeforeCreate(tx *gorm.DB) error {
	if u.ID == "" {
		u.ID = generateUUID()
	}
	return nil
}

// Public returns user data safe for public consumption
func (u *User) Public() *User {
	return &User{
		ID:            u.ID,
		Email:         u.Email,
		Name:          u.Name,
		Avatar:        u.Avatar,
		Role:          u.Role,
		Phone:         u.Phone,
		PhoneVerified: u.PhoneVerified,
		CreatedAt:     u.CreatedAt,
		UpdatedAt:     u.UpdatedAt,
	}
}

// CanSell checks if user has seller permissions
func (u *User) CanSell() bool {
	return u.Role == "seller" || u.Role == "admin"
}

// IsAdmin checks if user has admin permissions
func (u *User) IsAdmin() bool {
	return u.Role == "admin"
}
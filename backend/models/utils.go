package models

import (
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
)

// Common errors
var (
	ErrDownloadNotAllowed = errors.New("download not allowed")
	ErrInvalidCredentials = errors.New("invalid credentials")
	ErrUserNotFound      = errors.New("user not found")
	ErrProductNotFound   = errors.New("product not found")
	ErrUnauthorized      = errors.New("unauthorized")
	ErrForbidden         = errors.New("forbidden")
)

// generateUUID generates a new UUID string
func generateUUID() string {
	return uuid.New().String()
}

// generateOrderID generates a unique order ID
func generateOrderID() string {
	timestamp := time.Now().Unix()
	randomBytes := make([]byte, 4)
	rand.Read(randomBytes)
	return fmt.Sprintf("ORD-%d-%s", timestamp, hex.EncodeToString(randomBytes))
}

// generateRandomString generates a random string of specified length
func generateRandomString(length int) string {
	bytes := make([]byte, length/2)
	rand.Read(bytes)
	return hex.EncodeToString(bytes)[:length]
}
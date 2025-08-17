package services

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"strings"
	"time"
)

type ReCAPTCHAService struct {
	SecretKey string
}

type ReCAPTCHAResponse struct {
	Success     bool      `json:"success"`
	Score       float64   `json:"score"`
	Action      string    `json:"action"`
	ChallengeTS time.Time `json:"challenge_ts"`
	Hostname    string    `json:"hostname"`
	ErrorCodes  []string  `json:"error-codes"`
}

// NewReCAPTCHAService creates new reCAPTCHA service instance
func NewReCAPTCHAService(secretKey string) *ReCAPTCHAService {
	return &ReCAPTCHAService{
		SecretKey: secretKey,
	}
}

// VerifyToken verifies reCAPTCHA v3 token
func (r *ReCAPTCHAService) VerifyToken(token, remoteIP string) (*ReCAPTCHAResponse, error) {
	// Prepare form data
	data := url.Values{}
	data.Set("secret", r.SecretKey)
	data.Set("response", token)
	if remoteIP != "" {
		data.Set("remoteip", remoteIP)
	}

	// Make request to Google reCAPTCHA API
	resp, err := http.PostForm("https://www.google.com/recaptcha/api/siteverify", data)
	if err != nil {
		return nil, fmt.Errorf("failed to verify reCAPTCHA: %w", err)
	}
	defer resp.Body.Close()

	// Parse response
	var recaptchaResp ReCAPTCHAResponse
	if err := json.NewDecoder(resp.Body).Decode(&recaptchaResp); err != nil {
		return nil, fmt.Errorf("failed to parse reCAPTCHA response: %w", err)
	}

	return &recaptchaResp, nil
}

// IsValidScore checks if reCAPTCHA score meets minimum threshold
func (r *ReCAPTCHAResponse) IsValidScore(minScore float64) bool {
	return r.Success && r.Score >= minScore
}

// HasErrors checks if reCAPTCHA response has errors
func (r *ReCAPTCHAResponse) HasErrors() bool {
	return len(r.ErrorCodes) > 0
}

// GetErrorMessage returns formatted error message
func (r *ReCAPTCHAResponse) GetErrorMessage() string {
	if !r.HasErrors() {
		return ""
	}
	return "reCAPTCHA verification failed: " + strings.Join(r.ErrorCodes, ", ")
}
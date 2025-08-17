package services

import (
	"bytes"
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"math/big"
	"net/http"
	"strconv"
	"time"

	"github.com/go-redis/redis/v8"
	"vibing-backend/config"
)

// SMS service for SENS integration
var redisClient *redis.Client
var sensConfig *config.SENSConfig

// InitSMSService initializes SMS service with Redis and SENS config
func InitSMSService(redisURL string, cfg *config.SENSConfig) error {
	opt, err := redis.ParseURL(redisURL)
	if err != nil {
		return err
	}
	redisClient = redis.NewClient(opt)
	sensConfig = cfg
	return nil
}

// SENS API structures
type SENSMessage struct {
	To      string `json:"to"`
	Content string `json:"content"`
}

type SENSRequest struct {
	Type        string        `json:"type"`
	ContentType string        `json:"contentType"`
	CountryCode string        `json:"countryCode"`
	From        string        `json:"from"`
	Content     string        `json:"content"`
	Messages    []SENSMessage `json:"messages"`
}

type SENSResponse struct {
	RequestID   string `json:"requestId"`
	RequestTime string `json:"requestTime"`
	StatusCode  string `json:"statusCode"`
	StatusName  string `json:"statusName"`
}

// Mock verification codes for testing specific phone numbers
var mockVerificationCodes = map[string]string{
	"+821012345678": "123456",
	"+821087654321": "654321", 
	"+821033334444": "111111",
	"+821055556666": "999999",
	"+821077778888": "555555",
	"+821011112222": "000000",
	"+821099998888": "123123",
	"+821044445555": "456456",
}

// SendSMSVerification sends SMS verification code via SENS
func SendSMSVerification(phone string) (string, string, error) {
	var code string
	var err error
	
	// Check if phone number has a predefined mock code
	if mockCode, exists := mockVerificationCodes[phone]; exists {
		code = mockCode
		fmt.Printf("Development mode - Using mock verification code for %s: %s\n", phone, code)
	} else {
		// Generate random 6-digit code for other numbers
		code, err = generateVerificationCode()
		if err != nil {
			return "", "", err
		}
		fmt.Printf("Development mode - Generated verification code for %s: %s\n", phone, code)
	}

	// Store code in Redis with 5 minute expiration
	key := fmt.Sprintf("sms_code:%s", phone)
	err = redisClient.Set(redisClient.Context(), key, code, 5*time.Minute).Err()
	if err != nil {
		return "", "", err
	}

	// Send SMS via SENS API if configured (business account required)
	if sensConfig != nil && sensConfig.AccessKey != "" && sensConfig.SecretKey != "" && sensConfig.ServiceID != "" {
		requestID, err := sendSENSMessage(phone, fmt.Sprintf("[Vibing] Your verification code is: %s", code))
		if err != nil {
			// Log error but don't fail the request - fallback to development mode
			fmt.Printf("SENS API failed: %v - Falling back to development mode\n", err)
			requestID = fmt.Sprintf("fallback_%d", time.Now().Unix())
		}
		return requestID, code, nil
	}

	// Development mode - return mock request ID
	requestID := fmt.Sprintf("dev_%d", time.Now().Unix())
	
	return requestID, code, nil
}

// VerifySMSCode verifies the SMS verification code
func VerifySMSCode(phone, code string) (bool, error) {
	key := fmt.Sprintf("sms_code:%s", phone)
	storedCode, err := redisClient.Get(redisClient.Context(), key).Result()
	if err != nil {
		if err == redis.Nil {
			return false, nil // Code not found or expired
		}
		return false, err
	}

	if storedCode == code {
		// Delete the code after successful verification
		redisClient.Del(redisClient.Context(), key)
		return true, nil
	}

	return false, nil
}

// sendSENSMessage sends SMS via NAVER Cloud Platform SENS API
func sendSENSMessage(phone, message string) (string, error) {
	// SENS API endpoint
	url := fmt.Sprintf("https://sens.apigw.ntruss.com/sms/v2/services/%s/messages", sensConfig.ServiceID)
	
	// Prepare request body
	request := SENSRequest{
		Type:        "SMS",
		ContentType: "COMM",
		CountryCode: "82",
		From:        sensConfig.CallingNumber,
		Content:     message,
		Messages: []SENSMessage{
			{
				To:      phone,
				Content: message,
			},
		},
	}
	
	requestBody, err := json.Marshal(request)
	if err != nil {
		return "", err
	}
	
	// Create HTTP request
	req, err := http.NewRequest("POST", url, bytes.NewBuffer(requestBody))
	if err != nil {
		return "", err
	}
	
	// Generate signature for authentication
	timestamp := strconv.FormatInt(time.Now().UnixNano()/int64(time.Millisecond), 10)
	signature := generateSENSSignature(timestamp, "POST", "/sms/v2/services/"+sensConfig.ServiceID+"/messages")
	
	// Set headers
	req.Header.Set("Content-Type", "application/json; charset=utf-8")
	req.Header.Set("x-ncp-apigw-timestamp", timestamp)
	req.Header.Set("x-ncp-iam-access-key", sensConfig.AccessKey)
	req.Header.Set("x-ncp-apigw-signature-v2", signature)
	
	// Send request
	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()
	
	// Read response
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}
	
	if resp.StatusCode != http.StatusAccepted {
		return "", fmt.Errorf("SENS API error: %s - %s", resp.Status, string(body))
	}
	
	// Parse response
	var sensResp SENSResponse
	if err := json.Unmarshal(body, &sensResp); err != nil {
		return "", err
	}
	
	return sensResp.RequestID, nil
}

// generateSENSSignature generates HMAC SHA256 signature for SENS API authentication
func generateSENSSignature(timestamp, method, uri string) string {
	message := method + " " + uri + "\n" + timestamp + "\n" + sensConfig.AccessKey
	
	h := hmac.New(sha256.New, []byte(sensConfig.SecretKey))
	h.Write([]byte(message))
	
	return base64.StdEncoding.EncodeToString(h.Sum(nil))
}

// generateVerificationCode generates a 6-digit verification code
func generateVerificationCode() (string, error) {
	max := big.NewInt(999999)
	min := big.NewInt(100000)
	
	n, err := rand.Int(rand.Reader, new(big.Int).Sub(max, min))
	if err != nil {
		return "", err
	}
	
	return fmt.Sprintf("%06d", new(big.Int).Add(n, min).Int64()), nil
}
package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
	"vibing-backend/config"
)

type PortOneService struct {
	APISecret string
	StoreID   string
}

type PaymentRequest struct {
	StoreID       string  `json:"storeId"`
	OrderName     string  `json:"orderName"`
	TotalAmount   int     `json:"totalAmount"`
	Currency      string  `json:"currency"`
	ChannelKey    string  `json:"channelKey"`
	PayMethod     string  `json:"payMethod"`
	Customer      Customer `json:"customer"`
	NoticeURL     string  `json:"noticeUrl"`
	SuccessURL    string  `json:"successUrl"`
	FailURL       string  `json:"failUrl"`
}

type Customer struct {
	ID    string `json:"id"`
	Name  string `json:"name"`
	Email string `json:"email"`
	Phone string `json:"phone"`
}

type PaymentResponse struct {
	Code     int    `json:"code"`
	Message  string `json:"message"`
	Response struct {
		ImpUID       string `json:"imp_uid"`
		MerchantUID  string `json:"merchant_uid"`
		PayMethod    string `json:"pay_method"`
		PaidAmount   int    `json:"paid_amount"`
		Status       string `json:"status"`
		Name         string `json:"name"`
		PgProvider   string `json:"pg_provider"`
		EmbPgProvider string `json:"emb_pg_provider"`
		PgTid        string `json:"pg_tid"`
		BuyerName    string `json:"buyer_name"`
		BuyerEmail   string `json:"buyer_email"`
		BuyerTel     string `json:"buyer_tel"`
		BuyerAddr    string `json:"buyer_addr"`
		BuyerPostcode string `json:"buyer_postcode"`
		CustomData   string `json:"custom_data"`
		UserAgent    string `json:"user_agent"`
		PaidAt       int64  `json:"paid_at"`
		ReceiptURL   string `json:"receipt_url"`
		CardName     string `json:"card_name"`
		BankName     string `json:"bank_name"`
		CardNumber   string `json:"card_number"`
		CardQuota    int    `json:"card_quota"`
		CardType     int    `json:"card_type"`
	} `json:"response"`
}

type PaymentConfirmRequest struct {
	ImpUID      string `json:"imp_uid"`
	MerchantUID string `json:"merchant_uid"`
}

// NewPortOneService creates new PortOne service instance
func NewPortOneService(cfg *config.PortOneConfig) *PortOneService {
	return &PortOneService{
		APISecret: cfg.APISecret,
		StoreID:   cfg.StoreID,
	}
}

// CreatePayment creates a payment request
func (p *PortOneService) CreatePayment(orderID, orderName string, amount int, customer Customer) (*PaymentResponse, error) {
	paymentReq := PaymentRequest{
		StoreID:     p.StoreID,
		OrderName:   orderName,
		TotalAmount: amount,
		Currency:    "KRW",
		PayMethod:   "card",
		Customer:    customer,
		NoticeURL:   "https://api.vibing.com/api/payment/webhook",
		SuccessURL:  "https://vibing.com/payment/success",
		FailURL:     "https://vibing.com/payment/fail",
	}

	jsonData, err := json.Marshal(paymentReq)
	if err != nil {
		return nil, err
	}

	req, err := http.NewRequest("POST", "https://api.iamport.kr/payments/prepare", bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, err
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+p.APISecret)

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var paymentResp PaymentResponse
	err = json.NewDecoder(resp.Body).Decode(&paymentResp)
	if err != nil {
		return nil, err
	}

	if paymentResp.Code != 0 {
		return nil, fmt.Errorf("payment creation failed: %s", paymentResp.Message)
	}

	return &paymentResp, nil
}

// ConfirmPayment confirms a payment
func (p *PortOneService) ConfirmPayment(impUID, merchantUID string) (*PaymentResponse, error) {
	url := fmt.Sprintf("https://api.iamport.kr/payments/%s", impUID)

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, err
	}

	req.Header.Set("Authorization", "Bearer "+p.APISecret)

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var paymentResp PaymentResponse
	err = json.NewDecoder(resp.Body).Decode(&paymentResp)
	if err != nil {
		return nil, err
	}

	if paymentResp.Code != 0 {
		return nil, fmt.Errorf("payment confirmation failed: %s", paymentResp.Message)
	}

	return &paymentResp, nil
}

// CancelPayment cancels a payment
func (p *PortOneService) CancelPayment(impUID, reason string) (*PaymentResponse, error) {
	cancelReq := map[string]interface{}{
		"imp_uid": impUID,
		"reason":  reason,
	}

	jsonData, err := json.Marshal(cancelReq)
	if err != nil {
		return nil, err
	}

	req, err := http.NewRequest("POST", "https://api.iamport.kr/payments/cancel", bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, err
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+p.APISecret)

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var paymentResp PaymentResponse
	err = json.NewDecoder(resp.Body).Decode(&paymentResp)
	if err != nil {
		return nil, err
	}

	if paymentResp.Code != 0 {
		return nil, fmt.Errorf("payment cancellation failed: %s", paymentResp.Message)
	}

	return &paymentResp, nil
}

// GetAccessToken gets access token for API calls
func (p *PortOneService) GetAccessToken() (string, error) {
	// In a real implementation, you would get this from PortOne
	// For now, return the configured API secret
	return p.APISecret, nil
}
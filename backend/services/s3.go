package services

import (
	"bytes"
	"fmt"
	"mime/multipart"
	"path/filepath"
	"strings"
	"time"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/credentials"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/s3"
	"vibing-backend/config"
)

type S3Service struct {
	client *s3.S3
	bucket string
}

// NewS3Service creates new S3 service instance
func NewS3Service(cfg *config.S3Config) (*S3Service, error) {
	// Validate configuration
	if cfg.Region == "" {
		return nil, fmt.Errorf("AWS region is required")
	}
	if cfg.AccessKey == "" {
		return nil, fmt.Errorf("AWS access key is required")
	}
	if cfg.SecretKey == "" {
		return nil, fmt.Errorf("AWS secret key is required")
	}
	if cfg.Bucket == "" {
		return nil, fmt.Errorf("S3 bucket name is required")
	}

	// Log configuration (without secrets) for debugging
	fmt.Printf("S3 Config - Region: %s, Bucket: %s, AccessKey: %s...\n", 
		cfg.Region, cfg.Bucket, cfg.AccessKey[:10])

	sess, err := session.NewSession(&aws.Config{
		Region: aws.String(cfg.Region),
		Credentials: credentials.NewStaticCredentials(
			cfg.AccessKey,
			cfg.SecretKey,
			"",
		),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create AWS session: %v", err)
	}

	return &S3Service{
		client: s3.New(sess),
		bucket: cfg.Bucket,
	}, nil
}

// UploadProductFile uploads a product ZIP file to S3
func (s *S3Service) UploadProductFile(file *multipart.FileHeader, productID string) (string, int64, error) {
	// Validate file extension
	if !isZipFile(file.Filename) {
		return "", 0, fmt.Errorf("only ZIP files are allowed")
	}

	// Validate file size (max 200MB)
	const maxSize = 200 * 1024 * 1024 // 200MB
	if file.Size > maxSize {
		return "", 0, fmt.Errorf("file size exceeds 200MB limit")
	}

	src, err := file.Open()
	if err != nil {
		return "", 0, err
	}
	defer src.Close()

	// Read file content
	buf := new(bytes.Buffer)
	if _, err := buf.ReadFrom(src); err != nil {
		return "", 0, err
	}

	// Generate unique filename
	timestamp := time.Now().Unix()
	filename := fmt.Sprintf("products/%s/%d_%s", productID, timestamp, file.Filename)

	// Upload to S3 (product files are private, require signed URLs for download)
	_, err = s.client.PutObject(&s3.PutObjectInput{
		Bucket:      aws.String(s.bucket),
		Key:         aws.String(filename),
		Body:        bytes.NewReader(buf.Bytes()),
		ContentType: aws.String("application/zip"),
	})

	if err != nil {
		return "", 0, err
	}

	// Return S3 URL and file size
	url := fmt.Sprintf("https://%s.s3.%s.amazonaws.com/%s", s.bucket, *s.client.Config.Region, filename)
	return url, file.Size, nil
}

// UploadImage uploads an image file to S3
func (s *S3Service) UploadImage(file *multipart.FileHeader, folder string) (string, error) {
	// Validate image file
	if !isImageFile(file.Filename) {
		return "", fmt.Errorf("only image files (JPG, PNG, GIF, WebP) are allowed")
	}

	// Validate file size (max 20MB)
	const maxSize = 20 * 1024 * 1024 // 20MB
	if file.Size > maxSize {
		return "", fmt.Errorf("image size exceeds 20MB limit")
	}

	src, err := file.Open()
	if err != nil {
		return "", err
	}
	defer src.Close()

	// Read file content
	buf := new(bytes.Buffer)
	if _, err := buf.ReadFrom(src); err != nil {
		return "", err
	}

	// Generate unique filename
	timestamp := time.Now().Unix()
	ext := filepath.Ext(file.Filename)
	filename := fmt.Sprintf("%s/%d%s", folder, timestamp, ext)

	// Determine content type
	contentType := getImageContentType(ext)

	// Upload to S3 (public access controlled by bucket policy)
	_, err = s.client.PutObject(&s3.PutObjectInput{
		Bucket:      aws.String(s.bucket),
		Key:         aws.String(filename),
		Body:        bytes.NewReader(buf.Bytes()),
		ContentType: aws.String(contentType),
	})

	if err != nil {
		return "", err
	}

	// Return presigned URL (valid for 7 days for images)
	url, err := s.GeneratePresignedURL(filename, 7*24*time.Hour)
	if err != nil {
		return "", fmt.Errorf("failed to generate presigned URL: %v", err)
	}
	return url, nil
}

// GeneratePresignedURL generates a presigned URL for secure download
func (s *S3Service) GeneratePresignedURL(key string, expiry time.Duration) (string, error) {
	req, _ := s.client.GetObjectRequest(&s3.GetObjectInput{
		Bucket: aws.String(s.bucket),
		Key:    aws.String(key),
	})

	url, err := req.Presign(expiry)
	if err != nil {
		return "", err
	}

	return url, nil
}

// DeleteFile deletes a file from S3
func (s *S3Service) DeleteFile(key string) error {
	_, err := s.client.DeleteObject(&s3.DeleteObjectInput{
		Bucket: aws.String(s.bucket),
		Key:    aws.String(key),
	})
	return err
}

// isZipFile checks if file has ZIP extension
func isZipFile(filename string) bool {
	ext := strings.ToLower(filepath.Ext(filename))
	return ext == ".zip"
}

// isImageFile checks if file is a valid image
func isImageFile(filename string) bool {
	ext := strings.ToLower(filepath.Ext(filename))
	allowedExts := []string{".jpg", ".jpeg", ".png", ".gif", ".webp"}
	
	for _, allowed := range allowedExts {
		if ext == allowed {
			return true
		}
	}
	return false
}

// getImageContentType returns content type for image file
func getImageContentType(ext string) string {
	switch strings.ToLower(ext) {
	case ".jpg", ".jpeg":
		return "image/jpeg"
	case ".png":
		return "image/png"
	case ".gif":
		return "image/gif"
	case ".webp":
		return "image/webp"
	default:
		return "application/octet-stream"
	}
}
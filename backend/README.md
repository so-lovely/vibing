# Vibing Backend API

A Go backend API for the Vibing marketplace platform - a marketplace for developer tools, libraries, CLI tools, and software products.

## Tech Stack

- **Backend Framework**: Go + Fiber
- **Database**: PostgreSQL with GORM
- **Cache/Session**: Redis
- **Payment**: PortOne
- **File Storage**: S3 Compatible Storage
- **Authentication**: JWT + Refresh Token
- **Deployment**: Docker + Docker Compose

## Quick Start

### Prerequisites

- Go 1.24+
- PostgreSQL 15+
- Redis 7+
- Docker & Docker Compose (optional)

### Environment Setup

1. Copy the environment file:
```bash
cp .env.example .env
```

2. Update the `.env` file with your configuration values.

### Running with Docker Compose (Recommended)

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop services
docker-compose down
```

### Running Locally

1. Install dependencies:
```bash
go mod download
```

2. Start PostgreSQL and Redis services

3. Run the server:
```bash
go run cmd/server/main.go
```

The API will be available at `http://localhost:8080`

## API Documentation

### Health Check
```
GET /api/health
```

### Authentication Endpoints
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/me` - Get current user info

### Phone Verification
- `POST /api/auth/send-verification-code` - Send SMS verification
- `POST /api/auth/verify-phone` - Verify phone number

#### Testing Phone Verification

For development and testing, the following phone numbers have predefined verification codes:

| Phone Number | Verification Code |
|--------------|-------------------|
| +821012345678 | 123456 |
| +821087654321 | 654321 |
| +821033334444 | 111111 |
| +821055556666 | 999999 |
| +821077778888 | 555555 |
| +821011112222 | 000000 |
| +821099998888 | 123123 |
| +821044445555 | 456456 |

For any other phone number, a random 6-digit code will be generated and displayed in the server console.

**Note**: SENS SMS service requires a business account from NAVER Cloud Platform. Leave SENS credentials empty in `.env` to use development mode with console logging.

### Product Endpoints
- `GET /api/products` - Get products with pagination/filters
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create product (sellers only)
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Payment Endpoints (PortOne)
- `POST /api/payment/create-order` - Create payment order
- `POST /api/payment/confirm` - Confirm payment
- `POST /api/payment/webhook` - Payment webhook
- `GET /api/payment/cancel/:orderId` - Cancel payment

### Purchase Management
- `GET /api/purchase/history` - Get purchase history
- `GET /api/purchase/:id/download` - Get download URL
- `POST /api/purchase/:id/generate-license` - Generate license

### Seller Dashboard
- `GET /api/seller/dashboard` - Seller dashboard data
- `GET /api/seller/products` - Seller's products
- `GET /api/seller/sales` - Sales history
- `GET /api/seller/analytics` - Analytics data

### Chat System
- `GET /api/chat/conversations` - Get conversations
- `POST /api/chat/conversations` - Start conversation
- `GET /api/chat/conversations/:id/messages` - Get messages
- `POST /api/chat/conversations/:id/messages` - Send message
- `PUT /api/chat/conversations/:id/read` - Mark as read

### Admin Endpoints
- `GET /api/admin/stats` - Admin dashboard stats
- `GET /api/admin/users` - Manage users
- `PUT /api/admin/users/:id/role` - Update user role
- `GET /api/admin/products` - Review products
- `PUT /api/admin/products/:id/status` - Update product status

### File Upload
- `POST /api/upload/image` - Upload product image
- `POST /api/upload/product-files` - Upload product files
- `GET /api/upload/signed-url` - Get S3 signed URL

## Development

### Project Structure
```
backend/
├── cmd/server/          # Application entry point
├── config/              # Configuration management
├── database/            # Database connection and migrations
├── handlers/            # HTTP request handlers
├── middleware/          # HTTP middleware
├── models/              # Database models
├── routes/              # Route definitions
├── services/            # Business logic services
├── utils/               # Utility functions
├── docker-compose.yml   # Docker compose configuration
├── Dockerfile           # Docker image definition
└── README.md           # This file
```

### Building

```bash
# Build the application
go build -o vibing-backend cmd/server/main.go

# Run tests
go test ./...

# Format code
go fmt ./...

# Lint code
golangci-lint run
```

### Database Migrations

Migrations are automatically run on application startup using GORM AutoMigrate.

### Environment Variables

See `.env.example` for all available configuration options.

## Deployment

### Docker

```bash
# Build image
docker build -t vibing-backend .

# Run container
docker run -p 8080:8080 vibing-backend
```

### Production Considerations

1. **Security**: Change default JWT secrets and API keys
2. **Database**: Use managed PostgreSQL service
3. **Redis**: Use managed Redis service
4. **File Storage**: Configure S3 or compatible service
5. **Monitoring**: Add logging and monitoring solutions
6. **SSL**: Enable HTTPS in production

## API Response Format

### Success Response
```json
{
  "data": {},
  "message": "Success"
}
```

### Error Response
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description",
    "details": []
  }
}
```

### Common Error Codes
- `VALIDATION_ERROR` - Input validation failed
- `UNAUTHORIZED` - Authentication required
- `FORBIDDEN` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `CONFLICT` - Resource already exists
- `PAYMENT_FAILED` - Payment processing failed
- `INTERNAL_ERROR` - Internal server error

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes and add tests
4. Run tests and linting
5. Submit a pull request

## License

This project is licensed under the MIT License.
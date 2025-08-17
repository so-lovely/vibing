package config

import (
	"github.com/spf13/viper"
)

type Config struct {
	Database  DatabaseConfig  `mapstructure:"database"`
	Redis     RedisConfig     `mapstructure:"redis"`
	JWT       JWTConfig       `mapstructure:"jwt"`
	S3        S3Config        `mapstructure:"s3"`
	PortOne   PortOneConfig   `mapstructure:"portone"`
	SENS      SENSConfig      `mapstructure:"sens"`
	ReCAPTCHA ReCAPTCHAConfig `mapstructure:"recaptcha"`
	SMTP      SMTPConfig      `mapstructure:"smtp"`
	Server    ServerConfig    `mapstructure:"server"`
}

type DatabaseConfig struct {
	Host     string `mapstructure:"host"`
	Port     string `mapstructure:"port"`
	Name     string `mapstructure:"name"`
	User     string `mapstructure:"user"`
	Password string `mapstructure:"password"`
}

type RedisConfig struct {
	URL string `mapstructure:"url"`
}

type JWTConfig struct {
	Secret           string `mapstructure:"secret"`
	Expiry           string `mapstructure:"expiry"`
	RefreshTokenExpiry string `mapstructure:"refresh_token_expiry"`
}

type S3Config struct {
	Region    string `mapstructure:"region"`
	AccessKey string `mapstructure:"access_key"`
	SecretKey string `mapstructure:"secret_key"`
	Bucket    string `mapstructure:"bucket"`
}

type PortOneConfig struct {
	APISecret     string `mapstructure:"api_secret"`
	StoreID       string `mapstructure:"store_id"`
	WebhookSecret string `mapstructure:"webhook_secret"`
}

type SENSConfig struct {
	AccessKey     string `mapstructure:"access_key"`
	SecretKey     string `mapstructure:"secret_key"`
	ServiceID     string `mapstructure:"service_id"`
	CallingNumber string `mapstructure:"calling_number"`
}

type ReCAPTCHAConfig struct {
	SecretKey string `mapstructure:"secret_key"`
	SiteKey   string `mapstructure:"site_key"`
}

type SMTPConfig struct {
	Host     string `mapstructure:"host"`
	Port     string `mapstructure:"port"`
	User     string `mapstructure:"user"`
	Password string `mapstructure:"password"`
}

type ServerConfig struct {
	Port string `mapstructure:"port"`
	Host string `mapstructure:"host"`
}

// Load loads configuration from environment variables
func Load() (*Config, error) {
	viper.SetConfigName(".env")
	viper.SetConfigType("env")
	viper.AddConfigPath(".")
	viper.AutomaticEnv()

	// Map environment variables to config structure
	viper.BindEnv("database.host", "DB_HOST")
	viper.BindEnv("database.port", "DB_PORT") 
	viper.BindEnv("database.name", "DB_NAME")
	viper.BindEnv("database.user", "DB_USER")
	viper.BindEnv("database.password", "DB_PASSWORD")
	
	viper.BindEnv("redis.url", "REDIS_URL")
	
	viper.BindEnv("jwt.secret", "JWT_SECRET")
	viper.BindEnv("jwt.expiry", "JWT_EXPIRY")
	viper.BindEnv("jwt.refresh_token_expiry", "REFRESH_TOKEN_EXPIRY")
	
	viper.BindEnv("s3.region", "AWS_REGION")
	viper.BindEnv("s3.access_key", "AWS_ACCESS_KEY_ID")
	viper.BindEnv("s3.secret_key", "AWS_SECRET_ACCESS_KEY")
	viper.BindEnv("s3.bucket", "S3_BUCKET")
	
	viper.BindEnv("portone.api_secret", "PORTONE_API_SECRET")
	viper.BindEnv("portone.store_id", "PORTONE_STORE_ID")
	viper.BindEnv("portone.webhook_secret", "PORTONE_WEBHOOK_SECRET")
	
	viper.BindEnv("sens.access_key", "SENS_ACCESS_KEY")
	viper.BindEnv("sens.secret_key", "SENS_SECRET_KEY")
	viper.BindEnv("sens.service_id", "SENS_SERVICE_ID")
	viper.BindEnv("sens.calling_number", "SENS_CALLING_NUMBER")
	
	viper.BindEnv("recaptcha.secret_key", "RECAPTCHA_SECRET_KEY")
	viper.BindEnv("recaptcha.site_key", "RECAPTCHA_SITE_KEY")
	
	viper.BindEnv("smtp.host", "SMTP_HOST")
	viper.BindEnv("smtp.port", "SMTP_PORT")
	viper.BindEnv("smtp.user", "SMTP_USER")
	viper.BindEnv("smtp.password", "SMTP_PASSWORD")
	
	viper.BindEnv("server.port", "PORT")
	viper.BindEnv("server.host", "HOST")

	// Set defaults
	viper.SetDefault("server.port", "8080")
	viper.SetDefault("server.host", "0.0.0.0")
	viper.SetDefault("database.port", "5432")
	viper.SetDefault("database.host", "localhost")
	viper.SetDefault("jwt.expiry", "24h")
	viper.SetDefault("jwt.refresh_token_expiry", "7d")

	if err := viper.ReadInConfig(); err != nil {
		// Config file not found; ignore error if desired
	}

	var config Config
	err := viper.Unmarshal(&config)
	return &config, err
}
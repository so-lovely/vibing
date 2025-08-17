package utils

import (
	"github.com/go-playground/validator/v10"
)

var validate = validator.New()

// ValidateStruct validates a struct using validation tags
func ValidateStruct(s interface{}) []map[string]string {
	var errors []map[string]string
	
	err := validate.Struct(s)
	if err != nil {
		for _, err := range err.(validator.ValidationErrors) {
			errors = append(errors, map[string]string{
				"field":   err.Field(),
				"message": getErrorMessage(err),
			})
		}
	}
	
	return errors
}

func getErrorMessage(err validator.FieldError) string {
	switch err.Tag() {
	case "required":
		return err.Field() + " is required"
	case "email":
		return "Invalid email format"
	case "min":
		return err.Field() + " must be at least " + err.Param() + " characters"
	case "max":
		return err.Field() + " must be at most " + err.Param() + " characters"
	case "oneof":
		return err.Field() + " must be one of: " + err.Param()
	case "e164":
		return "Invalid phone number format"
	case "url":
		return "Invalid URL format"
	case "gte":
		return err.Field() + " must be greater than or equal to " + err.Param()
	case "gt":
		return err.Field() + " must be greater than " + err.Param()
	default:
		return err.Field() + " is invalid"
	}
}
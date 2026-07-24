package handlers

import (
	"context"
	"fmt"
	"net/http"
	"strings"

	"github.com/golang-jwt/jwt/v5"
)

type contextKey string

const userClaimsKey contextKey = "userClaims"

type CustomClaims struct {
	UserID int `json:"user_id"`

	jwt.RegisteredClaims
}

func (e *Env) AuthMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		secret := e.Secret
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			WriteJSONError(w, http.StatusUnauthorized, "Missing authorization header:", nil)
			return
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			WriteJSONError(w, http.StatusUnauthorized, "Wrong authorization format!", nil)
			return
		}

		tokenString := parts[1]
		claims := &CustomClaims{}

		token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {

			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
			}
			return secret, nil
		})
		if err != nil || !token.Valid {
			WriteJSONError(w, http.StatusUnauthorized, "Invalid or expired token:", err)
			return
		}

		ctx := context.WithValue(r.Context(), userClaimsKey, claims)

		next.ServeHTTP(w, r.WithContext(ctx))
	}
}

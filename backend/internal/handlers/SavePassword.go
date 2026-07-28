package handlers

import (
	"AlpineBackend/internal/db"
	"encoding/json"
	"io"
	"net/http"
	"strings"
)

type SavePasswordRequest struct {
	ServiceName       string `json:"service_name"`
	Login             string `json:"login"`
	EncryptedPassword []byte `json:"encrypted_password"`
	Nonce             []byte `json:"nonce"`
}

func (e *Env) SavePassword(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	if r.Header.Get("Content-Type") != "application/json" {
		WriteJSONError(w, http.StatusUnsupportedMediaType, "Content-Type must be application/json", nil)
		return
	}

	r.Body = http.MaxBytesReader(w, r.Body, 1<<20)

	var SavePassReq SavePasswordRequest
	httpRequestBody, err := io.ReadAll(r.Body)
	if err != nil {
		WriteJSONError(w, http.StatusBadRequest, "Failed to read req. body", err)
		return
	}

	err = json.Unmarshal(httpRequestBody, &SavePassReq)
	if err != nil {
		WriteJSONError(w, http.StatusBadRequest, "Failed to convert req. body", err)
		return
	}

	SavePassReq.ServiceName = strings.TrimSpace(SavePassReq.ServiceName)
	SavePassReq.Login = strings.TrimSpace(SavePassReq.Login)
	if SavePassReq.ServiceName == "" {
		WriteJSONError(w, http.StatusBadRequest, "Service name is required", nil)
		return
	}
	if SavePassReq.Login == "" {
		WriteJSONError(w, http.StatusBadRequest, "Login is required", nil)
		return
	}
	if len(SavePassReq.EncryptedPassword) == 0 {
		WriteJSONError(w, http.StatusBadRequest, "Encrypted password is required", nil)
		return
	}
	if len(SavePassReq.Nonce) == 0 {
		WriteJSONError(w, http.StatusBadRequest, "Nonce is required", nil)
		return
	}

	claims, ok := r.Context().Value(userClaimsKey).(*CustomClaims)
	if !ok {
		WriteJSONError(w, http.StatusUnauthorized, "No claims found", nil)
		return
	}
	userID := claims.UserID

	err = db.SavePassword(ctx,
		e.Conn,
		userID,
		SavePassReq.ServiceName,
		SavePassReq.Login,
		SavePassReq.EncryptedPassword,
		SavePassReq.Nonce)

	if err != nil {
		WriteJSONError(w, http.StatusInternalServerError, "Failed to save password", err)
		return
	}

	w.WriteHeader(http.StatusOK)
}

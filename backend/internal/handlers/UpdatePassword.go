package handlers

import (
	"AlpineBackend/internal/db"
	"encoding/json"
	"io"
	"net/http"
)

type UpdatePasswordRequest struct {
	ID                int    `json:"id"`
	ServiceName       string `json:"service_name"`
	Login             string `json:"login"`
	EncryptedPassword []byte `json:"encrypted_password"`
	Nonce             []byte `json:"nonce"`
}

func (e *Env) UpdatePassword(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	if r.Header.Get("Content-Type") != "application/json" {
		WriteJSONError(w, http.StatusUnsupportedMediaType, "Content-Type must be application/json", nil)
		return
	}

	r.Body = http.MaxBytesReader(w, r.Body, 1<<20)

	var UpdateRequest UpdatePasswordRequest

	httpRequestBody, err := io.ReadAll(r.Body)
	if err != nil {
		WriteJSONError(w, http.StatusBadRequest, "Failed to read req. body", err)
		return
	}

	err = json.Unmarshal(httpRequestBody, &UpdateRequest)
	if err != nil {
		WriteJSONError(w, http.StatusBadRequest, "Failed to convert req. body", err)
		return
	}

	if UpdateRequest.ID <= 0 {
		WriteJSONError(w, http.StatusBadRequest, "Invalid password ID", nil)
		return
	}

	claims, ok := r.Context().Value(userClaimsKey).(*CustomClaims)
	if !ok {
		WriteJSONError(w, http.StatusUnauthorized, "No claims found", nil)
		return
	}

	UserID := claims.UserID

	err = db.UpdatePassword(ctx,
		e.Conn,
		UpdateRequest.ID,
		UserID,
		UpdateRequest.ServiceName,
		UpdateRequest.Login,
		UpdateRequest.EncryptedPassword,
		UpdateRequest.Nonce)
	if err != nil {
		WriteJSONError(w, http.StatusInternalServerError, "Failed to update password!", err)
		return
	}

	w.WriteHeader(http.StatusOK)
}

package handlers

import (
	"AlpineBackend/internal/additional"
	"AlpineBackend/internal/crypto"
	"AlpineBackend/internal/db"
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"strings"
)

type LoginRequest struct {
	Username string `json:"username"`
	AuthKey  []byte `json:"auth_key"`
}

type LoginResponse struct {
	JWT string `json:"token"`
}

func (e *Env) Login(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	if r.Header.Get("Content-Type") != "application/json" {
		WriteJSONError(w, http.StatusUnsupportedMediaType, "Content-Type must be application/json", nil)
		return
	}

	r.Body = http.MaxBytesReader(w, r.Body, 1<<20)

	var LogReq LoginRequest
	httpRequestBody, err := io.ReadAll(r.Body)
	if err != nil {
		WriteJSONError(w, http.StatusBadRequest, "Failed to read req. body!", err)
		return
	}

	err = json.Unmarshal(httpRequestBody, &LogReq)
	if err != nil {
		WriteJSONError(w, http.StatusBadRequest, "Failed to convert req. body!", err)
		return
	}

	LogReq.Username = strings.TrimSpace(LogReq.Username)
	if LogReq.Username == "" {
		WriteJSONError(w, http.StatusBadRequest, "Username is required", nil)
		return
	}
	if len(LogReq.AuthKey) == 0 {
		WriteJSONError(w, http.StatusBadRequest, "Auth key is required", nil)
		return
	}

	_, verifierDB, err := db.GetInfoByUsername(ctx, e.Conn, LogReq.Username)
	if err != nil {
		WriteJSONError(w, http.StatusInternalServerError, "Error while get user info", err)
		return
	}

	computedVerifier := crypto.CreateVerifier(LogReq.AuthKey)

	if !bytes.Equal(verifierDB, computedVerifier) {
		WriteJSONError(w, http.StatusForbidden, "Wrong password!", nil)
		return
	}

	userID, err := db.GetIDByUsername(ctx, e.Conn, LogReq.Username)
	if err != nil {
		WriteJSONError(w, http.StatusInternalServerError, "Failed to get user id:", err)
		return
	}

	token, err := additional.GenJWTToken(userID, e.Secret)
	if err != nil {
		WriteJSONError(w, http.StatusInternalServerError, "Failed to gen JWT:", err)
		return
	}

	tokenByte, err := json.Marshal(LoginResponse{JWT: token})
	if err != nil {
		WriteJSONError(w, http.StatusInsufficientStorage, "Failed to convert JWT:", err)
		return
	}

	w.Header().Add("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write(tokenByte)

}

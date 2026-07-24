package handlers

import (
	"AlpineBackend/internal/additional"
	"AlpineBackend/internal/crypto"
	"AlpineBackend/internal/db"
	"bytes"
	"encoding/json"
	"io"
	"net/http"
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

	_, verifierDB, err := db.GetInfoByUsername(ctx, e.Conn, LogReq.Username)
	if err != nil {
		WriteJSONError(w, http.StatusInternalServerError, "Error while get user info", err)
		return
	}

	computedVerifier := crypto.CreateVerifier(LogReq.AuthKey)

	if !bytes.Equal(verifierDB, computedVerifier) {
		WriteJSONError(w, http.StatusForbidden, "Wrong password!", err)
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

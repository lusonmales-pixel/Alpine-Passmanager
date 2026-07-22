package handlers

import (
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

func (e *Env) Login(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	var LogReq LoginRequest
	httpRequestBody, err := io.ReadAll(r.Body)
	if err != nil {
		WriteJSONError(w, http.StatusBadRequest, "Failed to read req. body!", err)
	}

	err = json.Unmarshal(httpRequestBody, &LogReq)
	if err != nil {
		WriteJSONError(w, http.StatusBadRequest, "Failed to convert req. body!", err)
		return
	}

	_, verifierDB, err := db.GetInfoByUsername(ctx, e.conn, LogReq.Username)
	if err != nil {
		WriteJSONError(w, http.StatusInternalServerError, "Error while get user info", err)
	}

	computedVerifier := crypto.CreateVerifier(LogReq.AuthKey)

	if !bytes.Equal(verifierDB, computedVerifier) {
		WriteJSONError(w, http.StatusForbidden, "Wrong password!", err)
	}

	w.WriteHeader(http.StatusOK)

}

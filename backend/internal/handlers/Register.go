package handlers

import (
	"AlpineBackend/internal/db"
	"encoding/json"
	"io"
	"log/slog"
	"net/http"
	"strings"
)

type RegisterRequest struct {
	Username   string `json:"username"`
	MasterSalt []byte `json:"master_salt"`
	Verifier   []byte `json:"verifier"`
}

func WriteJSONError(w http.ResponseWriter, status int, message string, err error) {
	if err != nil {
		slog.Error(message, "err", err)
	}
	w.WriteHeader(status)
	resultErr, marshalErr := json.Marshal(message)
	if marshalErr != nil {
		slog.Error("Failed to marshal error response")
	}
	_, writeErr := w.Write(resultErr)
	if writeErr != nil {
		slog.Error("Failed to send error response")
	}
}

func (e *Env) RegisterUser(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	if r.Header.Get("Content-Type") != "application/json" {
		WriteJSONError(w, http.StatusUnsupportedMediaType, "Content-Type must be application/json", nil)
		return
	}

	r.Body = http.MaxBytesReader(w, r.Body, 1<<20)

	var RegReq RegisterRequest
	httpRequestBody, err := io.ReadAll(r.Body)
	if err != nil {
		WriteJSONError(w, http.StatusBadRequest, "Failed to read request body", err)
		return
	}

	err = json.Unmarshal(httpRequestBody, &RegReq)
	if err != nil {
		WriteJSONError(w, http.StatusBadRequest, "Failed to convert request body", err)
		return
	}

	RegReq.Username = strings.TrimSpace(RegReq.Username)
	if RegReq.Username == "" || len(RegReq.Username) > 200 {
		WriteJSONError(w, http.StatusBadRequest, "Username must be 1-200 characters", nil)
		return
	}
	if len(RegReq.MasterSalt) == 0 {
		WriteJSONError(w, http.StatusBadRequest, "Master salt is required", nil)
		return
	}
	if len(RegReq.Verifier) == 0 {
		WriteJSONError(w, http.StatusBadRequest, "Verifier is required", nil)
		return
	}

	err = db.CreateUser(ctx, e.Conn, RegReq.Username, RegReq.MasterSalt, RegReq.Verifier)
	if err != nil {
		WriteJSONError(w, http.StatusInternalServerError, "Failed to create user", err)
		return
	}

	w.WriteHeader(http.StatusOK)

}

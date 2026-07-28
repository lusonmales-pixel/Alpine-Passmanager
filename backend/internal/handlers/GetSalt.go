package handlers

import (
	"AlpineBackend/internal/db"
	"encoding/json"
	"io"
	"net/http"
)

type GetSaltReq struct {
	Username string `json:"username"`
}

type SaltResponse struct {
	Salt []byte `json:"salt"`
}

func (e *Env) GetSalt(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	if r.Header.Get("Content-Type") != "application/json" {
		WriteJSONError(w, http.StatusUnsupportedMediaType, "Content-Type must be application/json", nil)
		return
	}

	r.Body = http.MaxBytesReader(w, r.Body, 1<<20)

	var SaltReq GetSaltReq
	httpRequestBody, err := io.ReadAll(r.Body)
	if err != nil {
		WriteJSONError(w, http.StatusBadRequest, "Failed to read request body", err)
		return
	}

	err = json.Unmarshal(httpRequestBody, &SaltReq)
	if err != nil {
		WriteJSONError(w, http.StatusBadRequest, "Failed to convert request body", err)
		return
	}

	if SaltReq.Username == "" {
		WriteJSONError(w, http.StatusBadRequest, "Username is required", nil)
		return
	}

	salt, _, err := db.GetInfoByUsername(ctx, e.Conn, SaltReq.Username)
	if err != nil {
		WriteJSONError(w, http.StatusInternalServerError, "Failed to get salt", err)
		return
	}

	saltByte, err := json.Marshal(SaltResponse{Salt: salt})
	if err != nil {
		WriteJSONError(w, http.StatusInternalServerError, "Failed to marshal salt", err)
		return
	}

	w.Header().Add("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write(saltByte)
}

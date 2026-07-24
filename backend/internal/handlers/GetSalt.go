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
	var SaltReq GetSaltReq
	httpRequstBody, err := io.ReadAll(r.Body)
	if err != nil {
		WriteJSONError(w, http.StatusBadRequest, "Failed to read requst body:", err)
		return
	}

	err = json.Unmarshal(httpRequstBody, &SaltReq)
	if err != nil {
		WriteJSONError(w, http.StatusBadRequest, "Failed to convert requset body:", err)
		return
	}

	salt, _, err := db.GetInfoByUsername(ctx, e.Conn, SaltReq.Username)
	if err != nil {
		WriteJSONError(w, http.StatusInternalServerError, "Failed to get salt:", err)
		return
	}

	saltByte, err := json.Marshal(SaltResponse{Salt: salt})
	if err != nil {
		WriteJSONError(w, http.StatusInternalServerError, "Failed to send salt:", err)
		return
	}

	w.Header().Add("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write(saltByte)
}

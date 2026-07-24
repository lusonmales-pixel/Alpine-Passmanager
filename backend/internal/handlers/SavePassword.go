package handlers

import (
	"AlpineBackend/internal/db"
	"encoding/json"
	"io"
	"net/http"
)

type SavePasswordRequest struct {
	Username          string `json:"username"`
	ServiceName       string `json:"service_name"`
	Login             string `json:"login"`
	EncryptedPassword []byte `json:"encrypted_password"`
	Nonce             []byte `json:"nonce"`
}

func (e *Env) SavePassword(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	var SavePassReq SavePasswordRequest
	httpRequsetBody, err := io.ReadAll(r.Body)
	if err != nil {
		WriteJSONError(w, http.StatusBadRequest, "Failed to read req. body:", err)
	}

	err = json.Unmarshal(httpRequsetBody, &SavePassReq)
	if err != nil {
		WriteJSONError(w, http.StatusBadRequest, "Failed to convert req. body:", err)
	}

	userID, err := db.GetIDByUsername(ctx, e.Conn, SavePassReq.Username)
	if err != nil {
		WriteJSONError(w, http.StatusInternalServerError, "Failed to get user id!", err)
	}

	err = db.SavePassword(ctx,
		e.Conn,
		userID,
		SavePassReq.ServiceName,
		SavePassReq.Login,
		SavePassReq.EncryptedPassword,
		SavePassReq.Nonce)

	if err != nil {
		WriteJSONError(w, http.StatusInternalServerError, "Failed to save password!", err)
	}

	w.WriteHeader(http.StatusOK)
}

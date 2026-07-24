package handlers

import (
	"AlpineBackend/internal/db"
	"encoding/json"
	"io"
	"log"
	"net/http"
)

type RegisterRequest struct {
	Username string `json:"username"`
	// MasterPassword string `json:"master_password"`
	MasterSalt []byte `json:"master_salt"`
	Verifier   []byte `json:"verifier"`
}

func WriteJSONError(w http.ResponseWriter, status int, message string, err error) {
	w.WriteHeader(status)
	resultErr, err := json.Marshal(message)
	if err != nil {
		log.Println("Failed to marshal error response!")
	}
	_, err = w.Write(resultErr)
	if err != nil {
		log.Println("Failed to send error response!")
	}
	log.Println(message, err)
}

func (e *Env) RegisterUser(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	var RegReq RegisterRequest
	httpRequestBody, err := io.ReadAll(r.Body)
	if err != nil {
		WriteJSONError(w, http.StatusBadRequest, "Failed to read request boy!", err)
		return
	}

	err = json.Unmarshal(httpRequestBody, &RegReq)
	if err != nil {
		WriteJSONError(w, http.StatusBadRequest, "Failed to convert request body!", err)
		return
	}

	err = db.CreateUser(ctx, e.Conn, RegReq.Username, RegReq.MasterSalt, RegReq.Verifier)
	if err != nil {
		WriteJSONError(w, http.StatusInternalServerError, "Failed to create user!", err)
		return
	}

	w.WriteHeader(http.StatusOK)

}

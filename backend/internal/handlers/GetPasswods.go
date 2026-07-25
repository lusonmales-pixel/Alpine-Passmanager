package handlers

import (
	"AlpineBackend/internal/db"
	"encoding/json"
	"net/http"
)

type GetPasswordsResponse struct {
	Passwords []db.PasswordBlock `json:"passwords"`
}

func (e *Env) GetPasswords(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	claims, ok := r.Context().Value(userClaimsKey).(*CustomClaims)
	if !ok {
		WriteJSONError(w, http.StatusUnauthorized, "No cliams found!", nil)
		return
	}
	userID := claims.UserID

	PasswordSlice, err := db.GetPasswords(ctx, e.Conn, userID)
	if err != nil {
		WriteJSONError(w, http.StatusInternalServerError, "Failed to get passwords:", err)
		return
	}

	PasswordsByte, err := json.Marshal(GetPasswordsResponse{Passwords: PasswordSlice})
	if err != nil {
		WriteJSONError(w, http.StatusInternalServerError, "Failed to convert data", err)
		return
	}

	w.Header().Add("Content-type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write(PasswordsByte)

}

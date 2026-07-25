package handlers

import (
	"AlpineBackend/internal/db"
	"encoding/json"
	"io"
	"net/http"
)

type DeletePasswordRequest struct {
	ID int `json:"id"`
}

func (e *Env) DeletePassword(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	var DeleteRequest DeletePasswordRequest

	httpRequestBody, err := io.ReadAll(r.Body)
	if err != nil {
		WriteJSONError(w, http.StatusBadRequest, "Failed to read req. body:", err)
		return
	}

	err = json.Unmarshal(httpRequestBody, &DeleteRequest)
	if err != nil {
		WriteJSONError(w, http.StatusBadRequest, "Failed to convert body:", err)
		return
	}

	claims, ok := ctx.Value(userClaimsKey).(*CustomClaims)
	if !ok {
		WriteJSONError(w, http.StatusUnauthorized, "No claims found!", nil)
		return
	}

	userID := claims.UserID

	err = db.DeletePassword(ctx, e.Conn, userID, DeleteRequest.ID)
	if err != nil {
		WriteJSONError(w, http.StatusInternalServerError, "Failed to delete password:", err)
		return
	}

	w.WriteHeader(http.StatusOK)
}

package db

import (
	"context"

	"github.com/jackc/pgx/v5"
)

func UpdatePassword(ctx context.Context,
	conn *pgx.Conn,
	id, userID int,
	serviceName, login string,
	encPassword, nonce []byte) error {
	sqlQuery := `
		UPDATE passwords SET 
		service_name = $1, 
		login = $2, 
		encrypted_password = $3, 
		nonce = $4, 
		updated_at = CURRENT_TIMESTAMP 
		WHERE id = $5 AND user_id = $6
		`

	_, err := conn.Exec(ctx, sqlQuery, serviceName, login, encPassword, nonce, id, userID)
	if err != nil {
		return err
	}

	return nil

}

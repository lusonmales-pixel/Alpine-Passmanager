package db

import (
	"context"

	"github.com/jackc/pgx/v5"
)

func SavePassword(
	ctx context.Context,
	conn *pgx.Conn,
	user_id int,
	service_name, login string,
	encrypted_password, nonce []byte) error {

	sqlQuery := `
	INSERT INTO passwords (user_id, service_name, login, encrypted_password, nonce)
	VALUES ($1, $2, $3, $4, $5)
	`

	_, err := conn.Exec(ctx, sqlQuery, user_id, service_name, login, encrypted_password, nonce)
	if err != nil {
		return err
	}

	return nil
}

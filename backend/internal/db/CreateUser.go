package db

import (
	"context"

	"github.com/jackc/pgx/v5"
)

func CreateUser(ctx context.Context, conn *pgx.Conn, username string, master_salt []byte, verifier []byte) error {
	sqlQuery := `
	INSERT INTO user (username, master_salt, verifier)
	VALUES ($1, $2, $3)
	`

	_, err := conn.Exec(ctx, sqlQuery, username, master_salt, verifier)
	if err != nil {
		return err
	}

	return nil
}

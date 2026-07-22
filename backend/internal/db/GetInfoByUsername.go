package db

import (
	"context"

	"github.com/jackc/pgx/v5"
)

func GetInfoByUsername(ctx context.Context, conn *pgx.Conn, username string) (salt []byte, verifier []byte, err error) {
	sqlQuery := `SELECT master_salt, verifier FROM users WHERE username = $1`

	err = conn.QueryRow(ctx, sqlQuery, username).Scan(&salt, &verifier)
	if err != nil {
		return nil, nil, err
	}

	return salt, verifier, nil
}

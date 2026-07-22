package db

import (
	"context"

	"github.com/jackc/pgx/v5"
)

func GetIDByUsername(ctx context.Context, conn *pgx.Conn, username string) (id int, err error) {
	sqlQueru := `
	SELECT id FROM users WHERE username = $1
	`

	err = conn.QueryRow(ctx, sqlQueru, username).Scan(&id)
	if err != nil {
		return 0, err
	}

	return id, nil
}

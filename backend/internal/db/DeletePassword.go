package db

import (
	"context"

	"github.com/jackc/pgx/v5"
)

func DeletePassword(ctx context.Context, conn *pgx.Conn, userID, id int) error {
	sqlQuery := `
	DELETE FROM passwords WHERE id = $1 AND user_id = $2
	`

	_, err := conn.Exec(ctx, sqlQuery, id, userID)
	if err != nil {
		return err
	}

	return nil
}

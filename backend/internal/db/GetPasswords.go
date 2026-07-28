package db

import (
	"context"

	"github.com/jackc/pgx/v5"
)

type PasswordBlock struct {
	ID          int
	ServiceName string
	Login       string
	EncPassword []byte
	Nonce       []byte
}

func GetPasswords(ctx context.Context, conn *pgx.Conn, userID int) ([]PasswordBlock, error) {
	var PasswordBlocks []PasswordBlock
	sqlQuery := `
	SELECT id, service_name, login, encrypted_password, nonce FROM passwords WHERE user_id = $1
	`

	rows, err := conn.Query(ctx, sqlQuery, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var PassBlock PasswordBlock
		err = rows.Scan(&PassBlock.ID, &PassBlock.ServiceName, &PassBlock.Login, &PassBlock.EncPassword, &PassBlock.Nonce)
		if err != nil {
			return nil, err
		}
		PasswordBlocks = append(PasswordBlocks, PassBlock)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	return PasswordBlocks, nil

}

package db

import (
	"context"
	"log/slog"

	"github.com/jackc/pgx/v5"
)

func InitTable(ctx context.Context, conn *pgx.Conn) error {
	sqlQuery := `
	CREATE TABLE IF NOT EXISTS users (
	id SERIAL PRIMARY KEY,
	username VARCHAR(200) UNIQUE NOT NULL,
	master_salt BYTEA NOT NULL,
	verifier BYTEA NOT NULL,
	created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
	);

	CREATE TABLE IF NOT EXISTS passwords (
	id SERIAL PRIMARY KEY,
	user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	service_name VARCHAR(255) NOT NULL,
	login VARCHAR(255) NOT NULL, 
	encrypted_password BYTEA NOT NULL,
	nonce BYTEA NOT NULL,
	created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
	);

	CREATE INDEX IF NOT EXISTS idx_passwords_user_id ON passwords(user_id);
	`

	_, err := conn.Exec(ctx, sqlQuery)
	if err != nil {
		return err
	}

	slog.Info("Tables initialized successfully")

	return nil

}

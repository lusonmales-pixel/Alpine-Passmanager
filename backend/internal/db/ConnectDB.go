package db

import (
	"context"
	"log/slog"
	"os"

	"github.com/jackc/pgx/v5"
)

func ConnectDB(ctx context.Context) (*pgx.Conn, error) {
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		dbURL = "postgres://postgres:12345@localhost:5432/alpine"
		slog.Warn("DATABASE_URL not set, using default (insecure for production)")
	}

	conn, err := pgx.Connect(ctx, dbURL)
	if err != nil {
		return nil, err
	}

	slog.Info("DB connected successfully")

	return conn, nil

}

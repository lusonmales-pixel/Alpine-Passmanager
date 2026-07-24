package db

import (
	"context"
	"log"

	"github.com/jackc/pgx/v5"
)

func ConnectDB(ctx context.Context) (*pgx.Conn, error) {
	conn, err := pgx.Connect(ctx, "postgres://postgres:12345@localhost:5432/alpine") // ЭТО ТОЖЕ НЕ ПЫТАЙТЕСЬ СПИЗДИТЬ, НА РЕЛИЗЕ ПОМЕНЯЮ!!!
	if err != nil {
		return nil, err
	}

	log.Println("DB connected successfully!")

	return conn, nil

}

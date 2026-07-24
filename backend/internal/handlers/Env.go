package handlers

import "github.com/jackc/pgx/v5"

type Env struct {
	Conn   *pgx.Conn
	Secret []byte
}

package main

import (
	"AlpineBackend/internal/db"
	"context"
	"log"
	"net/http"
)

func main() {
	ctx := context.Background()

	conn, err := db.ConnectDB(ctx)
	if err != nil {
		log.Fatalln("Error while connecting DB", err)
	}

	defer conn.Close(ctx)

	err = db.InitTable(ctx, conn)
	if err != nil {
		log.Fatalln("Error while init table:", err)
	}

	err = http.ListenAndServe(":8080", nil)
	if err != nil {
		log.Fatalln("Failed to start server!")
	}

}

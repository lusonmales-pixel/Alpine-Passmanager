package main

import (
	"AlpineBackend/internal/db"
	"AlpineBackend/internal/handlers"
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

	env := &handlers.Env{Conn: conn, Secret: []byte("Alpine_manAger-Sexcret")} //НЕ ПЫТАЙТЕСЬ СПИЗДИТЬ, Я ВСЕ РАВНО ПОМЕНЯЮ НА РЕЛИЗЕ!!!

	http.HandleFunc("/register", env.RegisterUser)
	http.HandleFunc("/login", env.Login)
	http.Handle("/savePassword", env.AuthMiddleware(env.SavePassword))
	http.HandleFunc("/getSalt", env.GetSalt)
	http.Handle("/getPasswords", env.AuthMiddleware(env.GetPasswords))
	http.Handle("/updatePassword", env.AuthMiddleware(env.UpdatePassword))
	http.Handle("/deletePassword", env.AuthMiddleware(env.DeletePassword))

	err = http.ListenAndServe(":8080", nil)
	if err != nil {
		log.Fatalln("Failed to start server!")
	}

}

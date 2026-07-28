package main

import (
	"AlpineBackend/internal/db"
	"AlpineBackend/internal/handlers"
	"bufio"
	"context"
	"log/slog"
	"net/http"
	"os"
	"strings"
)

func loadEnv(path string) {
	f, err := os.Open(path)
	if err != nil {
		return
	}
	defer f.Close()

	s := bufio.NewScanner(f)
	for s.Scan() {
		line := strings.TrimSpace(s.Text())
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		parts := strings.SplitN(line, "=", 2)
		if len(parts) != 2 {
			continue
		}
		key := strings.TrimSpace(parts[0])
		val := strings.TrimSpace(parts[1])
		if os.Getenv(key) == "" {
			os.Setenv(key, val)
		}
	}
}

func main() {
	loadEnv(".env")

	ctx := context.Background()

	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		slog.Error("JWT_SECRET must be set")
		os.Exit(1)
	}

	host := os.Getenv("HOST")
	if host == "" {
		host = "0.0.0.0"
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	addr := host + ":" + port

	conn, err := db.ConnectDB(ctx)
	if err != nil {
		slog.Error("Error while connecting DB", "err", err)
		os.Exit(1)
	}

	defer conn.Close(ctx)

	err = db.InitTable(ctx, conn)
	if err != nil {
		slog.Error("Error while init table", "err", err)
		os.Exit(1)
	}

	env := &handlers.Env{Conn: conn, Secret: []byte(jwtSecret)}

	http.HandleFunc("/register", env.RegisterUser)
	http.HandleFunc("/login", env.Login)
	http.Handle("/savePassword", env.AuthMiddleware(env.SavePassword))
	http.HandleFunc("/getSalt", env.GetSalt)
	http.Handle("/getPasswords", env.AuthMiddleware(env.GetPasswords))
	http.Handle("/updatePassword", env.AuthMiddleware(env.UpdatePassword))
	http.Handle("/deletePassword", env.AuthMiddleware(env.DeletePassword))

	slog.Info("Server starting", "addr", addr)

	err = http.ListenAndServe(addr, nil)
	if err != nil {
		slog.Error("Failed to start server", "err", err)
		os.Exit(1)
	}

}

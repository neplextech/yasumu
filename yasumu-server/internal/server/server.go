package server

import (
	"context"
	"log"
	"net/http"
	"time"

	"yasumu-server/internal/config"
	"yasumu-server/internal/router"
)

type Server struct {
	cfg        *config.Config
	httpServer *http.Server
}

func New(cfg *config.Config) *Server {
	r := router.New()

	return &Server{
		cfg: cfg,
		httpServer: &http.Server{
			Addr:         cfg.Server.Host + ":" + cfg.Server.Port,
			Handler:      r,
			ReadTimeout:  15 * time.Second,
			WriteTimeout: 15 * time.Second,
			IdleTimeout:  60 * time.Second,
		},
	}
}

func (s *Server) Start() error {
	log.Printf("server starting on %s:%s", s.cfg.Server.Host, s.cfg.Server.Port)
	return s.httpServer.ListenAndServe()
}

func (s *Server) Shutdown() error {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	return s.httpServer.Shutdown(ctx)
}


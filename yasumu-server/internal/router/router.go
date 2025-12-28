package router

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	chimiddleware "github.com/go-chi/chi/v5/middleware"

	"yasumu-server/internal/handlers"
	"yasumu-server/internal/middleware"
)

func New() http.Handler {
	r := chi.NewRouter()

	r.Use(chimiddleware.RequestID)
	r.Use(chimiddleware.RealIP)
	r.Use(middleware.Logger)
	r.Use(chimiddleware.Recoverer)
	r.Use(middleware.CORS)

	r.Route("/api", func(r chi.Router) {
		r.Route("/v1", func(r chi.Router) {
			r.Get("/health", handlers.Health)
			r.Get("/health/ready", handlers.Ready)
			r.Get("/health/live", handlers.Live)
		})
	})

	return r
}


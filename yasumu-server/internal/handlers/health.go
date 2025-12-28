package handlers

import (
	"encoding/json"
	"net/http"
	"time"
)

type HealthResponse struct {
	Status    string    `json:"status"`
	Timestamp time.Time `json:"timestamp"`
	Version   string    `json:"version"`
}

type ReadinessResponse struct {
	Status   string            `json:"status"`
	Services map[string]string `json:"services"`
}

func Health(w http.ResponseWriter, r *http.Request) {
	response := HealthResponse{
		Status:    "healthy",
		Timestamp: time.Now().UTC(),
		Version:   "0.1.0",
	}

	writeJSON(w, http.StatusOK, response)
}

func Ready(w http.ResponseWriter, r *http.Request) {
	response := ReadinessResponse{
		Status: "ready",
		Services: map[string]string{
			"database": "not_connected",
		},
	}

	writeJSON(w, http.StatusOK, response)
}

func Live(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"status": "alive"})
}

func writeJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}


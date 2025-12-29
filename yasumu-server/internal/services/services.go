package services

import "yasumu-server/internal/repository"

type Services struct {
	repo *repository.Repository
}

func New(repo *repository.Repository) *Services {
	return &Services{repo: repo}
}


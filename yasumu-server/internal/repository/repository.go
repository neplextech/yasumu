package repository

import "yasumu-server/internal/database"

type Repository struct {
	db *database.Database
}

func New(db *database.Database) *Repository {
	return &Repository{db: db}
}


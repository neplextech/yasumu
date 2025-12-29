.PHONY: build run dev test clean docker-build docker-up docker-down tidy

build:
	go build -o bin/server ./cmd/server

run: build
	./bin/server

dev:
	go run ./cmd/server

test:
	go test -v ./...

clean:
	rm -rf bin/
	go clean

docker-build:
	docker compose build

docker-up:
	docker compose up -d

docker-down:
	docker compose down

tidy:
	go mod tidy


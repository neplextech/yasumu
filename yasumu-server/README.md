# Yasumu Server

A robust self-hostable backend server for Yasumu built with Go, featuring PostgreSQL integration via GORM.

## Prerequisites

- Go 1.23+
- Docker & Docker Compose (optional)
- PostgreSQL 16+ (if running locally without Docker)

> [!WARNING]
> The server part of Yasumu is currently in a **very early stage** and development has not started yet. It may take a while until we start working on it.

## Project Structure

```
yasumu-server/
├── cmd/
│   └── server/          # Application entry point
├── internal/
│   ├── config/          # Configuration management
│   ├── database/        # Database connection (GORM)
│   ├── handlers/        # HTTP request handlers
│   ├── middleware/      # HTTP middleware (logging, CORS)
│   ├── models/          # Database models
│   ├── repository/      # Data access layer
│   ├── router/          # Route definitions
│   ├── server/          # HTTP server lifecycle
│   └── services/        # Business logic layer
├── docker-compose.yml
├── Dockerfile
└── Makefile
```

## Quick Start

### Using Docker Compose

```bash
# Start server with PostgreSQL
docker compose up -d

# View logs
docker compose logs -f server

# Stop all services
docker compose down
```

### Running Locally

```bash
# Install dependencies
go mod download

# Run the server
make dev

# Or build and run
make build
./bin/server
```

## Configuration

Environment variables (can be set in `.env` file):

| Variable | Default | Description |
|----------|---------|-------------|
| `SERVER_HOST` | `0.0.0.0` | Server bind address |
| `SERVER_PORT` | `8080` | Server port |
| `DB_HOST` | `localhost` | PostgreSQL host |
| `DB_PORT` | `5432` | PostgreSQL port |
| `DB_USER` | `yasumu` | Database user |
| `DB_PASSWORD` | `yasumu` | Database password |
| `DB_NAME` | `yasumu` | Database name |
| `DB_SSLMODE` | `disable` | SSL mode |

## API Endpoints

### Health Checks

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/health` | GET | General health status |
| `/api/v1/health/ready` | GET | Readiness probe |
| `/api/v1/health/live` | GET | Liveness probe |

#### Example Response

```bash
curl http://localhost:8080/api/v1/health
```

```json
{
  "status": "healthy",
  "timestamp": "2025-12-28T12:00:00Z",
  "version": "0.1.0"
}
```

## Development

### Available Make Commands

| Command | Description |
|---------|-------------|
| `make dev` | Run server in development mode |
| `make build` | Build binary to `bin/server` |
| `make run` | Build and run |
| `make test` | Run tests |
| `make clean` | Remove build artifacts |
| `make tidy` | Run `go mod tidy` |
| `make docker-build` | Build Docker image |
| `make docker-up` | Start Docker containers |
| `make docker-down` | Stop Docker containers |

### Adding New Endpoints

1. Create handler in `internal/handlers/`
2. Register route in `internal/router/router.go`
3. Add business logic in `internal/services/`
4. Add data access in `internal/repository/`

### Adding Database Models

1. Define model in `internal/models/`
2. Embed `BaseModel` for common fields (ID, timestamps)
3. Run migrations (auto-migrate or manual)

## Architecture

```
Request → Router → Middleware → Handler → Service → Repository → Database
```

- **Handlers**: Parse requests, validate input, return responses
- **Services**: Business logic, orchestration
- **Repository**: Data access, database queries
- **Middleware**: Cross-cutting concerns (logging, auth, CORS)

## License

AGPL-3.0


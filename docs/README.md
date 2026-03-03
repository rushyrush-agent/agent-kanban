# OpenClaw Task Dashboard

A Docker-based task tracking dashboard for OpenClaw with a Kanban board and bidirectional commenting system.

## Prerequisites

- Docker
- Docker Compose

## Quick Start

```bash
cd /home/rush/projects/task-dashboard
docker-compose up -d --build
```

## Access

- **Dashboard UI**: http://localhost:5173
- **API**: http://localhost:8444

## Project Structure

```
task-dashboard/
├── backend/           # Express + SQLite + Socket.IO API
├── frontend/          # React + Vite Kanban UI
├── docs/              # Documentation
├── docker-compose.yml  # Docker orchestration
└── README.md
```

## Persistence

The SQLite database is stored in a Docker volume named `task-data`. Data persists across container restarts.

```bash
# View volume
docker volume ls | grep task-data

# Reset data (deletes all tasks)
docker-compose down -v
```

## Commands

```bash
# Start the dashboard
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop the dashboard (data persists)
docker-compose down

# Full reset (deletes data)
docker-compose down -v
```

## Environment

### Backend
- `PORT`: API port (default: 8444)
- `DATABASE_PATH`: SQLite database path (default: /app/data/tasks.db)

### Frontend
- `VITE_API_URL`: Backend API URL (default: "" - uses relative paths via nginx proxy)

## Task Status Workflow

| Status | Description |
|--------|-------------|
| **backlog** | Tasks to assign - agent can comment/ask questions but won't take action |
| **ready** | Ready for OpenClaw to pickup and work on |
| **in_progress** | OpenClaw actively working on the task |
| **pending_user_info** | Waiting for user feedback, more information, or validation |
| **complete** | Task completed - comments should document what was done |

## API Integration

OpenClaw can interact with the dashboard via HTTP API. See [OPENCLAW.md](OPENCLAW.md) for detailed integration guide.

## Development

To run locally without Docker:

```bash
# Backend
cd backend
npm install
npm run dev

# Frontend (separate terminal)
cd frontend
npm install
npm run dev
```

The frontend in development mode proxies API requests to `http://localhost:8444`.
# OpenClaw Task Dashboard

A Docker-based task tracking dashboard for OpenClaw with a Kanban board and bidirectional commenting system.

## Quick Start

```bash
cd /home/rush/projects/task-dashboard
docker compose up -d --build
```

## Access

- **Dashboard UI**: http://localhost:5173
- **API**: http://localhost:8444
- **Health Check**: http://localhost:8444/health

## Commands

```bash
# Build and start
docker compose up -d --build

# View logs
docker compose logs -f

# Stop (data persists in volume)
docker compose down

# Full reset (deletes all data)
docker compose down -v
```

## Persistence

Data persists in a Docker volume named `task-data`. The SQLite database survives container restarts.

## Documentation

- [Setup & Installation](docs/README.md)
- [OpenClaw Integration](docs/OPENCLAW.md)
- [API Reference](docs/API.md)

## Task Status Workflow

| Status | Description |
|--------|-------------|
| **backlog** | Tasks to assign - agent can comment/ask but won't act |
| **ready** | Ready for OpenClaw to pickup |
| **in_progress** | OpenClaw actively working |
| **pending_user_info** | Waiting for user feedback/validation |
| **complete** | Completed - should include completion notes |
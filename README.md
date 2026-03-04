# Agent Kanban Dashboard

A Docker-based task tracking dashboard with a Kanban board, bidirectional commenting, and task dependencies.

## Quick Start

```bash
cd /home/rush/projects/agent-kanban
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
| **ready** | Ready for agent to pickup |
| **in_progress** | Agent actively working |
| **pending_user_info** | Waiting for user feedback/validation |
| **complete** | Completed - should include completion notes |

## Task Dependencies

Tasks can have dependencies on other tasks. A task with incomplete dependencies will show a "blocked" indicator in the UI.

- When task A depends on task B, you must complete task B before task A can be worked on
- When a dependency completes, you'll receive a notification suggesting to promote blocked tasks to "Ready"

Example:
- claw-0008 depends on claw-0003 → Complete claw-0003 first to unblock claw-0008

### Managing Dependencies via API

```bash
# Add dependency (claw-0008 depends on claw-0003)
curl -X POST http://localhost:8444/api/tasks/8/dependencies \
  -H "Content-Type: application/json" \
  -d '{"depends_on_task_id": 3}'

# List dependencies for a task
curl http://localhost:8444/api/tasks/8/dependencies

# Remove dependency
curl -X DELETE http://localhost:8444/api/tasks/8/dependencies/1
```
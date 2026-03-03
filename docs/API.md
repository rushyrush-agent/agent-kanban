# API Reference

Complete REST API documentation for the OpenClaw Task Dashboard.

## Base URL

```
http://localhost:8444
```

## Endpoints Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks` | List all tasks |
| POST | `/api/tasks` | Create a new task |
| GET | `/api/tasks/:id` | Get a task by ID |
| PUT | `/api/tasks/:id` | Update a task |
| PATCH | `/api/tasks/:id/status` | Update task status only |
| DELETE | `/api/tasks/:id` | Delete a task |
| GET | `/api/tasks/:id/comments` | Get comments for a task |
| POST | `/api/tasks/:id/comments` | Add a comment to a task |

---

## Tasks

### List All Tasks

```
GET /api/tasks
```

**Query Parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| status | string | Filter by status (optional) |

**Example Request**
```bash
# All tasks
curl http://localhost:8444/api/tasks

# Tasks by status
curl http://localhost:8444/api/tasks?status=backlog
```

**Response**
```json
[
  {
    "id": 1,
    "title": "Implement login",
    "description": "Add JWT authentication",
    "status": "backlog",
    "priority": 0,
    "created_by": "user",
    "created_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-01-15T10:30:00.000Z"
  }
]
```

---

### Get Task by ID

```
GET /api/tasks/:id
```

**Example Request**
```bash
curl http://localhost:8444/api/tasks/1
```

**Response**
```json
{
  "id": 1,
  "title": "Implement login",
  "description": "Add JWT authentication",
  "status": "backlog",
  "priority": 0,
  "created_by": "user",
  "created_at": "2024-01-15T10:30:00.000Z",
  "updated_at": "2024-01-15T10:30:00.000Z"
}
```

**Error Responses**
- `404 Not Found` - Task does not exist

---

### Create Task

```
POST /api/tasks
```

**Request Body**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| title | string | Yes | Task title |
| description | string | No | Task description |
| status | string | No | Task status (default: "backlog") |
| priority | number | No | Priority (default: 0) |
| created_by | string | No | Who created the task |

**Valid Status Values**
- `backlog`
- `ready`
- `in_progress`
- `pending_user_info`
- `complete`

**Example Request**
```bash
curl -X POST http://localhost:8444/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Implement user authentication",
    "description": "Add JWT-based login with bcrypt",
    "status": "backlog",
    "created_by": "user"
  }'
```

**Response**
```json
{
  "id": 2,
  "title": "Implement user authentication",
  "description": "Add JWT-based login with bcrypt",
  "status": "backlog",
  "priority": 0,
  "created_by": "user",
  "created_at": "2024-01-15T11:00:00.000Z",
  "updated_at": "2024-01-15T11:00:00.000Z"
}
```

**Error Responses**
- `400 Bad Request` - Missing required fields or invalid status

---

### Update Task

```
PUT /api/tasks/:id
```

**Request Body**

| Field | Type | Description |
|-------|------|-------------|
| title | string | Task title |
| description | string | Task description |
| status | string | Task status |
| priority | number | Priority |

**Example Request**
```bash
curl -X PUT http://localhost:8444/api/tasks/1 \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated title",
    "description": "Updated description",
    "priority": 1
  }'
```

**Response**
```json
{
  "id": 1,
  "title": "Updated title",
  "description": "Updated description",
  "status": "backlog",
  "priority": 1,
  "created_by": "user",
  "created_at": "2024-01-15T10:30:00.000Z",
  "updated_at": "2024-01-15T11:30:00.000Z"
}
```

---

### Update Task Status

```
PATCH /api/tasks/:id/status
```

**Request Body**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| status | string | Yes | New status |

**Example Request**
```bash
curl -X PATCH http://localhost:8444/api/tasks/1/status \
  -H "Content-Type: application/json" \
  -d '{"status": "in_progress"}'
```

**Response**
```json
{
  "id": 1,
  "title": "Implement login",
  "status": "in_progress",
  ...
}
```

**Error Responses**
- `400 Bad Request` - Invalid status value
- `404 Not Found` - Task does not exist

---

### Delete Task

```
DELETE /api/tasks/:id
```

**Example Request**
```bash
curl -X DELETE http://localhost:8444/api/tasks/1
```

**Response**
- `204 No Content` - Success

---

## Comments

### Get Task Comments

```
GET /api/tasks/:id/comments
```

**Example Request**
```bash
curl http://localhost:8444/api/tasks/1/comments
```

**Response**
```json
[
  {
    "id": 1,
    "task_id": 1,
    "content": "Should I use bcrypt or argon2?",
    "author_type": "agent",
    "author_name": "agent",
    "created_at": "2024-01-15T12:00:00.000Z"
  },
  {
    "id": 2,
    "task_id": 1,
    "content": "Use bcrypt with 12 rounds",
    "author_type": "user",
    "author_name": "user",
    "created_at": "2024-01-15T12:05:00.000Z"
  }
]
```

---

### Add Comment

```
POST /api/tasks/:id/comments
```

**Request Body**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| content | string | Yes | Comment text |
| author_type | string | Yes | "user" or "agent" |
| author_name | string | No | Author name (default: "user" or "agent") |

**Example Request**
```bash
curl -X POST http://localhost:8444/api/tasks/1/comments \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Working on the implementation now",
    "author_type": "agent",
    "author_name": "agent"
  }'
```

**Response**
```json
{
  "id": 3,
  "task_id": 1,
  "content": "Working on the implementation now",
  "author_type": "agent",
  "author_name": "agent",
  "created_at": "2024-01-15T12:30:00.000Z"
}
```

**Error Responses**
- `400 Bad Request` - Missing required fields
- `404 Not Found` - Task does not exist

---

## Health Check

```
GET /health
```

**Example Request**
```bash
curl http://localhost:8444/health
```

**Response**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:00:00.000Z"
}
```

---

## WebSocket Events

Connect to the server at `http://localhost:8444` to receive real-time updates.

### Connection

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:8444');
```

### Events

| Event | Data | Description |
|-------|------|-------------|
| `task:created` | `Task` | New task created |
| `task:updated` | `Task` | Task updated (any field) |
| `task:deleted` | `{ id: number }` | Task deleted |
| `comment:added` | `Comment` | New comment added |

### Example

```javascript
socket.on('task:created', (task) => {
  console.log('New task:', task.title);
});

socket.on('task:updated', (task) => {
  console.log(`Task #${task.id} status: ${task.status}`);
});

socket.on('comment:added', (comment) => {
  console.log(`New comment on task #${comment.task_id}: ${comment.content}`);
});
```

---

## Error Responses

All errors follow this format:

```json
{
  "error": "Error message description"
}
```

### Common HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 204 | No Content |
| 400 | Bad Request (invalid input) |
| 404 | Not Found |
| 500 | Internal Server Error |

---

## TypeScript Types

```typescript
type TaskStatus = 'backlog' | 'ready' | 'in_progress' | 'pending_user_info' | 'complete';

interface Task {
  id: number;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

interface Comment {
  id: number;
  task_id: number;
  content: string;
  author_type: 'user' | 'agent';
  author_name: string;
  created_at: string;
}
```
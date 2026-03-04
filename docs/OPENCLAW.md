# OpenClaw Integration Guide

This document describes how OpenClaw can integrate with the Task Dashboard to track and manage tasks.

## Overview

OpenClaw can interact with the Task Dashboard via:
1. **REST API** - Create tasks, update status, add comments
2. **WebSocket** - Real-time updates (optional)

## Base URL

```
http://localhost:8444
```

---

## Task Status Definitions

Understanding each status is crucial for proper workflow:

### backlog
- **Description**: Tasks to be assigned
- **Agent Behavior**: Agent can comment, ask clarifying questions, but should NOT take any action on the task
- **Use Case**: When user creates a task that needs review before work begins

### ready
- **Description**: Ready for OpenClaw to pickup
- **Agent Behavior**: Agent can start working on the task. Move to `in_progress` when beginning work
- **Use Case**: User has reviewed and approved the task, waiting for agent to begin

### in_progress
- **Description**: Agent actively working on the task
- **Agent Behavior**: Agent should be actively implementing the solution
- **Use Case**: Agent has picked up the task and is working on it

### pending_user_info
- **Description**: Waiting for user feedback, more information, or validation
- **Agent Behavior**: Agent should NOT proceed until user responds. Use comments to ask questions
- **Use Case**: Need user input, clarification, or need user to validate work

### complete
- **Description**: Task completed with documentation
- **Agent Behavior**: Must add a completion comment explaining what was done, how, and why it's considered complete
- **Use Case**: Task is done and ready for user review

---

## API Examples

### Creating a Task

Create a task in the backlog for OpenClaw to review:

```bash
curl -X POST http://localhost:8444/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Implement user authentication",
    "description": "Add JWT-based login with bcrypt password hashing",
    "status": "backlog",
    "created_by": "user"
  }'
```

### Moving Task Through Workflow

#### Agent picks up a task (ready → in_progress):
```bash
curl -X PATCH http://localhost:8444/api/tasks/1/status \
  -H "Content-Type: application/json" \
  -d '{"status": "in_progress"}'
```

#### Agent needs clarification (in_progress → pending_user_info):
```bash
curl -X PATCH http://localhost:8444/api/tasks/1/status \
  -H "Content-Type: application/json" \
  -d '{"status": "pending_user_info"}'
```

#### User provides info (pending_user_info → in_progress):
```bash
curl -X PATCH http://localhost:8444/api/tasks/1/status \
  -H "Content-Type: application/json" \
  -d '{"status": "in_progress"}'
```

#### Agent completes task (in_progress → complete):
```bash
curl -X PATCH http://localhost:8444/api/tasks/1/status \
  -H "Content-Type: application/json" \
  -d '{"status": "complete"}'
```

### Agent Commenting

When adding comments from OpenClaw, always use `author_type: "agent"`:

#### Agent asking a question:
```bash
curl -X POST http://localhost:8444/api/tasks/1/comments \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Should I use bcrypt or argon2 for password hashing? Arg2 is more secure but bcrypt is more widely supported.",
    "author_type": "agent",
    "author_name": "agent"
  }'
```

#### Agent providing update:
```bash
curl -X POST http://localhost:8444/api/tasks/1/comments \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Currently implementing the login endpoint. Should have a working prototype in ~30 minutes.",
    "author_type": "agent",
    "author_name": "agent"
  }'
```

#### Agent marking task complete (REQUIRED):
When moving a task to `complete`, include a detailed completion comment:
```bash
curl -X POST http://localhost:8444/api/tasks/1/comments \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Completed: Implemented JWT-based authentication with bcrypt (12 rounds). Created /auth/login, /auth/logout, and /auth/register endpoints. Tokens expire in 7 days. All unit tests pass. Considered complete as all authentication flows work correctly.",
    "author_type": "agent",
    "author_name": "agent"
  }'
```

### Reading Comments

To see all comments on a task:
```bash
curl http://localhost:8444/api/tasks/1/comments
```

---

## Task Dependencies

Tasks can depend on other tasks. A task cannot be worked on until all its dependencies are completed.

### Adding Dependencies

```bash
# Task 8 depends on Task 3
curl -X POST http://localhost:8444/api/tasks/8/dependencies \
  -H "Content-Type: application/json" \
  -d '{"depends_on_task_id": 3}'
```

### Chain Example

```
claw-0008 → claw-0003 → claw-0007
```

Complete in order: claw-0007 → claw-0003 → claw-0008

### Auto-Promote Notifications

When a blocked task's dependency completes, the system emits a `task:promotion_suggested` event. The frontend displays a notification to promote the blocked task to "Ready".

### Dependency API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks/:id/dependencies` | List task dependencies |
| POST | `/api/tasks/:id/dependencies` | Add a dependency |
| DELETE | `/api/tasks/:id/dependencies/:depId` | Remove a dependency |

---

## OpenClaw Tool Integration Example

Here's how OpenClaw could use this API as a custom tool:

```typescript
// Example OpenClaw tool for creating tasks
const createTaskTool = {
  name: 'create-task',
  description: 'Create a new task in the tracking dashboard',
  parameters: {
    type: 'object',
    properties: {
      title: { type: 'string', description: 'Task title' },
      description: { type: 'string', description: 'Task description' },
      status: { 
        type: 'string', 
        enum: ['backlog', 'ready', 'in_progress', 'pending_user_info', 'complete'],
        default: 'backlog'
      }
    },
    required: ['title']
  },
  handler: async ({ title, description, status = 'backlog' }) => {
    const response = await fetch('http://localhost:8444/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description, status })
    });
    return response.json();
  }
};

// Example OpenClaw tool for commenting
const addCommentTool = {
  name: 'add-comment',
  description: 'Add a comment to a task',
  parameters: {
    type: 'object',
    properties: {
      taskId: { type: 'number', description: 'Task ID' },
      content: { type: 'string', description: 'Comment content' },
      isFromAgent: { type: 'boolean', description: 'Is this from the agent?', default: true }
    },
    required: ['taskId', 'content']
  },
  handler: async ({ taskId, content, isFromAgent = true }) => {
    const response = await fetch(`http://localhost:8444/api/tasks/${taskId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        content, 
        author_type: isFromAgent ? 'agent' : 'user',
        author_name: isFromAgent ? 'agent' : 'user'
      })
    });
    return response.json();
  }
};

// Example OpenClaw tool for updating status
const updateTaskStatusTool = {
  name: 'update-task-status',
  description: 'Update the status of a task',
  parameters: {
    type: 'object',
    properties: {
      taskId: { type: 'number', description: 'Task ID' },
      status: { 
        type: 'string', 
        enum: ['backlog', 'ready', 'in_progress', 'pending_user_info', 'complete']
      }
    },
    required: ['taskId', 'status']
  },
  handler: async ({ taskId, status }) => {
    const response = await fetch(`http://localhost:8444/api/tasks/${taskId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    return response.json();
  }
};
```

---

## Best Practices

1. **Always add completion comments**: When marking a task complete, include a comment explaining what was done, how, and why it's complete.

2. **Use pending_user_info appropriately**: If you need clarification, move to this status and ask your question via comments.

3. **Bidirectional communication**: Use comments to communicate with the user. Both agent and user can comment on the same task.

4. **Status transitions**: Follow the workflow naturally. Don't skip from `backlog` to `complete` without going through the proper stages.

5. **Real-time updates**: Connect to the WebSocket to receive instant updates when:
   - A new task is created
   - Task status changes
   - New comments are added

---

## WebSocket Events

Connect to `http://localhost:8444` to receive real-time updates:

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:8444');

socket.on('task:created', (task) => {
  console.log('New task:', task);
});

socket.on('task:updated', (task) => {
  console.log('Task updated:', task);
});

socket.on('task:deleted', ({ id }) => {
  console.log('Task deleted:', id);
});

socket.on('comment:added', (comment) => {
  console.log('New comment:', comment);
});

socket.on('task:dependency_added', (dependency) => {
  console.log('Dependency added:', dependency);
});

socket.on('task:dependency_removed', ({ task_id, depends_on_task_id }) => {
  console.log('Dependency removed from task:', task_id);
});

socket.on('task:promotion_suggested', ({ task_id, blocked_by }) => {
  console.log('Task', task_id, 'is now unblocked by', blocked_by);
});
```

---

## Error Handling

All API responses include error messages:

```json
{
  "error": "Task not found"
}
```

Common errors:
- `400` - Invalid request (missing required fields, invalid status)
- `404` - Task not found
- `500` - Internal server error
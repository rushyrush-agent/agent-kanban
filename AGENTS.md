# Agent Guidelines for agent-kanban

This is a TypeScript/React Kanban board project with Express backend and SQLite database.

## Project Structure

```
agent-kanban/
├── frontend/          # React + Vite + TypeScript
│   └── src/
│       ├── components/  # React components
│       ├── api.ts       # API client
│       ├── hooks.ts     # React hooks (useTasks, useComments, useSocket)
│       ├── types.ts     # Shared types
│       └── App.tsx      # Main app
└── backend/           # Express + SQLite + TypeScript
    └── src/
        ├── db.ts       # SQLite database
        ├── socket.ts   # Socket.io events
        ├── index.ts    # Express app entry
        ├── types.ts    # Shared types
        └── routes/     # Express routers
            ├── tasks.ts
            └── comments.ts
```

## Commands

### Backend

```bash
cd backend
npm run dev     # Development with tsx watch (auto-restart)
npm run build   # Compile TypeScript to dist/
npm run start  # Run compiled JavaScript
```

### Frontend

```bash
cd frontend
npm run dev     # Start Vite dev server on :5173
npm run build   # Type-check and build for production
npm run preview # Preview production build
```

### Docker (Full Stack)

```bash
docker compose up -d --build   # Build and start all services
docker compose logs -f         # View logs
docker compose down            # Stop (data persists)
docker compose down -v         # Full reset (deletes data)
```

### Running a Single Test

There are no tests in this project. If tests are added:
- Use Vitest for frontend (or Jest)
- Run specific test: `npm run test -- --run <test-name>`

## Code Style Guidelines

### TypeScript

- **Strict mode**: Always enabled. Do not use `any` unless absolutely necessary.
- **Explicit types**: Prefer explicit type annotations for function parameters and return types.
- **Interfaces over types**: Use `interface` for object shapes, `type` for unions/aliases.
- **Null handling**: Use `| null` explicitly rather than implicit undefined.

### Imports

```typescript
// Order: external libs → internal imports → types → styles
import { useState, useEffect } from 'react';
import { useTasks } from './hooks';
import TaskBoard from './components/TaskBoard';
import type { Task, CreateTaskInput } from './types';
```

- Use path aliases if configured (`@/` or similar)
- Import types using `import type { ... }` for type-only imports

### React Components

- Use functional components with hooks
- Prefer arrow functions for simple components
- Use PascalCase for component names
- Destructure props in function signature
- Colocate small components with their parent

```typescript
interface TaskCardProps {
  task: Task;
  index: number;
  onClick: () => void;
}

export default function TaskCard({ task, index, onClick }: TaskCardProps) {
  // ...
}
```

### Naming Conventions

- **Variables/functions**: camelCase
- **Components**: PascalCase
- **Constants**: UPPER_SNAKE_CASE for enums/globals, camelCase for local
- **Files**: kebab-case for components (`task-card.tsx`), camelCase for utilities

### Error Handling

- Use try/catch for async operations
- Always provide user-friendly error messages
- Log errors to console with context
- Use typed error responses from API

```typescript
try {
  const data = await fetchTasks();
  setTasks(data);
} catch (err) {
  setError(err instanceof Error ? err.message : 'Failed to fetch tasks');
}
```

### API Patterns

- Backend routes return JSON with appropriate HTTP status codes
- Use Express router for route grouping
- Validate input at route handlers
- Emit Socket.io events for real-time updates after mutations

### State Management

- Use React hooks (`useState`, `useEffect`, `useCallback`)
- Custom hooks for reusable logic (`useTasks`, `useComments`)
- Socket.io for real-time sync between clients

### Database

- Use better-sqlite3 for synchronous SQLite access
- Use parameterized queries to prevent SQL injection
- Follow the TaskStatus union type for status values

### Task Status Values

```typescript
type TaskStatus = 'backlog' | 'ready' | 'in_progress' | 'pending_user_info' | 'complete';
```

### General

- No comments unless explaining complex business logic
- Keep functions small and focused
- Extract magic numbers into named constants
- Use meaningful variable names (avoid single letters except in loops)
- ESLint/Prettier config should be respected if present
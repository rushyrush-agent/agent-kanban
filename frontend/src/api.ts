import type { Task, CreateTaskInput, Comment, CreateCommentInput, TaskStatus, TaskDependencyWithTask, CreateDependencyInput } from './types';

const API_URL = import.meta.env.VITE_API_URL || '';

async function fetchApi<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

export const api = {
  tasks: {
    list: (status?: TaskStatus): Promise<Task[]> => {
      const params = status ? `?status=${status}` : '';
      return fetchApi<Task[]>(`/api/tasks${params}`);
    },

    get: (id: number): Promise<Task> => {
      return fetchApi<Task>(`/api/tasks/${id}`);
    },

    create: (input: CreateTaskInput): Promise<Task> => {
      return fetchApi<Task>('/api/tasks', {
        method: 'POST',
        body: JSON.stringify(input),
      });
    },

    update: (id: number, input: Partial<Task>): Promise<Task> => {
      return fetchApi<Task>(`/api/tasks/${id}`, {
        method: 'PUT',
        body: JSON.stringify(input),
      });
    },

    updateStatus: (id: number, status: TaskStatus): Promise<Task> => {
      return fetchApi<Task>(`/api/tasks/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
    },

    delete: (id: number): Promise<void> => {
      return fetchApi<void>(`/api/tasks/${id}`, {
        method: 'DELETE',
      });
    },
  },

  comments: {
    list: (taskId: number): Promise<Comment[]> => {
      return fetchApi<Comment[]>(`/api/tasks/${taskId}/comments`);
    },

    create: (taskId: number, input: CreateCommentInput): Promise<Comment> => {
      return fetchApi<Comment>(`/api/tasks/${taskId}/comments`, {
        method: 'POST',
        body: JSON.stringify(input),
      });
    },
  },

  dependencies: {
    list: (taskId: number): Promise<TaskDependencyWithTask[]> => {
      return fetchApi<TaskDependencyWithTask[]>(`/api/tasks/${taskId}/dependencies`);
    },

    add: (taskId: number, input: CreateDependencyInput): Promise<TaskDependencyWithTask> => {
      return fetchApi<TaskDependencyWithTask>(`/api/tasks/${taskId}/dependencies`, {
        method: 'POST',
        body: JSON.stringify(input),
      });
    },

    remove: (taskId: number, depId: number): Promise<void> => {
      return fetchApi<void>(`/api/tasks/${taskId}/dependencies/${depId}`, {
        method: 'DELETE',
      });
    },
  },
};
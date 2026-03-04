export type TaskStatus = 'backlog' | 'ready' | 'in_progress' | 'pending_user_info' | 'complete';

export interface Task {
  id: number;
  task_id: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: number;
  created_by?: string;
}

export interface Comment {
  id: number;
  task_id: number;
  content: string;
  author_type: 'user' | 'agent';
  author_name: string;
  created_at: string;
}

export interface CreateCommentInput {
  content: string;
  author_type: 'user' | 'agent';
  author_name?: string;
}

export const STATUS_LABELS: Record<TaskStatus, string> = {
  backlog: 'Backlog',
  ready: 'Ready',
  in_progress: 'In Progress',
  pending_user_info: 'Pending User Info',
  complete: 'Complete',
};

export const STATUS_COLORS: Record<TaskStatus, string> = {
  backlog: '#6b7280',
  ready: '#3b82f6',
  in_progress: '#f59e0b',
  pending_user_info: '#8b5cf6',
  complete: '#10b981',
};
export type TaskStatus = 'backlog' | 'ready' | 'in_progress' | 'pending_user_info' | 'complete';

export interface Task {
  id: number;
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

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: number;
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
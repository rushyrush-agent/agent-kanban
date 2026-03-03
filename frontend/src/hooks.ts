import { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import type { Task, Comment } from './types';

const API_URL = import.meta.env.VITE_API_URL || '';

export function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const newSocket = io(API_URL || window.location.origin, {
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      console.log('Socket connected');
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  return socket;
}

export function useTasks(initialStatus?: string) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const socket = useSocket();

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const url = initialStatus ? `?status=${initialStatus}` : '';
      const response = await fetch(`${API_URL}/api/tasks${url}`);
      const data = await response.json();
      setTasks(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  }, [initialStatus]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  useEffect(() => {
    if (!socket) return;

    socket.on('task:created', (task: Task) => {
      setTasks((prev) => [task, ...prev]);
    });

    socket.on('task:updated', (task: Task) => {
      setTasks((prev) => prev.map((t) => (t.id === task.id ? task : t)));
    });

    socket.on('task:deleted', ({ id }: { id: number }) => {
      setTasks((prev) => prev.filter((t) => t.id !== id));
    });

    return () => {
      socket.off('task:created');
      socket.off('task:updated');
      socket.off('task:deleted');
    };
  }, [socket]);

  return { tasks, loading, error, refetch: fetchTasks };
}

export function useComments(taskId: number | null) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socket = useSocket();

  const fetchComments = useCallback(async () => {
    if (!taskId) return;
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/tasks/${taskId}/comments`);
      const data = await response.json();
      setComments(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch comments');
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  useEffect(() => {
    if (!socket || !taskId) return;

    socket.on('comment:added', (comment: Comment) => {
      if (comment.task_id === taskId) {
        setComments((prev) => [...prev, comment]);
      }
    });

    return () => {
      socket.off('comment:added');
    };
  }, [socket, taskId]);

  return { comments, loading, error, refetch: fetchComments };
}
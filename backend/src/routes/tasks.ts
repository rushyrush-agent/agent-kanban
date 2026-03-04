import { Router } from 'express';
import db from '../db';
import type { Task, CreateTaskInput, UpdateTaskInput, TaskStatus } from '../types';
import { emitTaskCreated, emitTaskUpdated, emitTaskDeleted } from '../socket';

const router = Router();

const TASK_ID_PREFIX = process.env.TASK_ID_PREFIX || 'claw';

function generateNextTaskId(): string {
  const stmt = db.prepare("SELECT task_id FROM tasks WHERE task_id LIKE ?");
  const tasks = stmt.all(`${TASK_ID_PREFIX}-%`) as { task_id: string }[];
  
  let maxNum = 0;
  for (const task of tasks) {
    const match = task.task_id.match(/(\d+)$/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxNum) maxNum = num;
    }
  }
  
  const nextNum = maxNum + 1;
  return `${TASK_ID_PREFIX}-${String(nextNum).padStart(4, '0')}`;
}

router.get('/', (req, res) => {
  const { status } = req.query;
  let tasks: Task[];
  
  if (status && typeof status === 'string') {
    const stmt = db.prepare('SELECT * FROM tasks WHERE status = ? ORDER BY priority DESC, created_at DESC');
    tasks = stmt.all(status) as Task[];
  } else {
    const stmt = db.prepare('SELECT * FROM tasks ORDER BY priority DESC, created_at DESC');
    tasks = stmt.all() as Task[];
  }
  
  res.json(tasks);
});

router.get('/:id', (req, res) => {
  const { id } = req.params;
  const stmt = db.prepare('SELECT * FROM tasks WHERE id = ?');
  const task = stmt.get(id) as Task | undefined;
  
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }
  
  res.json(task);
});

router.post('/', (req, res) => {
  const input: CreateTaskInput = req.body;
  
  if (!input.title) {
    return res.status(400).json({ error: 'Title is required' });
  }
  
  const taskId = generateNextTaskId();
  
  const stmt = db.prepare(`
    INSERT INTO tasks (task_id, title, description, status, priority, created_by)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  const result = stmt.run(
    taskId,
    input.title,
    input.description || null,
    input.status || 'backlog',
    input.priority || 0,
    input.created_by || null
  );
  
  const newTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(result.lastInsertRowid) as Task;
  emitTaskCreated(newTask);
  
  res.status(201).json(newTask);
});

router.put('/:id', (req, res) => {
  const { id } = req.params;
  const input: UpdateTaskInput = req.body;
  
  const existing = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  if (!existing) {
    return res.status(404).json({ error: 'Task not found' });
  }
  
  const updates: string[] = [];
  const values: any[] = [];
  
  if (input.title !== undefined) {
    updates.push('title = ?');
    values.push(input.title);
  }
  if (input.description !== undefined) {
    updates.push('description = ?');
    values.push(input.description);
  }
  if (input.status !== undefined) {
    updates.push('status = ?');
    values.push(input.status);
  }
  if (input.priority !== undefined) {
    updates.push('priority = ?');
    values.push(input.priority);
  }
  
  if (updates.length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }
  
  updates.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);
  
  const sql = `UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`;
  db.prepare(sql).run(...values);
  
  const updated = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as Task;
  emitTaskUpdated(updated);
  res.json(updated);
});

router.patch('/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  const validStatuses: TaskStatus[] = ['backlog', 'ready', 'in_progress', 'pending_user_info', 'complete'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  
  const existing = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  if (!existing) {
    return res.status(404).json({ error: 'Task not found' });
  }
  
  db.prepare('UPDATE tasks SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, id);
  
  const updated = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as Task;
  emitTaskUpdated(updated);
  res.json(updated);
});

router.delete('/:id', (req, res) => {
  const { id } = req.params;
  
  const existing = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  if (!existing) {
    return res.status(404).json({ error: 'Task not found' });
  }
  
  const taskId = parseInt(id);
  db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
  emitTaskDeleted(taskId);
  res.status(204).send();
});

export default router;
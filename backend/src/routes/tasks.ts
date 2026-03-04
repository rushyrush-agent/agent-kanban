import { Router } from 'express';
import db from '../db';
import type { Task, CreateTaskInput, UpdateTaskInput, TaskStatus, TaskDependencyWithTask, CreateDependencyInput } from '../types';
import { emitTaskCreated, emitTaskUpdated, emitTaskDeleted, emitDependencyAdded, emitDependencyRemoved, emitPromotionSuggested } from '../socket';

const router = Router();

const TASK_ID_PREFIX = process.env.TASK_ID_PREFIX || 'claw';

function getTaskDependencies(taskId: number): TaskDependencyWithTask[] {
  const stmt = db.prepare(`
    SELECT td.*, t.id AS depends_on_task_id, t.task_id, t.title, t.description, t.status, t.priority, t.created_by, t.created_at, t.updated_at
    FROM task_dependencies td
    JOIN tasks t ON t.id = td.depends_on_task_id
    WHERE td.task_id = ?
  `);
  const deps = stmt.all(taskId) as any[];
  return deps.map(d => ({
    id: d.id,
    task_id: d.task_id,
    depends_on_task_id: d.depends_on_task_id,
    created_at: d.created_at,
    depends_on_task: {
      id: d.depends_on_task_id,
      task_id: d.task_id,
      title: d.title,
      description: d.description,
      status: d.status,
      priority: d.priority,
      created_by: d.created_by,
      created_at: d.created_at,
      updated_at: d.updated_at
    }
  }));
}

function attachDependencies(task: Task): Task {
  const deps = getTaskDependencies(task.id);
  return { ...task, dependencies: deps };
}

function checkAndSuggestPromotions(completedTaskId: number): void {
  const dependents = db.prepare(`
    SELECT td.task_id, t.task_id as task_id_str, t.title, t.status
    FROM task_dependencies td
    JOIN tasks t ON t.id = td.task_id
    WHERE td.depends_on_task_id = ?
  `).all(completedTaskId) as { task_id: number; task_id_str: string; title: string; status: string }[];

  for (const dep of dependents) {
    if (dep.status !== 'complete') {
      emitPromotionSuggested(dep.task_id, completedTaskId);
    }
  }
}

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
  
  const tasksWithDeps = tasks.map(attachDependencies);
  res.json(tasksWithDeps);
});

router.get('/:id', (req, res) => {
  const { id } = req.params;
  const stmt = db.prepare('SELECT * FROM tasks WHERE id = ?');
  const task = stmt.get(id) as Task | undefined;
  
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }
  
  const taskWithDeps = attachDependencies(task);
  res.json(taskWithDeps);
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
  const taskWithDeps = attachDependencies(newTask);
  emitTaskCreated(taskWithDeps);
  
  res.status(201).json(taskWithDeps);
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
  const taskWithDeps = attachDependencies(updated);
  emitTaskUpdated(taskWithDeps);
  res.json(taskWithDeps);
});

router.patch('/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  const validStatuses: TaskStatus[] = ['backlog', 'ready', 'in_progress', 'pending_user_info', 'complete'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  
  const existing = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as Task;
  if (!existing) {
    return res.status(404).json({ error: 'Task not found' });
  }
  
  db.prepare('UPDATE tasks SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, id);
  
  const updated = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as Task;
  const taskWithDeps = attachDependencies(updated);
  emitTaskUpdated(taskWithDeps);
  
  if (status === 'complete') {
    checkAndSuggestPromotions(parseInt(id));
  }
  
  res.json(taskWithDeps);
});

router.get('/:id/dependencies', (req, res) => {
  const { id } = req.params;
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }
  
  const deps = getTaskDependencies(parseInt(id));
  res.json(deps);
});

router.post('/:id/dependencies', (req, res) => {
  const { id } = req.params;
  const input: CreateDependencyInput = req.body;
  
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }
  
  const depTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(input.depends_on_task_id);
  if (!depTask) {
    return res.status(404).json({ error: 'Dependency task not found' });
  }
  
  if (parseInt(id) === input.depends_on_task_id) {
    return res.status(400).json({ error: 'A task cannot depend on itself' });
  }
  
  try {
    const stmt = db.prepare('INSERT INTO task_dependencies (task_id, depends_on_task_id) VALUES (?, ?)');
    const result = stmt.run(id, input.depends_on_task_id);
    
    const dep = db.prepare(`
      SELECT td.*, t.id AS depends_on_task_id, t.task_id, t.title, t.description, t.status, t.priority, t.created_by, t.created_at, t.updated_at
      FROM task_dependencies td
      JOIN tasks t ON t.id = td.depends_on_task_id
      WHERE td.id = ?
    `).get(result.lastInsertRowid) as any;
    
    const dependencyWithTask: TaskDependencyWithTask = {
      id: dep.id,
      task_id: dep.task_id,
      depends_on_task_id: dep.depends_on_task_id,
      created_at: dep.created_at,
      depends_on_task: {
        id: dep.depends_on_task_id,
        task_id: dep.task_id,
        title: dep.title,
        description: dep.description,
        status: dep.status,
        priority: dep.priority,
        created_by: dep.created_by,
        created_at: dep.created_at,
        updated_at: dep.updated_at
      }
    };
    
    emitDependencyAdded(dependencyWithTask);
    res.status(201).json(dependencyWithTask);
  } catch (err: any) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(400).json({ error: 'Dependency already exists' });
    }
    throw err;
  }
});

router.delete('/:id/dependencies/:depId', (req, res) => {
  const { id, depId } = req.params;
  
  const dep = db.prepare('SELECT * FROM task_dependencies WHERE id = ?').get(depId);
  if (!dep) {
    return res.status(404).json({ error: 'Dependency not found' });
  }
  
  const depAny = dep as any;
  if (depAny.task_id !== parseInt(id)) {
    return res.status(400).json({ error: 'Dependency does not belong to this task' });
  }
  
  db.prepare('DELETE FROM task_dependencies WHERE id = ?').run(depId);
  emitDependencyRemoved(parseInt(id), depAny.depends_on_task_id);
  res.status(204).send();
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
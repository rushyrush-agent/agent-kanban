import { Router } from 'express';
import db from '../db';
import type { Comment, CreateCommentInput } from '../types';
import { emitCommentAdded } from '../socket';

const router = Router();

router.get('/:taskId/comments', (req, res) => {
  const { taskId } = req.params;
  
  const taskExists = db.prepare('SELECT id FROM tasks WHERE id = ?').get(taskId);
  if (!taskExists) {
    return res.status(404).json({ error: 'Task not found' });
  }
  
  const stmt = db.prepare('SELECT * FROM comments WHERE task_id = ? ORDER BY created_at ASC');
  const comments = stmt.all(taskId) as Comment[];
  
  res.json(comments);
});

router.post('/:taskId/comments', (req, res) => {
  const { taskId } = req.params;
  const input: CreateCommentInput = req.body;
  
  const taskExists = db.prepare('SELECT id FROM tasks WHERE id = ?').get(taskId);
  if (!taskExists) {
    return res.status(404).json({ error: 'Task not found' });
  }
  
  if (!input.content) {
    return res.status(400).json({ error: 'Content is required' });
  }
  
  if (!input.author_type) {
    return res.status(400).json({ error: 'author_type is required (user or agent)' });
  }
  
  const stmt = db.prepare(`
    INSERT INTO comments (task_id, content, author_type, author_name)
    VALUES (?, ?, ?, ?)
  `);
  
  const result = stmt.run(
    taskId,
    input.content,
    input.author_type,
    input.author_name || (input.author_type === 'agent' ? 'agent' : 'user')
  );
  
  const newComment = db.prepare('SELECT * FROM comments WHERE id = ?').get(result.lastInsertRowid) as Comment;
  emitCommentAdded(newComment);
  
  res.status(201).json(newComment);
});

export default router;
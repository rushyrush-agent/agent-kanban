import React, { useState } from 'react';
import type { Task, TaskStatus } from '../types';
import { STATUS_LABELS } from '../types';
import { api } from '../api';

interface TaskModalProps {
  task: Task | null;
  isNew: boolean;
  onClose: () => void;
  onSaved: () => void;
  allTasks?: Task[];
}

const STATUS_OPTIONS: TaskStatus[] = ['backlog', 'ready', 'in_progress', 'pending_user_info', 'complete'];

export default function TaskModal({ task, isNew, onClose, onSaved, allTasks = [] }: TaskModalProps) {
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [status, setStatus] = useState<TaskStatus>(task?.status || 'backlog');
  const [createdBy, setCreatedBy] = useState(task?.created_by || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newDepId, setNewDepId] = useState<string>('');
  const [depLoading, setDepLoading] = useState(false);

  const handleAddDependency = async () => {
    if (!task || !newDepId) return;
    const depId = parseInt(newDepId);
    if (isNaN(depId) || depId === task.id) return;
    
    setDepLoading(true);
    try {
      await api.dependencies.add(task.id, { depends_on_task_id: depId });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add dependency');
    } finally {
      setDepLoading(false);
      setNewDepId('');
    }
  };

  const handleRemoveDependency = async (depId: number) => {
    if (!task) return;
    setDepLoading(true);
    try {
      await api.dependencies.remove(task.id, depId);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove dependency');
    } finally {
      setDepLoading(false);
    }
  };

  const availableTasks = allTasks.filter((t) => t.id !== task?.id && 
    !(task?.dependencies?.some((d) => d.depends_on_task_id === t.id)));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (isNew) {
        await api.tasks.create({
          title: title.trim(),
          description: description.trim() || undefined,
          status,
          created_by: createdBy.trim() || undefined,
        });
      } else if (task) {
        await api.tasks.update(task.id, {
          title: title.trim(),
          description: description.trim() || undefined,
          status,
          created_by: createdBy.trim() || undefined,
        });
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isNew ? 'Create New Task' : 'Edit Task'}</h2>
          <button className="btn-close" onClick={onClose}>
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="error-message">{error}</div>}

            <div className="form-group">
              <label htmlFor="title">Title *</label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Task title"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Task description"
                rows={4}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="status">Status</label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                disabled={loading}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="createdBy">Created By</label>
              <input
                type="text"
                id="createdBy"
                value={createdBy}
                onChange={(e) => setCreatedBy(e.target.value)}
                placeholder="e.g., user, agent"
                disabled={loading}
              />
            </div>

            {!isNew && task && (
              <div className="form-group">
                <label>Dependencies</label>
                <div className="dependencies-list">
                  {task.dependencies && task.dependencies.length > 0 ? (
                    task.dependencies.map((dep) => (
                      <div key={dep.id} className="dependency-item">
                        <span>
                          {dep.depends_on_task.task_id || dep.depends_on_task_id}: {dep.depends_on_task.title}
                          {dep.depends_on_task.status !== 'complete' && (
                            <span className="dep-blocked-badge"> (blocked)</span>
                          )}
                        </span>
                        <button
                          type="button"
                          className="btn-remove-dep"
                          onClick={() => handleRemoveDependency(dep.id)}
                          disabled={depLoading}
                        >
                          &times;
                        </button>
                      </div>
                    ))
                  ) : (
                    <span className="no-dependencies">No dependencies</span>
                  )}
                </div>
                <div className="add-dependency">
                  <select
                    value={newDepId}
                    onChange={(e) => setNewDepId(e.target.value)}
                    disabled={depLoading || availableTasks.length === 0}
                  >
                    <option value="">Add dependency...</option>
                    {availableTasks.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.task_id || t.id}: {t.title}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={handleAddDependency}
                    disabled={depLoading || !newDepId}
                  >
                    Add
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Saving...' : isNew ? 'Create Task' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
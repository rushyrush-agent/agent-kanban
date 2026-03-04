import { useState } from 'react';
import { useTasks, usePromotionSuggestions } from './hooks';
import TaskBoard from './components/TaskBoard';
import CommentThread from './components/CommentThread';
import TaskModal from './components/TaskModal';
import type { Task } from './types';
import { STATUS_LABELS } from './types';
import { api } from './api';

export default function App() {
  const { tasks, loading, error, refetch } = useTasks();
  const { suggestions, dismissSuggestion } = usePromotionSuggestions();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const handleClose = () => {
    setSelectedTask(null);
    setEditingTask(null);
  };

  const handleEdit = () => {
    if (selectedTask) {
      setEditingTask(selectedTask);
    }
  };

  const handleDelete = async () => {
    if (selectedTask && confirm(`Delete "${selectedTask.title}"?`)) {
      await api.tasks.delete(selectedTask.id);
      setSelectedTask(null);
      refetch();
    }
  };

  const handleSaved = () => {
    setEditingTask(null);
    refetch();
  };

  if (loading) {
    return (
      <div className="app-loading">
        <div className="spinner"></div>
        <p>Loading tasks...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-error">
        <h2>Error loading tasks</h2>
        <p>{error}</p>
        <button onClick={refetch}>Retry</button>
      </div>
    );
  }

  return (
    <div className="app">
      <TaskBoard 
        tasks={tasks} 
        onTasksChange={refetch}
        onTaskSelect={setSelectedTask}
      />
      
      {selectedTask && (
        <div className="detail-panel-overlay" onClick={handleClose}>
          <div className="detail-panel" onClick={(e) => e.stopPropagation()}>
            <div className="detail-panel-header">
              <h2>{selectedTask.title}</h2>
              <button className="btn-close" onClick={handleClose}>
                &times;
              </button>
            </div>
            
            <div className="detail-panel-content">
              <div className="task-detail-section">
                <span className={`status-badge status-${selectedTask.status}`}>
                  {STATUS_LABELS[selectedTask.status]}
                </span>
                {selectedTask.created_by && (
                  <span className="task-created-by">Created by: {selectedTask.created_by}</span>
                )}
              </div>
              
              <div className="task-description-section">
                <p className={selectedTask.description ? '' : 'no-description'}>
                  {selectedTask.description || 'No description'}
                </p>
                
                <div className="task-actions">
                  <button className="btn-secondary" onClick={handleEdit}>
                    Edit
                  </button>
                  <button className="btn-danger" onClick={handleDelete}>
                    Delete
                  </button>
                </div>
              </div>
              
              <div className="comments-section">
                <CommentThread task={selectedTask} />
              </div>
            </div>
          </div>
        </div>
      )}

      {editingTask && (
        <TaskModal
          task={editingTask}
          isNew={false}
          onClose={() => setEditingTask(null)}
          onSaved={handleSaved}
          allTasks={tasks}
        />
      )}

      {suggestions.length > 0 && (
        <div className="promotion-suggestions">
          {suggestions.map((s) => {
            const blockedBy = tasks.find((t) => t.id === s.blocked_by);
            const task = tasks.find((t) => t.id === s.task_id);
            if (!blockedBy || !task) return null;
            return (
              <div key={`${s.task_id}-${s.blocked_by}`} className="promotion-suggestion">
                <span>
                  Task <strong>{blockedBy.task_id || blockedBy.id}</strong> is complete. 
                  Promote <strong>{task.task_id || task.id}</strong> to "Ready"?
                </span>
                <div className="suggestion-actions">
                  <button
                    className="btn-primary btn-small"
                    onClick={async () => {
                      await api.tasks.updateStatus(task.id, 'ready');
                      dismissSuggestion(s.task_id, s.blocked_by);
                      refetch();
                    }}
                  >
                    Promote
                  </button>
                  <button
                    className="btn-secondary btn-small"
                    onClick={() => dismissSuggestion(s.task_id, s.blocked_by)}
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
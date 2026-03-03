import { useState } from 'react';
import { useTasks } from './hooks';
import TaskBoard from './components/TaskBoard';
import CommentThread from './components/CommentThread';
import type { Task } from './types';

export default function App() {
  const { tasks, loading, error, refetch } = useTasks();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

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
        <div className="comment-panel-overlay" onClick={() => setSelectedTask(null)}>
          <div className="comment-panel" onClick={(e) => e.stopPropagation()}>
            <div className="comment-panel-header">
              <h2>{selectedTask.title}</h2>
              <button className="btn-close" onClick={() => setSelectedTask(null)}>
                &times;
              </button>
            </div>
            <div className="comment-panel-body">
              <CommentThread task={selectedTask} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
import { useState } from 'react';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import type { Task, TaskStatus } from '../types';
import { STATUS_LABELS } from '../types';
import { api } from '../api';
import TaskColumn from './TaskColumn';
import TaskModal from './TaskModal';

interface TaskBoardProps {
  tasks: Task[];
  onTasksChange: () => void;
  onTaskSelect?: (task: Task) => void;
}

const STATUSES: TaskStatus[] = ['backlog', 'ready', 'in_progress', 'pending_user_info', 'complete'];

export default function TaskBoard({ tasks, onTasksChange, onTaskSelect }: TaskBoardProps) {
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const tasksByStatus = STATUSES.reduce((acc, status) => {
    acc[status] = tasks.filter((t) => t.status === status);
    return acc;
  }, {} as Record<TaskStatus, Task[]>);

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const newStatus = destination.droppableId as TaskStatus;

    try {
      await api.tasks.updateStatus(parseInt(draggableId), newStatus);
      onTasksChange();
    } catch (error) {
      console.error('Failed to update task status:', error);
    }
  };

  const handleCreateTask = () => {
    setIsCreating(true);
    setEditingTask(null);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsCreating(false);
  };

  const handleCloseModal = () => {
    setEditingTask(null);
    setIsCreating(false);
  };

  const handleTaskSaved = () => {
    handleCloseModal();
    onTasksChange();
  };

  const handleTaskClick = (task: Task) => {
    onTaskSelect?.(task);
  };

  const handleDeleteTask = async (task: Task) => {
    try {
      await api.tasks.delete(task.id);
      onTasksChange();
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  return (
    <div className="task-board">
      <div className="task-board-header">
        <h1>OpenClaw Task Dashboard</h1>
        <button className="btn-primary" onClick={handleCreateTask}>
          + New Task
        </button>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="task-columns">
          {STATUSES.map((status) => (
            <TaskColumn
              key={status}
              status={status}
              label={STATUS_LABELS[status]}
              tasks={tasksByStatus[status]}
              onTaskClick={handleTaskClick}
              onTaskEdit={handleEditTask}
              onTaskDelete={handleDeleteTask}
            />
          ))}
        </div>
      </DragDropContext>

      {(isCreating || editingTask) && (
        <TaskModal
          task={editingTask}
          isNew={isCreating}
          onClose={handleCloseModal}
          onSaved={handleTaskSaved}
        />
      )}
    </div>
  );
}
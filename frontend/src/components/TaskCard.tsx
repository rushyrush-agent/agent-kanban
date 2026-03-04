import { Draggable } from '@hello-pangea/dnd';
import type { Task } from '../types';
import { STATUS_COLORS } from '../types';

interface TaskCardProps {
  task: Task;
  index: number;
  onClick: () => void;
}

export default function TaskCard({ task, index, onClick }: TaskCardProps) {
  const isBlocked = task.dependencies && task.dependencies.length > 0 && 
    task.dependencies.some((d) => d.depends_on_task.status !== 'complete');

  return (
    <Draggable draggableId={String(task.id)} index={index}>
      {(provided, snapshot) => (
        <div
          className={`task-card ${snapshot.isDragging ? 'dragging' : ''} ${isBlocked ? 'blocked' : ''}`}
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          style={{
            ...provided.draggableProps.style,
            borderLeftColor: isBlocked ? '#ef4444' : STATUS_COLORS[task.status],
          }}
        >
          <div className="task-card-content" onClick={onClick}>
            {task.task_id && (
              <span className="task-id">{task.task_id}</span>
            )}
            <h4 className="task-title">{task.title}</h4>
            {task.description && (
              <p className="task-description-preview">
                {task.description.length > 80
                  ? task.description.substring(0, 80) + '...'
                  : task.description}
              </p>
            )}
            {isBlocked && (
              <div className="task-blocked-indicator">
                <span className="blocked-icon">🔒</span>
                <span>Blocked by: {task.dependencies?.map((d) => d.depends_on_task.task_id || d.depends_on_task_id).join(', ')}</span>
              </div>
            )}
            {task.created_by && (
              <div className="task-card-footer">
                <span className="task-created-by">{task.created_by}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
}
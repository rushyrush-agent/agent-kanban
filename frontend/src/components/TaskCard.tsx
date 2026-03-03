import { Draggable } from '@hello-pangea/dnd';
import type { Task } from '../types';
import { STATUS_COLORS } from '../types';

interface TaskCardProps {
  task: Task;
  index: number;
  onClick: () => void;
  onEdit: () => void;
}

export default function TaskCard({ task, index, onClick, onEdit }: TaskCardProps) {
  return (
    <Draggable draggableId={String(task.id)} index={index}>
      {(provided, snapshot) => (
        <div
          className={`task-card ${snapshot.isDragging ? 'dragging' : ''}`}
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          style={{
            ...provided.draggableProps.style,
            borderLeftColor: STATUS_COLORS[task.status],
          }}
        >
          <div className="task-card-content" onClick={onClick}>
            <h4 className="task-title">{task.title}</h4>
            {task.description && (
              <p className="task-description-preview">
                {task.description.length > 80
                  ? task.description.substring(0, 80) + '...'
                  : task.description}
              </p>
            )}
            <div className="task-card-footer">
              {task.created_by && (
                <span className="task-created-by">{task.created_by}</span>
              )}
              <button
                className="btn-edit"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
              >
                Edit
              </button>
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
}
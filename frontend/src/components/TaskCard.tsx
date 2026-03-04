import { Draggable } from '@hello-pangea/dnd';
import type { Task } from '../types';
import { STATUS_COLORS } from '../types';

interface TaskCardProps {
  task: Task;
  index: number;
  onClick: () => void;
}

export default function TaskCard({ task, index, onClick }: TaskCardProps) {
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
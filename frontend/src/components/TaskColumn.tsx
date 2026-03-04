import { Droppable } from '@hello-pangea/dnd';
import type { Task, TaskStatus } from '../types';
import { STATUS_COLORS } from '../types';
import TaskCard from './TaskCard';

interface TaskColumnProps {
  status: TaskStatus;
  label: string;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onTaskEdit: (task: Task) => void;
  onTaskDelete: (task: Task) => void;
}

export default function TaskColumn({
  status,
  label,
  tasks,
  onTaskClick,
  onTaskEdit,
  onTaskDelete,
}: TaskColumnProps) {
  return (
    <div className="task-column">
      <div className="task-column-header" style={{ borderTopColor: STATUS_COLORS[status] }}>
        <h3>{label}</h3>
        <span className="task-count">{tasks.length}</span>
      </div>
      <Droppable droppableId={status}>
        {(provided, snapshot) => (
          <div
            className={`task-column-content ${snapshot.isDraggingOver ? 'dragging-over' : ''}`}
            ref={provided.innerRef}
            {...provided.droppableProps}
          >
            {tasks.map((task, index) => (
              <TaskCard
                key={task.id}
                task={task}
                index={index}
                onClick={() => onTaskClick(task)}
                onEdit={() => onTaskEdit(task)}
                onDelete={() => onTaskDelete(task)}
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}
import { DragEvent } from 'react';
import { Task, Priority } from '../types';
import { Calendar, Trash2, Edit3, AlertCircle } from 'lucide-react';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onDragStart: (e: DragEvent, taskId: string) => void;
}

export default function TaskCard({
  task,
  onEdit,
  onDelete,
  onDragStart,
}: TaskCardProps) {
  const getPriorityClasses = (p?: Priority) => {
    switch (p) {
      case 'Critical':
        return {
          bg: 'bg-rose-500/5 hover:bg-rose-500/[0.08] border-rose-500/20 hover:border-rose-500/30',
          badge: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
          accent: 'bg-rose-500',
        };
      case 'High':
        return {
          bg: 'bg-amber-500/5 hover:bg-amber-500/[0.08] border-amber-500/20 hover:border-amber-500/30',
          badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
          accent: 'bg-amber-500',
        };
      case 'Medium':
        return {
          bg: 'bg-cyan-500/5 hover:bg-cyan-500/[0.08] border-cyan-500/20 hover:border-cyan-500/30',
          badge: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
          accent: 'bg-cyan-500',
        };
      case 'Low':
      default:
        return {
          bg: 'bg-teal-500/5 hover:bg-teal-500/[0.08] border-teal-500/20 hover:border-teal-500/30',
          badge: 'bg-teal-500/15 text-teal-300 border-teal-500/30',
          accent: 'bg-teal-500',
        };
    }
  };

  const priorityStyle = getPriorityClasses(task.priority_tags);

  // Check if task is overdue
  const isOverdue = () => {
    if (!task.due_date || task.status === 'Done') return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(task.due_date);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate < today;
  };

  const formattedDueDate = () => {
    if (!task.due_date) return '';
    try {
      const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
      return new Date(task.due_date).toLocaleDateString('en-US', options);
    } catch {
      return task.due_date;
    }
  };

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, task.id)}
      className={`group relative flex flex-col p-4 bg-white/[0.04] backdrop-blur-md border ${priorityStyle.bg} rounded-xl hover:shadow-xl transition-all active:cursor-grabbing select-none cursor-grab duration-200`}
    >
      {/* Accent Priority Line */}
      <div className={`absolute left-0 top-3 bottom-3 w-1.5 rounded-r ${priorityStyle.accent}`} />

      <div className="pl-2">
        {/* Header containing tags */}
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <span className={`px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded border ${priorityStyle.badge}`}>
            {task.priority_tags || 'Low'}
          </span>

          <div className="flex items-center gap-1.5 md:opacity-0 md:group-hover:opacity-100 opacity-100 transition-opacity">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(task);
              }}
              className="text-slate-400 hover:text-white p-1 hover:bg-white/10 rounded transition-colors"
              title="Edit Task"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(task.id);
              }}
              className="text-slate-400 hover:text-rose-400 p-1 hover:bg-white/10 rounded transition-colors"
              title="Delete Task"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Task Title */}
        <h4 className="font-semibold text-sm text-slate-100 mb-1.5 line-clamp-2 leading-snug group-hover:text-white transition-colors">
          {task.title}
        </h4>

        {/* Task Description */}
        {task.description && (
          <p className="text-xs text-slate-400 line-clamp-2 leading-normal mb-3 whitespace-pre-wrap">
            {task.description}
          </p>
        )}

        {/* Due Date Alarm / Info */}
        {task.due_date && (
          <div className="flex items-center gap-1.5 mt-auto pt-2 border-t border-white/5">
            {isOverdue() ? (
              <div className="flex items-center gap-1 text-[10px] font-semibold text-rose-400 animate-pulse bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">
                <AlertCircle className="w-3 h-3 text-rose-400" />
                <span>Overdue: {formattedDueDate()}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-[10px] text-slate-400">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>Due {formattedDueDate()}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

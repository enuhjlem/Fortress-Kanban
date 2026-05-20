import { useState, useEffect, FormEvent } from 'react';
import { X, Calendar, AlertCircle } from 'lucide-react';
import { Task, Priority, Status } from '../types';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (taskData: {
    title: string;
    description: string;
    due_date: string | null;
    priority_tags: Priority;
    status: Status;
  }) => void;
  title: string;
  initialTask?: Task | null;
  defaultStatus?: Status;
}

const PRIORITIES: Priority[] = ['Low', 'Medium', 'High', 'Critical'];
const STATUSES: Status[] = ['To Do', 'In Progress', 'Done'];

export default function TaskModal({
  isOpen,
  onClose,
  onSubmit,
  title,
  initialTask = null,
  defaultStatus = 'To Do',
}: TaskModalProps) {
  const [taskTitle, setTaskTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<Priority>('Low');
  const [status, setStatus] = useState<Status>('To Do');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (initialTask) {
        setTaskTitle(initialTask.title || '');
        setDescription(initialTask.description || '');
        setDueDate(initialTask.due_date || '');
        setPriority(initialTask.priority_tags || 'Low');
        setStatus(initialTask.status || 'To Do');
      } else {
        setTaskTitle('');
        setDescription('');
        setDueDate('');
        setPriority('Low');
        setStatus(defaultStatus);
      }
      setError('');
    }
  }, [isOpen, initialTask, defaultStatus]);

  if (!isOpen) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmedTitle = taskTitle.trim();
    if (!trimmedTitle) {
      setError('Task title is required');
      return;
    }
    if (trimmedTitle.length > 100) {
      setError('Title must be 100 characters or less');
      return;
    }
    if (description.length > 2000) {
      setError('Description must be 2000 characters or less');
      return;
    }

    onSubmit({
      title: trimmedTitle,
      description: description.trim(),
      due_date: dueDate || null,
      priority_tags: priority,
      status,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4">
      <div className="w-full max-w-lg bg-white/[0.04] border border-white/10 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h3 className="font-semibold text-lg text-white">{title}</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="flex items-start gap-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 h-auto rounded-lg text-xs font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="task-title" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Task Title *
              </label>
              <input
                id="task-title"
                type="text"
                value={taskTitle}
                onChange={(e) => {
                  setTaskTitle(e.target.value);
                  if (error) setError('');
                }}
                placeholder="What needs to be done?"
                className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg text-sm text-white placeholder-white/20 outline-none transition-all"
                autoFocus
              />
            </div>

            <div>
              <label htmlFor="task-desc" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Description
              </label>
              <textarea
                id="task-desc"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add some details about this task..."
                className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg text-sm text-white placeholder-white/20 outline-none transition-all resize-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Priority
                </label>
                <div className="flex gap-1 bg-white/5 p-1 border border-white/10 rounded-lg">
                  {PRIORITIES.map((p) => {
                    const isSelected = priority === p;
                    let colorClass = 'text-slate-400 hover:text-white';
                    if (isSelected) {
                      if (p === 'Low') colorClass = 'bg-white/10 text-teal-400 font-bold';
                      else if (p === 'Medium') colorClass = 'bg-white/10 text-cyan-400 font-bold';
                      else if (p === 'High') colorClass = 'bg-white/10 text-amber-400 font-bold';
                      else if (p === 'Critical') colorClass = 'bg-white/10 text-rose-400 font-bold';
                    }
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPriority(p)}
                        className={`flex-1 text-center py-1.5 px-2 rounded-md text-xs transition-colors cursor-pointer ${colorClass}`}
                      >
                        {p}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label htmlFor="task-status" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Status (Column)
                </label>
                <select
                  id="task-status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as Status)}
                  className="w-full px-3 py-2.5 bg-white/5 border border-white/10 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg text-xs text-white outline-none transition-all cursor-pointer"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s} className="bg-slate-905 text-slate-900 font-semibold">
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="task-due" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Due Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
                <input
                  id="task-due"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-white/5 border border-white/10 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg text-sm text-white outline-none transition-all cursor-pointer"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-white/10 flex justify-end gap-3 font-semibold">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-500 hover:bg-indigo-450 active:scale-[0.98] rounded-lg transition-all shadow-lg shadow-indigo-500/20 cursor-pointer"
            >
              Save Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

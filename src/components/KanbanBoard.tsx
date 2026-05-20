import { useState, DragEvent } from 'react';
import { Board, Task, Status } from '../types';
import TaskCard from './TaskCard';
import { Kanban, Plus, Search, HelpCircle, CheckCircle2, CircleDollarSign, BarChart2, CheckCheck } from 'lucide-react';

interface KanbanBoardProps {
  board: Board;
  tasks: Task[];
  onAddTask: (status: Status) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onMoveTask: (taskId: string, newStatus: Status) => void;
}

const COLUMNS: Status[] = ['To Do', 'In Progress', 'Done'];

export default function KanbanBoard({
  board,
  tasks,
  onAddTask,
  onEditTask,
  onDeleteTask,
  onMoveTask,
}: KanbanBoardProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [dragOverColumn, setDragOverColumn] = useState<Status | null>(null);

  // Filter tasks based on search query
  const filteredTasks = tasks.filter((task) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      task.title.toLowerCase().includes(query) ||
      (task.description || '').toLowerCase().includes(query) ||
      (task.priority_tags || '').toLowerCase().includes(query)
    );
  });

  // Calculate task counts
  const getCountByStatus = (status: Status) => {
    return tasks.filter((t) => t.status === status).length;
  };

  const getFilteredCountByStatus = (status: Status) => {
    return filteredTasks.filter((t) => t.status === status).length;
  };

  // Drag and Drop Handlers
  const handleDragStart = (e: DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: DragEvent, status: Status) => {
    e.preventDefault();
    if (dragOverColumn !== status) {
      setDragOverColumn(status);
    }
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = (e: DragEvent, status: Status) => {
    e.preventDefault();
    setDragOverColumn(null);
    const taskId = e.dataTransfer.getData('text/plain');
    if (taskId) {
      const taskObj = tasks.find((t) => t.id === taskId);
      if (taskObj && taskObj.status !== status) {
        onMoveTask(taskId, status);
      }
    }
  };

  // Calculate percentage progress metrics for stats header
  const totalTasks = tasks.length;
  const completedTasks = getCountByStatus('Done');
  const percentComplete = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="flex-1 flex flex-col h-full bg-transparent min-w-0">
      {/* Search and Metadata Header */}
      <div className="h-16 border-b border-white/10 px-8 flex items-center justify-between gap-4 shrink-0 bg-white/[0.03] backdrop-blur-md">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-white tracking-tight truncate max-w-xs md:max-w-md">
            {board.name}
          </h2>
          <div className="hidden sm:flex items-center gap-1.5 bg-white/5 border border-white/10 rounded px-2.5 py-0.5 text-[10px] text-slate-300 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></span>
            <span>SECURE VAULT</span>
          </div>
        </div>

        {/* Real-time Task Search Input */}
        <div className="relative w-full max-w-xs select-none">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            id="search-tasks"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search cards, priorities..."
            className="w-full pl-9 pr-4 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white placeholder-white/30 focus:outline-none focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/80 transition-all"
          />
        </div>
      </div>

      {/* Mini Stats Bar */}
      <div className="px-8 py-3 bg-white/[0.01] border-b border-white/5 flex items-center justify-between text-xs text-slate-400 shrink-0 font-mono backdrop-blur-sm">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-slate-500">TOTAL:</span>
            <span className="font-semibold text-slate-200">{totalTasks}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-teal-400/80">TO DO:</span>
            <span className="font-semibold text-teal-400">{getCountByStatus('To Do')}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-cyan-400/80">IN PROGRESS:</span>
            <span className="font-semibold text-cyan-400">{getCountByStatus('In Progress')}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-emerald-400/80">DONE:</span>
            <span className="font-semibold text-emerald-400">{getCountByStatus('Done')}</span>
          </div>
        </div>

        {totalTasks > 0 && (
          <div className="hidden md:flex items-center gap-3">
            <span className="text-slate-500">UTILITY COMPLETION RATE:</span>
            <div className="w-24 bg-white/10 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-indigo-400 h-full rounded-full transition-all duration-300"
                style={{ width: `${percentComplete}%` }}
              />
            </div>
            <span className="font-semibold text-indigo-400">{percentComplete}%</span>
          </div>
        )}
      </div>

      {/* Three Columns Container */}
      <div className="flex-1 overflow-x-auto p-8 min-h-0 select-none">
        <div className="flex gap-6 h-full min-w-[760px] max-w-7xl mx-auto">
          {COLUMNS.map((columnStatus) => {
            const isDraggingOver = dragOverColumn === columnStatus;
            const columnTasks = filteredTasks.filter((t) => t.status === columnStatus);
            const totalInCol = getCountByStatus(columnStatus);
            const filteredInCol = getFilteredCountByStatus(columnStatus);

            let headerBorder = 'border-indigo-500/20';
            let bgAccent = 'bg-indigo-500';
            if (columnStatus === 'In Progress') {
              headerBorder = 'border-cyan-500/20';
              bgAccent = 'bg-cyan-500';
            } else if (columnStatus === 'Done') {
              headerBorder = 'border-emerald-500/20';
              bgAccent = 'bg-emerald-500';
            }

            return (
              <div
                key={columnStatus}
                onDragOver={(e) => handleDragOver(e, columnStatus)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, columnStatus)}
                className={`flex-1 flex flex-col bg-black/20 backdrop-blur-xl border border-white/5 rounded-2xl transition-all duration-200 min-h-0 ${
                  isDraggingOver
                    ? 'border-indigo-400/50 bg-white/10 scale-[1.005]'
                    : 'border-white/5'
                }`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/10">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-2 h-2 rounded-full ${bgAccent}`} />
                    <h3 className="font-semibold text-sm text-slate-100">
                      {columnStatus}
                    </h3>
                    <span className="bg-white/10 text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border border-white/5">
                      {searchQuery ? `${filteredInCol}/${totalInCol}` : totalInCol}
                    </span>
                  </div>

                  <button
                    onClick={() => onAddTask(columnStatus)}
                    className="text-slate-400 hover:text-white p-1 hover:bg-slate-800/80 rounded-lg transition-colors cursor-pointer"
                    title={`Add Task to ${columnStatus}`}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Column Tasks Body */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
                  {columnTasks.length === 0 ? (
                    <div className="h-28 flex flex-col items-center justify-center border border-dashed border-slate-800/50 rounded-xl bg-slate-950/10 text-center px-4">
                      {searchQuery ? (
                        <p className="text-[11px] text-slate-600">No match records.</p>
                      ) : (
                        <>
                          <p className="text-[11px] text-slate-600 mb-2">No active tasks.</p>
                          <button
                            onClick={() => onAddTask(columnStatus)}
                            className="text-[10px] text-indigo-400/80 hover:text-indigo-400 hover:underline transition-colors"
                          >
                            Add Task +
                          </button>
                        </>
                      )}
                    </div>
                  ) : (
                    columnTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onEdit={onEditTask}
                        onDelete={onDeleteTask}
                        onDragStart={handleDragStart}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

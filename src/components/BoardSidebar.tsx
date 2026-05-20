import { Board } from '../types';
import { Kanban, Plus, LogOut, ChevronRight, Settings, Trash2, Edit2, User } from 'lucide-react';
import { auth } from '../firebase';

interface BoardSidebarProps {
  boards: Board[];
  activeBoardId: string | null;
  onSelectBoard: (boardId: string) => void;
  onAddBoard: () => void;
  onRenameBoard: (board: Board) => void;
  onDeleteBoard: (boardId: string) => void;
  onSignOut: () => void;
}

export default function BoardSidebar({
  boards,
  activeBoardId,
  onSelectBoard,
  onAddBoard,
  onRenameBoard,
  onDeleteBoard,
  onSignOut,
}: BoardSidebarProps) {
  const currentUser = auth.currentUser;

  return (
    <div className="w-64 border-r border-white/10 bg-white/5 backdrop-blur-md flex flex-col h-full shrink-0">
      {/* Brand Header */}
      <div className="h-16 border-b border-white/10 flex items-center px-6 gap-3 select-none shrink-0">
        <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30 shadow-lg shadow-indigo-500/10">
          <Kanban className="w-4 h-4 text-indigo-400" />
        </div>
        <span className="font-bold tracking-tight text-white text-md">
          Fortress Board
        </span>
      </div>

      {/* Boards Section */}
      <div className="flex-1 overflow-y-auto px-4 py-6 flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-4 px-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            My Boards ({boards.length})
          </span>
          <button
            onClick={onAddBoard}
            className="text-slate-400 hover:text-white hover:bg-white/10 p-1 rounded-md transition-colors cursor-pointer"
            title="Create Board"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {boards.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 px-4 text-center border border-dashed border-white/10 rounded-xl bg-white/[0.02]">
            <span className="text-xs text-slate-505 mb-3 leading-normal">
              No boards created yet. Click below to begin.
            </span>
            <button
              onClick={onAddBoard}
              className="flex items-center gap-1.5 py-1.5 px-3 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 font-medium rounded-lg text-xs text-indigo-400 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Board</span>
            </button>
          </div>
        ) : (
          <div className="space-y-1">
            {boards.map((board) => {
              const isActive = board.id === activeBoardId;
              return (
                <div
                  key={board.id}
                  className={`group flex items-center justify-between py-2 px-3.5 rounded-lg border text-sm transition-all duration-150 select-none ${
                    isActive
                      ? 'bg-white/10 border-white/20 text-white shadow-md'
                      : 'border-transparent text-slate-400 hover:text-slate-100 hover:bg-white/5'
                  }`}
                >
                  <button
                    onClick={() => onSelectBoard(board.id)}
                    className="flex-1 flex items-center gap-2.5 text-left font-medium overflow-hidden cursor-pointer"
                  >
                    <ChevronRight className={`w-3.5 h-3.5 shrink-0 transition-transform ${isActive ? 'rotate-90 text-indigo-400' : 'text-slate-600'}`} />
                    <span className="truncate">{board.name}</span>
                  </button>

                  {/* Inline board controls */}
                  <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity ml-2 shrink-0">
                    <button
                      onClick={() => onRenameBoard(board)}
                      className="text-slate-400 hover:text-white p-0.5 hover:bg-white/10 rounded transition-colors cursor-pointer"
                      title="Rename Board"
                    >
                      <Edit2 className="w-3" />
                    </button>
                    <button
                      onClick={() => onDeleteBoard(board.id)}
                      className="text-slate-400 hover:text-rose-400 p-0.5 hover:bg-white/10 rounded transition-colors cursor-pointer"
                      title="Delete Board"
                    >
                      <Trash2 className="w-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* User Session Footer */}
      <div className="border-t border-white/10 bg-white/5 p-4 shrink-0">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 overflow-hidden">
            {currentUser?.photoURL ? (
              <img
                src={currentUser.photoURL}
                alt={currentUser.displayName || 'User'}
                className="w-8.5 h-8.5 rounded-full border border-white/10"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-8.5 h-8.5 rounded-full bg-white/10 flex items-center justify-center border border-white/15">
                <User className="w-4 h-4 text-slate-400" />
              </div>
            )}
            <div className="flex flex-col overflow-hidden select-none">
              <span className="text-xs font-semibold text-white truncate leading-tight">
                {currentUser?.displayName || 'Auth User'}
              </span>
              <span className="text-[10px] font-mono text-slate-400 truncate leading-tight mt-0.5 opacity-80">
                {currentUser?.email || 'authenticated'}
              </span>
            </div>
          </div>

          <button
            onClick={onSignOut}
            className="text-slate-400 hover:text-rose-400 hover:bg-white/10 p-2 rounded-lg transition-colors cursor-pointer"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

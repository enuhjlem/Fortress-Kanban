import { useState, useEffect, FormEvent } from 'react';
import { X } from 'lucide-react';

interface BoardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string) => void;
  title: string;
  initialValue?: string;
}

export default function BoardModal({
  isOpen,
  onClose,
  onSubmit,
  title,
  initialValue = '',
}: BoardModalProps) {
  const [boardName, setBoardName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setBoardName(initialValue);
      setError('');
    }
  }, [isOpen, initialValue]);

  if (!isOpen) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = boardName.trim();
    if (!trimmed) {
      setError('Board name is required');
      return;
    }
    if (trimmed.length > 100) {
      setError('Board name must be 100 characters or less');
      return;
    }
    onSubmit(trimmed);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4">
      <div className="w-full max-w-md bg-white/[0.04] border border-white/10 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h3 className="font-semibold text-lg text-white">{title}</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="board-name" className="block text-xs font-semibold uppercase tracking-wider text-slate-450 mb-2">
                Board Name
              </label>
              <input
                id="board-name"
                type="text"
                value={boardName}
                onChange={(e) => {
                  setBoardName(e.target.value);
                  if (error) setError('');
                }}
                placeholder="e.g. Project Delivery, Marketing Sprint"
                className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg text-sm text-white placeholder-white/20 outline-none transition-all"
                autoFocus
              />
              {error && (
                <p className="mt-2 text-xs text-rose-400 font-medium">
                  {error}
                </p>
              )}
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3.5">
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
              Save Board
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

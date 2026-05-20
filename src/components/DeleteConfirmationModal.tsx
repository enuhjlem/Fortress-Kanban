import { AnimatePresence, motion } from 'motion/react';
import { AlertTriangle, X } from 'lucide-react';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  taskTitle: string;
}

export default function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  taskTitle,
}: DeleteConfirmationModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div id="delete-confirmation-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            id="delete-confirmation-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />

          {/* Modal Content */}
          <motion.div
            id="delete-confirmation-card"
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', duration: 0.3 }}
            className="relative w-full max-w-md bg-slate-905 border border-white/10 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-2xl z-10"
          >
            {/* Header / Dismiss */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-500" />
                <h3 className="font-semibold text-lg text-white">Delete Task</h3>
              </div>
              <button
                id="btn-close-delete-modal"
                onClick={onClose}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Description Body */}
            <div className="p-6">
              <p className="text-sm text-slate-300 mb-4">
                Are you sure you want to permanently delete the task:
              </p>
              <div id="delete-task-title-banner" className="bg-white/5 border border-white/10 px-4 py-3 rounded-lg mb-6">
                <p className="text-sm font-medium font-sans text-rose-200 break-words">{taskTitle}</p>
              </div>
              <p className="text-xs text-slate-400">
                This action cannot be undone. All notes, status, and details for this task will be permanently removed.
              </p>
            </div>

            {/* Actions Footer */}
            <div className="flex justify-end gap-3 px-6 py-4 bg-white/[0.02] border-t border-white/5">
              <button
                id="btn-cancel-delete"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                id="btn-confirm-delete"
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 active:scale-[0.98] rounded-lg transition-all shadow-lg shadow-rose-500/20 cursor-pointer"
              >
                Delete Task
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

import { useEffect, useState } from 'react';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocFromServer,
  writeBatch,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db, handleFirestoreError } from './firebase';
import { Board, Task, Status, Priority, OperationType } from './types';
import AuthScreen from './components/AuthScreen';
import BoardSidebar from './components/BoardSidebar';
import KanbanBoard from './components/KanbanBoard';
import BoardModal from './components/BoardModal';
import TaskModal from './components/TaskModal';
import DeleteConfirmationModal from './components/DeleteConfirmationModal';
import { Kanban, Sparkles, Loader2, AlertCircle, ShieldAlert } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [boards, setBoards] = useState<Board[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeBoardId, setActiveBoardId] = useState<string | null>(null);
  const [workspaceLoading, setWorkspaceLoading] = useState(false);

  // Modal Dialog States
  const [isBoardModalOpen, setIsBoardModalOpen] = useState(false);
  const [boardModalTitle, setBoardModalTitle] = useState('Create Board');
  const [selectedBoardToEdit, setSelectedBoardToEdit] = useState<Board | null>(null);

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskModalTitle, setTaskModalTitle] = useState('Create Task');
  const [selectedTaskToEdit, setSelectedTaskToEdit] = useState<Task | null>(null);
  const [defaultTaskStatus, setDefaultTaskStatus] = useState<Status>('To Do');

  // Delete Confirmation Modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [taskMarkedForDeletion, setTaskMarkedForDeletion] = useState<Task | null>(null);

  // Error Alert Banner State
  const [globalError, setGlobalError] = useState<string | null>(null);

  // 1. Initialise connection test as per Skill instruction
  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error('Please check your Firebase configuration or network.');
        }
      }
    }
    testConnection();
  }, []);

  // 2. Track Authentication States
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthLoading(false);
      setGlobalError(null);
      if (!firebaseUser) {
        setBoards([]);
        setTasks([]);
        setActiveBoardId(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // 3. Real-time Synchronization: User Boards and Tasks
  useEffect(() => {
    if (!user) return;

    setWorkspaceLoading(true);

    // Sync Boards where user_id matches
    const boardsQuery = query(collection(db, 'boards'), where('user_id', '==', user.uid));
    const unsubscribeBoards = onSnapshot(
      boardsQuery,
      (snapshot) => {
        const boardList: Board[] = [];
        snapshot.forEach((docSnap) => {
          boardList.push(docSnap.data() as Board);
        });

        // Simple sort by created_at or default fallback
        boardList.sort((a, b) => {
          const tA = a.created_at?.seconds || 0;
          const tB = b.created_at?.seconds || 0;
          return tA - tB;
        });

        setBoards(boardList);

        // Auto selection trigger if none selected or the active board gets deleted
        if (boardList.length > 0) {
          if (!activeBoardId || !boardList.some((b) => b.id === activeBoardId)) {
            setActiveBoardId(boardList[0].id);
          }
        } else {
          setActiveBoardId(null);
        }
        setWorkspaceLoading(false);
      },
      (error) => {
        setWorkspaceLoading(false);
        try {
          handleFirestoreError(error, OperationType.LIST, 'boards');
        } catch (err: any) {
          setGlobalError(err.message);
        }
      }
    );

    // Sync Tasks where user_id matches
    const tasksQuery = query(collection(db, 'tasks'), where('user_id', '==', user.uid));
    const unsubscribeTasks = onSnapshot(
      tasksQuery,
      (snapshot) => {
        const taskList: Task[] = [];
        snapshot.forEach((docSnap) => {
          taskList.push(docSnap.data() as Task);
        });
        setTasks(taskList);
      },
      (error) => {
        try {
          handleFirestoreError(error, OperationType.LIST, 'tasks');
        } catch (err: any) {
          setGlobalError(err.message);
        }
      }
    );

    return () => {
      unsubscribeBoards();
      unsubscribeTasks();
    };
  }, [user, activeBoardId]);

  // Logout utility
  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (err: any) {
      setGlobalError(err.message || 'Logout failed.');
    }
  };

  // ==========================================
  // BOARDS CRUD OPERATION HANDLERS
  // ==========================================
  const handleAddBoardTrigger = () => {
    setSelectedBoardToEdit(null);
    setBoardModalTitle('Create Board');
    setIsBoardModalOpen(true);
  };

  const handleRenameBoardTrigger = (board: Board) => {
    setSelectedBoardToEdit(board);
    setBoardModalTitle('Rename Board');
    setIsBoardModalOpen(true);
  };

  const handleBoardModalSubmit = async (name: string) => {
    if (!user) return;
    setGlobalError(null);

    try {
      if (selectedBoardToEdit) {
        // Update Action - strict rules diff allowed
        const boardRef = doc(db, 'boards', selectedBoardToEdit.id);
        await updateDoc(boardRef, { name });
      } else {
        // Create Action - generates schema compliant target
        const newDocRef = doc(collection(db, 'boards'));
        const newBoard: Board = {
          id: newDocRef.id,
          user_id: user.uid,
          name,
          created_at: serverTimestamp()
        };
        await setDoc(newDocRef, newBoard);
        setActiveBoardId(newDocRef.id);
      }
    } catch (err: any) {
      try {
        handleFirestoreError(err, selectedBoardToEdit ? OperationType.UPDATE : OperationType.CREATE, 'boards');
      } catch (formattedErr: any) {
        setGlobalError(formattedErr.message);
      }
    }
  };

  const handleDeleteBoard = async (boardId: string) => {
    if (!user) return;
    if (!confirm('Are you absolutely sure you want to delete this board and all of its tasks? This action is irreversible.')) {
      return;
    }
    setGlobalError(null);

    try {
      // 1. Delete all tasks associated to this board
      const tasksToDelete = tasks.filter((t) => t.board_id === boardId);
      
      if (tasksToDelete.length > 0) {
        const batch = writeBatch(db);
        tasksToDelete.forEach((task) => {
          batch.delete(doc(db, 'tasks', task.id));
        });
        await batch.commit();
      }

      // 2. Delete the board itself
      await deleteDoc(doc(db, 'boards', boardId));

      // 3. Reset active board
      if (activeBoardId === boardId) {
        setActiveBoardId(null);
      }
    } catch (err: any) {
      try {
        handleFirestoreError(err, OperationType.DELETE, `boards/${boardId}`);
      } catch (formattedErr: any) {
        setGlobalError(formattedErr.message);
      }
    }
  };

  // ==========================================
  // TASKS CRUD OPERATION HANDLERS
  // ==========================================
  const handleAddTaskTrigger = (status: Status) => {
    setSelectedTaskToEdit(null);
    setDefaultTaskStatus(status);
    setTaskModalTitle(`Add Task to ${status}`);
    setIsTaskModalOpen(true);
  };

  const handleEditTaskTrigger = (task: Task) => {
    setSelectedTaskToEdit(task);
    setTaskModalTitle('Edit Task Details');
    setIsTaskModalOpen(true);
  };

  const handleTaskModalSubmit = async (taskData: {
    title: string;
    description: string;
    due_date: string | null;
    priority_tags: Priority;
    status: Status;
  }) => {
    if (!user || !activeBoardId) return;
    setGlobalError(null);

    try {
      if (selectedTaskToEdit) {
        // Update Action (Diff checks configured)
        const taskRef = doc(db, 'tasks', selectedTaskToEdit.id);
        await updateDoc(taskRef, {
          title: taskData.title,
          description: taskData.description || '',
          due_date: taskData.due_date,
          priority_tags: taskData.priority_tags,
          status: taskData.status,
        });
      } else {
        // Create Action (Relational checks verify parents)
        const newDocRef = doc(collection(db, 'tasks'));
        const newTask: Task = {
          id: newDocRef.id,
          user_id: user.uid,
          board_id: activeBoardId,
          status: taskData.status,
          title: taskData.title,
          description: taskData.description || '',
          due_date: taskData.due_date,
          priority_tags: taskData.priority_tags,
          created_at: serverTimestamp()
        };
        await setDoc(newDocRef, newTask);
      }
    } catch (err: any) {
      try {
        handleFirestoreError(err, selectedTaskToEdit ? OperationType.UPDATE : OperationType.CREATE, 'tasks');
      } catch (formattedErr: any) {
        setGlobalError(formattedErr.message);
      }
    }
  };

  const handleMoveTask = async (taskId: string, newStatus: Status) => {
    if (!user) return;
    setGlobalError(null);

    try {
      const taskRef = doc(db, 'tasks', taskId);
      await updateDoc(taskRef, {
        status: newStatus,
      });
    } catch (err: any) {
      try {
        handleFirestoreError(err, OperationType.UPDATE, `tasks/${taskId}`);
      } catch (formattedErr: any) {
        setGlobalError(formattedErr.message);
      }
    }
  };

  const handleDeleteTask = (taskId: string) => {
    if (!user) return;
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    setTaskMarkedForDeletion(task);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteTask = async () => {
    if (!user || !taskMarkedForDeletion) return;
    const taskId = taskMarkedForDeletion.id;
    setGlobalError(null);

    try {
      await deleteDoc(doc(db, 'tasks', taskId));
    } catch (err: any) {
      try {
        handleFirestoreError(err, OperationType.DELETE, `tasks/${taskId}`);
      } catch (formattedErr: any) {
        setGlobalError(formattedErr.message);
      }
    } finally {
      setTaskMarkedForDeletion(null);
    }
  };

  // ==========================================
  // RENDERING SCENARIOS
  // ==========================================
  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-transparent">
        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mb-4" />
        <p className="text-xs text-slate-500 font-mono">ESTABLISHING FIREBASE CONNECTION...</p>
      </div>
    );
  }

  // Not authenticated? Show secure portal
  if (!user) {
    return <AuthScreen onSignInError={(errMsg) => setGlobalError(errMsg)} />;
  }

  const activeBoard = boards.find((b) => b.id === activeBoardId) || null;
  const activeBoardTasks = tasks.filter((t) => t.board_id === activeBoardId);

  return (
    <div className="flex h-screen w-screen bg-transparent text-slate-100 overflow-hidden font-sans">
      
      {/* Sidebar Navigation */}
      <BoardSidebar
        boards={boards}
        activeBoardId={activeBoardId}
        onSelectBoard={setActiveBoardId}
        onAddBoard={handleAddBoardTrigger}
        onRenameBoard={handleRenameBoardTrigger}
        onDeleteBoard={handleDeleteBoard}
        onSignOut={handleSignOut}
      />

      {/* Main Workspace Frame */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        
        {/* Real-time Global Security Alarm / Error Message */}
        {globalError && (
          <div className="absolute top-4 right-4 z-40 max-w-sm bg-rose-950 border border-rose-800 text-rose-300 p-4 rounded-xl shadow-xl flex items-start gap-3 select-none animate-in fade-in duration-200">
            <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wide block">Security Event Captured</span>
              <p className="text-[10px] font-mono leading-relaxed break-words bg-slate-950/60 p-2 rounded border border-rose-900/40">
                {globalError}
              </p>
              <button
                onClick={() => setGlobalError(null)}
                className="text-[10px] text-rose-400/80 hover:text-white underline mt-1 block cursor-pointer"
              >
                Acknowledge event
              </button>
            </div>
          </div>
        )}

        {workspaceLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center">
            <Loader2 className="w-6 h-6 text-indigo-400 animate-spin mb-3" />
            <span className="text-xs text-slate-500 font-mono">LOADING VAULT STATUS...</span>
          </div>
        ) : activeBoard ? (
          <KanbanBoard
            board={activeBoard}
            tasks={activeBoardTasks}
            onAddTask={handleAddTaskTrigger}
            onEditTask={handleEditTaskTrigger}
            onDeleteTask={handleDeleteTask}
            onMoveTask={handleMoveTask}
          />
        ) : (
          /* Empty Workspace Welcome Screen */
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center select-none">
            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shadow-lg mb-6">
              <Sparkles className="w-6 h-6 text-indigo-400" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white mb-2">
              Create Your First Board
            </h1>
            <p className="text-sm text-slate-400 max-w-sm mb-6 leading-relaxed">
              Unlock your secure board space. Store, organize, and inspect your sprints without risk.
            </p>
            <button
              onClick={handleAddBoardTrigger}
              className="px-5 py-2.5 bg-indigo-500 hover:bg-indigo-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-lg shadow-indigo-500/10 cursor-pointer active:scale-95"
            >
              Get Started
            </button>
          </div>
        )}

        {/* Bottom Status Bar */}
        <footer className="h-8 px-8 bg-black/40 border-t border-white/5 flex items-center justify-between text-[10px] font-medium text-slate-500 shrink-0">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 font-mono select-none">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> 
              System Online
            </span>
            <span className="text-[9px] uppercase tracking-wider bg-white/5 text-slate-400 px-1.5 py-0.5 rounded border border-white/5 select-none md:inline hidden">Cloud Sync Active</span>
          </div>
          <div className="flex items-center gap-4 uppercase tracking-tighter text-slate-550 font-mono">
            <span>Updated 2m ago</span>
            <span className="text-indigo-400">v1.0.4-stable</span>
          </div>
        </footer>
      </div>

      {/* Board Form Modal Sheet */}
      <BoardModal
        isOpen={isBoardModalOpen}
        onClose={() => setIsBoardModalOpen(false)}
        onSubmit={handleBoardModalSubmit}
        title={boardModalTitle}
        initialValue={selectedBoardToEdit ? selectedBoardToEdit.name : ''}
      />

      {/* Task Form Modal Sheet */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSubmit={handleTaskModalSubmit}
        title={taskModalTitle}
        initialTask={selectedTaskToEdit}
        defaultStatus={defaultTaskStatus}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setTaskMarkedForDeletion(null);
        }}
        onConfirm={confirmDeleteTask}
        taskTitle={taskMarkedForDeletion ? taskMarkedForDeletion.title : ''}
      />
    </div>
  );
}

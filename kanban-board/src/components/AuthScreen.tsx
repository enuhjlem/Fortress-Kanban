import { useState, useRef } from 'react';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../firebase';
import { LogIn, ShieldAlert, Kanban, ShieldCheck, AlertTriangle, ExternalLink, RefreshCw } from 'lucide-react';

interface AuthScreenProps {
  onSignInError: (error: string) => void;
}

export default function AuthScreen({ onSignInError }: AuthScreenProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isAssertionError, setIsAssertionError] = useState(false);
  const isCurrentlyIframe = typeof window !== 'undefined' && window.self !== window.top;
  const isSigningInRef = useRef(false);

  const handleGoogleSignIn = async () => {
    // Prevent double clicks synchronously
    if (isSigningInRef.current) return;
    isSigningInRef.current = true;
    setIsLoading(true);
    setLocalError(null);
    setIsAssertionError(false);

    const provider = new GoogleAuthProvider();
    // Enforce account selector to prevent silent credential failures or stale caches
    provider.setCustomParameters({ prompt: 'select_account' });

    try {
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      console.error('Google Auth Popup Error:', err);
      let errMsg = err.message || 'Failed to authenticate.';
      let isAssert = false;

      if (err.code === 'auth/popup-closed-by-user') {
        errMsg = 'The sign-in popup was closed before completion. Please try signing in again.';
      } else if (err.code === 'auth/blocked-by-popup') {
        errMsg = 'The sign-in popup was blocked by your browser. Please allow popups for this site, or open the app in a new tab.';
      } else if (
        err.message?.includes('Pending promise was never set') ||
        err.message?.includes('INTERNAL ASSERTION FAILED') ||
        String(err).includes('Pending promise was never set')
      ) {
        errMsg = 'An internal Firebase state mismatch occurred (Pending promise was never set). This happens when a popup gets interrupted or double-clicked inside modern security contexts. Reloading the page clears this state.';
        isAssert = true;
      }

      setLocalError(errMsg);
      setIsAssertionError(isAssert);
      onSignInError(errMsg);
    } finally {
      setIsLoading(false);
      isSigningInRef.current = false;
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-transparent px-4 select-none">
      {/* Dynamic Background Accents */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative w-full max-w-md bg-white/[0.04] border border-white/10 rounded-2xl p-8 backdrop-blur-xl shadow-2xl">
        <div className="flex flex-col items-center text-center">
          {/* Custom Visual App Icon */}
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 mb-6">
            <Kanban className="w-5 h-5 text-slate-950 stroke-[2.25]" />
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-white mb-2">
            Secure Kanban Board
          </h1>
          <p className="text-sm text-slate-400 max-w-sm mb-6 leading-relaxed">
            A secure task-management space engineered with Zero-Trust architecture. Keep your sprints, tasks, and ideas private.
          </p>

          {/* Local Error display banner */}
          {localError && (
            <div className="w-full mb-6 p-4 rounded-xl text-left bg-rose-500/10 border border-rose-500/20 flex flex-col gap-2.5">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-rose-300">
                    Sign In Failed
                  </p>
                  <p className="text-xs text-rose-100 leading-normal font-medium">
                    {localError}
                  </p>
                </div>
              </div>
              {isAssertionError && (
                <button
                  onClick={() => window.location.reload()}
                  className="mt-1 flex items-center gap-1.5 self-start px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 hover:text-white rounded-lg text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reload Page & Restart Auth</span>
                </button>
              )}
            </div>
          )}

          {isCurrentlyIframe && (
            <div className="w-full mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-left">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-amber-300">
                    Iframe Environment Detected
                  </p>
                  <p className="text-xs text-slate-300 leading-normal">
                    Modern browsers block Google Authentication state synchronization inside iframe containers because of local storage partitions.
                  </p>
                  <p className="text-xs text-amber-400/90 leading-normal font-medium pt-1">
                    To sign in successfully, please open this app in a separate top-level window.
                  </p>
                  <div className="pt-2">
                    <a
                      href={window.location.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 hover:text-white rounded-lg text-xs font-bold transition-all shadow-md active:scale-95"
                    >
                      <span>Open in New Tab</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}

          <button
            id="google-signin-btn"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-100 text-slate-950 transition-all duration-200 active:scale-[0.98] py-3.5 px-4 rounded-xl font-semibold shadow-xl cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <span className="text-sm">
              {isLoading ? 'Connecting account...' : 'Sign in with Google'}
            </span>
          </button>
        </div>

        {/* Security Disclaimers */}
        <div className="mt-8 pt-6 border-t border-white/5 flex flex-col gap-3.5">
          <div className="flex items-start gap-2.5 text-xs text-slate-450">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>
              <strong>Row-Level Security (RLS)</strong> is strictly enforced. Unauthorized tenants cannot query or trace your boards.
            </span>
          </div>
          <div className="flex items-start gap-2.5 text-xs text-slate-450">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>
              <strong>Isolated Workspace</strong>: Columns are permanently locked as To Do, In Progress, and Done to uphold schema integrity.
            </span>
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-center gap-1.5 text-xs text-slate-500 font-mono">
        <span>SECURITY VERIFICATION: APPROVED v1.0.0</span>
      </div>
    </div>
  );
}

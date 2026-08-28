'use client';

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import AuthGateModal from './AuthGateModal';

interface AuthGateContextValue {
  openAuthGate: (onSuccess?: () => void) => void;
  closeAuthGate: () => void;
}

const AuthGateContext = createContext<AuthGateContextValue | null>(null);

export function useAuthGate(): AuthGateContextValue {
  const context = useContext(AuthGateContext);
  if (!context) {
    throw new Error('useAuthGate must be used within AuthGateProvider');
  }
  return context;
}

export default function AuthGateProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const pendingActionRef = useRef<(() => void) | null>(null);

  const openAuthGate = useCallback((onSuccess?: () => void) => {
    pendingActionRef.current = onSuccess || null;
    setOpen(true);
  }, []);

  const closeAuthGate = useCallback(() => {
    pendingActionRef.current = null;
    setOpen(false);
  }, []);

  const handleSuccess = useCallback(() => {
    const action = pendingActionRef.current;
    pendingActionRef.current = null;
    setOpen(false);
    if (action) {
      // 等 Clerk 会话状态刷新后执行原动作
      window.setTimeout(() => action(), 120);
    }
  }, []);

  return (
    <AuthGateContext.Provider value={{ openAuthGate, closeAuthGate }}>
      {children}
      <AuthGateModal open={open} onOpenChange={setOpen} onSuccess={handleSuccess} />
    </AuthGateContext.Provider>
  );
}

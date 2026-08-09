import React, { createContext, useContext, useState, useCallback } from "react";
import { X, CheckCircle, AlertTriangle, AlertCircle, Info } from "lucide-react";

export type ToastType = "success" | "warning" | "error" | "info";

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = "info") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto dismiss after 4 seconds
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}
      
      {/* Floating Toast Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-none border-2 border-black shadow-brutal bg-white dark:bg-brand-lightDark text-zinc-900 dark:text-zinc-50 transform translate-y-0 transition-transform duration-300`}
            role="alert"
          >
            <div className="mt-0.5">
              {t.type === "success" && <CheckCircle className="w-5 h-5 text-emerald-500" />}
              {t.type === "warning" && <AlertTriangle className="w-5 h-5 text-amber-500" />}
              {t.type === "error" && <AlertCircle className="w-5 h-5 text-rose-500" />}
              {t.type === "info" && <Info className="w-5 h-5 text-blue-500" />}
            </div>
            
            <div className="flex-1 text-sm font-bold leading-tight">
              {t.message}
            </div>
            
            <button
              onClick={() => removeToast(t.id)}
              className="text-zinc-400 hover:text-black dark:hover:text-white"
              aria-label="Close alert"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

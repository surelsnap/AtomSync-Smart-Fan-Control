// ToastProvider and useToast
"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

type Toast = {
  id: string;
  title: string;
  variant?: "success" | "error" | "info";
};

type ToastContextValue = {
  toasts: Toast[];
  push: (t: Omit<Toast, "id">) => void;
  remove: (id: string) => void;
};

const ToastContext = React.createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const push = React.useCallback((toast: Omit<Toast, "id">) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, []);

  const remove = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, push, remove }}>
      {children}
      <div className="fixed right-4 top-4 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              "rounded-xl border px-4 py-3 text-sm shadow-lg backdrop-blur",
              toast.variant === "success" && "border-emerald-400/60 bg-emerald-500/10 text-emerald-100",
              toast.variant === "error" && "border-rose-400/60 bg-rose-500/10 text-rose-100",
              (!toast.variant || toast.variant === "info") && "border-cyan-400/60 bg-cyan-500/10 text-cyan-50"
            )}
            role="status"
          >
            {toast.title}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}


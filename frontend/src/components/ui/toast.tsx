"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, Info, TriangleAlert } from "lucide-react";
import { createContext, useCallback, useContext, useRef, useState } from "react";

import { cn } from "@/lib/utils";

type ToastType = "success" | "error" | "info";
type Toast = { id: number; message: string; type: ToastType };

const ToastContext = createContext<((message: string, type?: ToastType) => void) | null>(null);

const STYLES: Record<ToastType, { ring: string; icon: React.ReactNode }> = {
  success: { ring: "border-success/40 text-success", icon: <Check className="h-4 w-4" /> },
  error: { ring: "border-f1-red/50 text-f1-red", icon: <TriangleAlert className="h-4 w-4" /> },
  info: { ring: "border-white/20 text-silver", icon: <Info className="h-4 w-4" /> },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);

  const toast = useCallback((message: string, type: ToastType = "success") => {
    const id = idRef.current++;
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[200] flex flex-col gap-2">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 14, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 24 }}
              transition={{ duration: 0.22, ease: [0.22, 0.7, 0.2, 1] }}
              className={cn(
                "pointer-events-auto flex items-center gap-2.5 rounded-lg rounded-tr-none border bg-carbon-850/95 px-4 py-2.5 text-sm font-semibold shadow-[0_20px_50px_-20px_rgba(0,0,0,0.9)] backdrop-blur",
                STYLES[t.type].ring,
              )}
            >
              {STYLES[t.type].icon}
              <span className="text-foreground">{t.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const toast = useContext(ToastContext);
  if (!toast) throw new Error("useToast must be used within ToastProvider");
  return toast;
}

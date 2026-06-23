import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ExternalLink, Loader2, X } from "lucide-react";
import { explorerTx } from "../config/chain";

type Kind = "pending" | "success" | "error";
type Toast = {
  id: number;
  kind: Kind;
  title: string;
  detail?: string;
  hash?: string;
};

type Ctx = {
  push: (t: Omit<Toast, "id">) => number;
  update: (id: number, patch: Partial<Omit<Toast, "id">>) => void;
  dismiss: (id: number) => void;
};

const ToastCtx = createContext<Ctx | null>(null);
let counter = 1;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const push = useCallback(
    (t: Omit<Toast, "id">) => {
      const id = counter++;
      setToasts((prev) => [...prev, { ...t, id }]);
      if (t.kind !== "pending") setTimeout(() => dismiss(id), 6000);
      return id;
    },
    [dismiss],
  );

  const update = useCallback(
    (id: number, patch: Partial<Omit<Toast, "id">>) => {
      setToasts((prev) =>
        prev.map((x) => (x.id === id ? { ...x, ...patch } : x)),
      );
      if (patch.kind && patch.kind !== "pending")
        setTimeout(() => dismiss(id), 6000);
    },
    [dismiss],
  );

  return (
    <ToastCtx.Provider value={{ push, update, dismiss }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[60] flex w-[min(92vw,360px)] flex-col gap-2">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 24, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
              className="card flex items-start gap-3 p-3 shadow-2xl shadow-black/40"
            >
              <span className="mt-0.5 shrink-0">
                {t.kind === "pending" && (
                  <Loader2 size={16} className="animate-spin text-accent" />
                )}
                {t.kind === "success" && (
                  <Check size={16} className="text-ok" />
                )}
                {t.kind === "error" && <X size={16} className="text-danger" />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium leading-tight">{t.title}</p>
                {t.detail && (
                  <p className="mt-0.5 text-xs text-muted">{t.detail}</p>
                )}
                {t.hash && (
                  <a
                    href={explorerTx(t.hash)}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1.5 inline-flex items-center gap-1 text-xs text-accent hover:underline"
                  >
                    View on explorer <ExternalLink size={11} />
                  </a>
                )}
              </div>
              <button
                onClick={() => dismiss(t.id)}
                className="text-faint transition-colors hover:text-text"
                aria-label="Dismiss"
              >
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

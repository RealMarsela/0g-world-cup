import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";
import { Loader2 } from "lucide-react";
import * as RadixScrollArea from "@radix-ui/react-scroll-area";
import * as RadixSelect from "@radix-ui/react-select";

export function Spinner({ size = 16 }: { size?: number }) {
  return <Loader2 size={size} className="animate-spin text-accent" />;
}

export function Badge({
  children,
  tone = "default",
}: {
  children: ReactNode;
  tone?: "default" | "accent" | "ok" | "warn";
}) {
  const tones = {
    default: "border-white/12 bg-white/[0.04] text-muted",
    accent: "border-accent/40 bg-accent/10 text-accent",
    ok: "border-gold/40 bg-gold/10 text-gold",
    warn: "border-amber-300/35 bg-amber-300/10 text-amber-100",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[11px] font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function Button({
  variant = "primary",
  loading,
  children,
  className = "",
  disabled,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
  loading?: boolean;
  children: ReactNode;
}) {
  const variants = {
    primary: "bg-accent text-white shadow-[0_0_28px_rgba(242,13,34,0.28)] hover:bg-accent-2",
    secondary: "border border-white/14 bg-white/[0.05] text-strong hover:bg-white/[0.09]",
    ghost: "text-muted hover:bg-white/[0.06] hover:text-strong",
  };
  return (
    <button
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-semibold transition ${variants[variant]} disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && <Spinner size={15} />}
      {children}
    </button>
  );
}

export function Panel({
  children,
  className = "",
  ...rest
}: HTMLAttributes<HTMLElement> & {
  children: ReactNode;
}) {
  return <section className={`panel min-w-0 ${className}`} {...rest}>{children}</section>;
}

export function Dialog({
  title,
  children,
  trigger,
}: {
  title: string;
  children: ReactNode;
  trigger: ReactNode;
}) {
  return (
    <details className="group relative inline-block">
      <summary className="list-none marker:hidden">{trigger}</summary>
      <div className="fixed inset-0 z-50 hidden bg-black/70 backdrop-blur-sm group-open:block" />
      <section
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="fixed left-1/2 top-1/2 z-50 hidden w-[min(92vw,560px)] -translate-x-1/2 -translate-y-1/2 rounded-lg border border-white/12 bg-page p-5 shadow-2xl group-open:block"
      >
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-2xl font-bold">{title}</h2>
          <span className="rounded border border-white/10 px-2 py-1 text-xs text-faint">
            Click trigger to close
          </span>
        </div>
        {children}
      </section>
    </details>
  );
}

export function Sheet({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <aside className="panel p-4">
      <h2 className="text-xl font-bold">{title}</h2>
      <div className="mt-4 grid gap-3">{children}</div>
    </aside>
  );
}

export function Tabs({
  tabs,
  value,
  onChange,
}: {
  tabs: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="inline-flex rounded-md border border-white/10 bg-black/25 p-1">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          aria-pressed={value === tab.value}
          className={`min-h-10 rounded px-3 text-sm font-semibold transition ${
            value === tab.value
              ? "bg-accent text-white"
              : "text-muted hover:bg-white/[0.06] hover:text-strong"
          }`}
          onClick={() => onChange(tab.value)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export function DataTable({
  columns,
  rows,
}: {
  columns: string[];
  rows: (ReactNode[])[];
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-white/10">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="bg-white/[0.04] text-xs uppercase tracking-[0.16em] text-faint">
          <tr>
            {columns.map((column) => (
              <th className="p-4" key={column}>
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr className="border-t border-white/10" key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <td className="p-4" key={cellIndex}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="grid gap-2 text-sm">
      <span className="text-muted">{label}</span>
      {children}
      {hint && <span className="text-xs text-faint">{hint}</span>}
    </label>
  );
}

export function Select({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <select
      className="min-h-11 rounded-md border border-white/12 bg-black/30 px-3 text-sm text-strong outline-none focus:border-accent/60"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    >
      {children}
    </select>
  );
}

export function ShadcnSelect({
  value,
  onChange,
  options,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  label?: string;
}) {
  return (
    <RadixSelect.Root value={value} onValueChange={onChange}>
      <RadixSelect.Trigger
        aria-label={label}
        className="inline-flex min-h-11 w-full items-center justify-between gap-3 rounded-md border border-white/12 bg-black/30 px-3 text-sm text-strong outline-none transition hover:bg-white/[0.06] focus:border-accent/60"
      >
        <RadixSelect.Value />
        <RadixSelect.Icon className="text-faint">⌄</RadixSelect.Icon>
      </RadixSelect.Trigger>
      <RadixSelect.Portal>
        <RadixSelect.Content
          position="popper"
          sideOffset={6}
          className="z-50 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-md border border-white/12 bg-panel p-1 shadow-2xl"
        >
          <RadixSelect.Viewport>
            {options.map((option) => (
              <RadixSelect.Item
                className="relative flex min-h-10 cursor-pointer select-none items-center rounded px-3 text-sm text-muted outline-none data-[highlighted]:bg-accent data-[highlighted]:text-white data-[state=checked]:text-accent"
                key={option}
                value={option}
              >
                <RadixSelect.ItemText>{option}</RadixSelect.ItemText>
              </RadixSelect.Item>
            ))}
          </RadixSelect.Viewport>
        </RadixSelect.Content>
      </RadixSelect.Portal>
    </RadixSelect.Root>
  );
}

export function ScrollArea({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <RadixScrollArea.Root className={`overflow-hidden ${className}`}>
      <RadixScrollArea.Viewport className="h-full w-full rounded-[inherit]">{children}</RadixScrollArea.Viewport>
      <RadixScrollArea.Scrollbar
        orientation="vertical"
        className="flex w-2 touch-none select-none bg-white/[0.03] p-px"
      >
        <RadixScrollArea.Thumb className="relative flex-1 rounded-full bg-accent/50" />
      </RadixScrollArea.Scrollbar>
      <RadixScrollArea.Corner />
    </RadixScrollArea.Root>
  );
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <Panel className="grid place-items-center px-6 py-16 text-center">
      <div className="max-w-md">
        <h3 className="text-xl font-semibold text-strong">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-muted">{body}</p>
        {action && <div className="mt-5">{action}</div>}
      </div>
    </Panel>
  );
}

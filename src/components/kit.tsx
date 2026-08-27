import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Btn({
  className,
  tone = "accent",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { tone?: "accent" | "ghost" | "light" | "danger" }) {
  const tones = {
    accent: "bg-accent text-accent-foreground hover:brightness-105",
    light: "bg-card text-card-foreground hover:brightness-97",
    ghost: "bg-surface text-surface-foreground border border-border hover:bg-secondary",
    danger: "bg-destructive text-destructive-foreground hover:brightness-105",
  } as const;
  return (
    <button
      {...props}
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl px-5 text-sm font-bold transition disabled:opacity-50",
        tones[tone],
        className,
      )}
    />
  );
}

export function Field({
  label,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  return (
    <label className="block space-y-1.5">
      {label ? <span className="text-xs font-bold text-muted-foreground">{label}</span> : null}
      <input
        {...props}
        className={cn(
          "min-h-11 w-full rounded-2xl border border-input bg-surface px-4 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-accent",
          className,
        )}
      />
    </label>
  );
}

export function Area({
  label,
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }) {
  return (
    <label className="block space-y-1.5">
      {label ? <span className="text-xs font-bold text-muted-foreground">{label}</span> : null}
      <textarea
        {...props}
        className={cn(
          "min-h-24 w-full rounded-2xl border border-input bg-surface px-4 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-accent",
          className,
        )}
      />
    </label>
  );
}

export function Chip({ children, tone = "muted" }: { children: ReactNode; tone?: "muted" | "success" | "accent" | "danger" }) {
  const tones = {
    muted: "bg-muted text-muted-foreground",
    success: "bg-success/20 text-success",
    accent: "bg-accent/25 text-accent",
    danger: "bg-destructive/20 text-destructive",
  } as const;
  return (
    <span className={cn("rounded-full px-3 py-1 text-[11px] font-bold", tones[tone])}>{children}</span>
  );
}

export function Ring({ value, size = 76 }: { value: number; size?: number }) {
  const r = (size - 10) / 2;
  const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--muted)" strokeWidth="6" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="var(--accent)"
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c - (Math.min(value, 100) / 100) * c}
      />
    </svg>
  );
}

export function Stat({ value, label }: { value: ReactNode; label: string }) {
  return (
    <div>
      <p className="text-2xl font-black leading-none">{value}</p>
      <p className="mt-1 text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}

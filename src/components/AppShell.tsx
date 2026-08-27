import { Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { CalendarDays, Home, LineChart, UserRound } from "lucide-react";
import logoAsset from "@/assets/logo.png.asset.json";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "الرئيسية", icon: Home },
  { to: "/month", label: "خطة الشهر", icon: CalendarDays },
  { to: "/progress", label: "التقدم", icon: LineChart },
  { to: "/profile", label: "حسابي", icon: UserRound },
] as const;

export function AppShell({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  const { pathname } = useRouterState({ select: (s) => s.location });
  const { fullName } = useAuth();

  return (
    <div className="min-h-screen bg-background pb-28">
      <header className="screen-shell pt-6">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <div className="min-w-0">
            <p className="truncate text-xs text-muted-foreground">{subtitle ?? "نجوم القيادة"}</p>
            <h1 className="truncate text-2xl font-black">{title}</h1>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="hidden max-w-28 truncate text-xs text-muted-foreground sm:block">{fullName}</span>
            <img src={logoAsset.url} alt="شعار نجوم القيادة" className="h-11 w-11 rounded-2xl bg-cream object-contain p-1" />
          </div>
        </div>
        <div className="mt-5 space-y-4">{children}</div>
      </header>

      <nav className="fixed inset-x-0 bottom-0 z-20">
        <div className="screen-shell pb-4">
          <div className="panel flex items-center justify-between gap-1 px-2 py-2">
            {NAV.map((item) => {
              const active = pathname === item.to;
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "flex flex-1 flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[10px] font-bold transition",
                    active ? "bg-accent text-accent-foreground" : "text-muted-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </div>
  );
}

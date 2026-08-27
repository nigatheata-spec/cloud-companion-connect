import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { RequireAuth } from "@/components/RequireAuth";
import { Chip, Ring } from "@/components/kit";
import { useAuth } from "@/lib/auth";
import { fetchMonthData } from "@/lib/participant";
import { fetchPlans, monthLabel, scoreBand } from "@/lib/program";

export const Route = createFileRoute("/progress")({
  head: () => ({
    meta: [
      { title: "تقدّمي | نجوم القيادة" },
      { name: "description", content: "متابعة نسب الإنجاز الشهرية عبر أشهر برنامج نجوم القيادة الستة." },
      { property: "og:title", content: "تقدّمي | نجوم القيادة" },
      { property: "og:description", content: "استعرض نسبة إنجازك في كل شهر من أشهر البرنامج." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <RequireAuth>
      <ProgressPage />
    </RequireAuth>
  ),
});

function ProgressPage() {
  const { user } = useAuth();
  const plansQuery = useQuery({ queryKey: ["plans"], queryFn: fetchPlans });
  const plans = plansQuery.data ?? [];

  return (
    <AppShell title="تقدّمي" subtitle="نجوم القيادة">
      {plans.map((plan) => (
        <MonthRow key={plan.id} planId={plan.id} month={plan.month} title={plan.title} userId={user?.id ?? ""} plans={plans} />
      ))}
      {plans.length === 0 ? <p className="panel p-5 text-sm text-muted-foreground">لا توجد خطط بعد.</p> : null}
    </AppShell>
  );
}

function MonthRow({
  planId,
  month,
  title,
  userId,
  plans,
}: {
  planId: string;
  month: string;
  title: string;
  userId: string;
  plans: Awaited<ReturnType<typeof fetchPlans>>;
}) {
  const plan = plans.find((p) => p.id === planId)!;
  const { data } = useQuery({
    queryKey: ["month", planId, userId],
    enabled: !!userId,
    queryFn: () => fetchMonthData(plan, userId),
  });

  const pct = data?.score ?? 0;
  const band = scoreBand(pct);

  return (
    <section className="panel grid grid-cols-[auto_minmax(0,1fr)] items-center gap-4 p-4">
      <div className="relative shrink-0">
        <Ring value={pct} size={62} />
        <span className="absolute inset-0 grid place-items-center text-xs font-black">{pct}%</span>
      </div>
      <div className="min-w-0">
        <p className="text-[11px] text-muted-foreground">{monthLabel(month)}</p>
        <h3 className="truncate text-sm font-black">{title}</h3>
        <div className="mt-1">
          <Chip tone={band.tone === "warn" ? "accent" : band.tone}>{band.label}</Chip>
        </div>
      </div>
    </section>
  );
}

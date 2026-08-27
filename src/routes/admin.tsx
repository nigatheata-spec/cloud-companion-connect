import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { RequireAuth } from "@/components/RequireAuth";
import { GroupsPanel } from "@/components/admin/GroupsPanel";
import { OverviewPanel } from "@/components/admin/OverviewPanel";
import { PlanPanel } from "@/components/admin/PlanPanel";
import { RosterPanel } from "@/components/admin/RosterPanel";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "الإدارة | نجوم القيادة" },
      {
        name: "description",
        content: "لوحة إدارة برنامج نجوم القيادة: المجموعات والأعضاء وخطط الأشهر.",
      },
      { property: "og:title", content: "الإدارة | نجوم القيادة" },
      { property: "og:description", content: "إدارة المجموعات والأعضاء وخطط البرنامج." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <RequireAuth>
      <AdminPage />
    </RequireAuth>
  ),
});

const TABS = [
  ["overview", "نظرة عامة"],
  ["groups", "المجموعات"],
  ["roster", "الأعضاء"],
  ["plan", "خطط الأشهر"],
] as const;

type Tab = (typeof TABS)[number][0];

function AdminPage() {
  const { role, loading } = useAuth();
  const [tab, setTab] = useState<Tab>("overview");

  // The role arrives a tick after the session, so wait rather than bouncing
  // a supervisor out of their own dashboard on first paint.
  if (loading || role === null) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  if (role !== "supervisor") return <Navigate to="/" />;

  return (
    <AppShell title="الإدارة" subtitle="لوحة المشرفة">
      <div className="grid grid-cols-4 gap-1 rounded-2xl bg-muted p-1">
        {TABS.map(([value, label]) => (
          <button
            key={value}
            onClick={() => setTab(value)}
            className={`rounded-xl py-2 text-[11px] font-bold transition ${
              tab === value ? "bg-accent text-accent-foreground" : "text-muted-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "overview" ? <OverviewPanel /> : null}
      {tab === "groups" ? <GroupsPanel /> : null}
      {tab === "roster" ? <RosterPanel /> : null}
      {tab === "plan" ? <PlanPanel /> : null}
    </AppShell>
  );
}

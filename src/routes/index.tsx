import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { RequireAuth } from "@/components/RequireAuth";
import { ParentHome } from "@/components/home/ParentHome";
import { ParticipantHome } from "@/components/home/ParticipantHome";
import { SupervisorHome } from "@/components/home/SupervisorHome";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "نجوم القيادة | المتابعة اليومية" },
      {
        name: "description",
        content: "منصة نجوم القيادة لمتابعة القراءة اليومية والعادات الشهرية وحضور المحاضرات واعتماد الأنشطة.",
      },
      { property: "og:title", content: "نجوم القيادة | المتابعة اليومية" },
      { property: "og:description", content: "سجّل قراءتك وعادتك اليومية وتابع نسبة إنجازك الشهرية." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <RequireAuth>
      <HomeBody />
    </RequireAuth>
  );
}

function HomeBody() {
  const { role } = useAuth();
  const title = role === "supervisor" ? "لوحة المشرفة" : role === "parent" ? "لوحة ولي الأمر" : "يومي";

  return (
    <AppShell title={title} subtitle="نجوم القيادة">
      {role === "supervisor" ? <SupervisorHome /> : role === "parent" ? <ParentHome /> : <ParticipantHome />}
    </AppShell>
  );
}

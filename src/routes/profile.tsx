import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { LogOut } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { RequireAuth } from "@/components/RequireAuth";
import { Btn, Chip } from "@/components/kit";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "حسابي | نجوم القيادة" },
      { name: "description", content: "بيانات حسابك ودورك في برنامج نجوم القيادة وتسجيل الخروج." },
      { property: "og:title", content: "حسابي | نجوم القيادة" },
      { property: "og:description", content: "إدارة حسابك في منصة نجوم القيادة." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <RequireAuth>
      <ProfilePage />
    </RequireAuth>
  ),
});

const ROLE_LABEL: Record<string, string> = {
  participant: "مشارك",
  parent: "ولي أمر",
  supervisor: "مشرفة",
};

function ProfilePage() {
  const { user, role } = useAuth();
  const navigate = useNavigate();

  const profileQuery = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("full_name,phone").eq("id", user!.id).maybeSingle();
      return data;
    },
  });

  return (
    <AppShell title="حسابي" subtitle="نجوم القيادة">
      <section className="panel-light space-y-2 p-5">
        <h2 className="text-lg font-black">{profileQuery.data?.full_name || "مستخدم"}</h2>
        <p className="text-sm opacity-80">{user?.email}</p>
        <Chip tone="accent">{ROLE_LABEL[role ?? "participant"]}</Chip>
      </section>

      <section className="panel space-y-2 p-5 text-sm text-muted-foreground">
        <p>يعمل البرنامج على ستة أشهر، وتُحتسب نسبة الإنجاز شهريًا من القراءة والعادة والحضور والتمارين والتطبيق.</p>
      </section>

      <Btn
        tone="ghost"
        className="w-full"
        onClick={async () => {
          await supabase.auth.signOut();
          void navigate({ to: "/auth" });
        }}
      >
        <LogOut className="h-4 w-4" /> تسجيل الخروج
      </Btn>
    </AppShell>
  );
}

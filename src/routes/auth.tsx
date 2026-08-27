import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import logoUrl from "@/assets/logo.png";
import { Btn, Field } from "@/components/kit";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "تسجيل الدخول | نجوم القيادة" },
      { name: "description", content: "سجّل الدخول إلى منصة نجوم القيادة لمتابعة القراءة والعادات والأنشطة الشهرية." },
      { property: "og:title", content: "تسجيل الدخول | نجوم القيادة" },
      { property: "og:description", content: "منصة المتابعة الرقمية لبرنامج نجوم القيادة." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"participant" | "parent">("participant");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (session) void navigate({ to: "/" });
  }, [session, navigate]);

  const submit = async () => {
    setBusy(true);
    try {
      if (mode === "up") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: fullName, role },
          },
        });
        if (error) throw error;
        toast.success("تم إنشاء الحساب");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      void navigate({ to: "/" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "تعذّر إتمام العملية");
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (error) toast.error("تعذّر تسجيل الدخول عبر Google");
  };

  return (
    <main className="flex min-h-screen flex-col justify-center bg-background py-10">
      <div className="screen-shell space-y-6">
        <div className="text-center">
          <img src={logoUrl} alt="شعار نجوم القيادة" className="mx-auto h-24 w-24 rounded-3xl bg-cream object-contain p-2" />
          <h1 className="mt-4 text-2xl font-black">نجوم القيادة</h1>
          <p className="mt-1 text-sm text-muted-foreground">منهجية التقييم والمتابعة الرقمية</p>
        </div>

        <div className="panel space-y-4 p-5">
          <div className="flex rounded-2xl bg-muted p-1">
            {(["in", "up"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 rounded-xl py-2 text-sm font-bold ${mode === m ? "bg-accent text-accent-foreground" : "text-muted-foreground"}`}
              >
                {m === "in" ? "دخول" : "حساب جديد"}
              </button>
            ))}
          </div>

          {mode === "up" ? (
            <>
              <Field label="الاسم الكامل" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="الاسم" />
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-muted-foreground">نوع الحساب</span>
                <div className="flex gap-2">
                  {([
                    ["participant", "مشارك"],
                    ["parent", "ولي أمر"],
                  ] as const).map(([v, l]) => (
                    <button
                      key={v}
                      onClick={() => setRole(v)}
                      className={`flex-1 rounded-2xl border border-border py-2.5 text-sm font-bold ${role === v ? "bg-accent text-accent-foreground" : "bg-surface text-muted-foreground"}`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : null}

          <Field label="البريد الإلكتروني" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@email.com" />
          <Field label="كلمة المرور" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />

          <Btn className="w-full" disabled={busy} onClick={submit}>
            {mode === "in" ? "تسجيل الدخول" : "إنشاء الحساب"}
          </Btn>
          <Btn tone="ghost" className="w-full" onClick={google}>
            المتابعة عبر Google
          </Btn>
        </div>
      </div>
    </main>
  );
}


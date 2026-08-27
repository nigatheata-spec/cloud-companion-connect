import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { RequireAuth } from "@/components/RequireAuth";
import { Area, Btn, Chip, Field } from "@/components/kit";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { fetchMonthData } from "@/lib/participant";
import { WEIGHTS, fetchCurrentPlan, monthLabel } from "@/lib/program";

export const Route = createFileRoute("/month")({
  head: () => ({
    meta: [
      { title: "خطة الشهر | نجوم القيادة" },
      { name: "description", content: "تفاصيل محاضرة الشهر وتماريها وتمرين المتابعة والتطبيق وعادة الشهر." },
      { property: "og:title", content: "خطة الشهر | نجوم القيادة" },
      { property: "og:description", content: "اطّلع على مكوّنات الشهر وسجّل تمارينك وتطبيقك العملي." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <RequireAuth>
      <MonthPage />
    </RequireAuth>
  ),
});

function MonthPage() {
  const { user, role } = useAuth();
  const qc = useQueryClient();
  const planQuery = useQuery({ queryKey: ["plan"], queryFn: fetchCurrentPlan });
  const plan = planQuery.data ?? null;

  const dataQuery = useQuery({
    queryKey: ["month", plan?.id, user?.id],
    enabled: !!plan && !!user && role === "participant",
    queryFn: () => fetchMonthData(plan!, user!.id),
  });

  const [exerciseNote, setExerciseNote] = useState("");
  const [appDesc, setAppDesc] = useState("");
  const [appResult, setAppResult] = useState("");

  const submitExercise = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("lecture_exercises").upsert(
        { plan_id: plan!.id, participant_id: user!.id, done: true, note: exerciseNote, status: "pending" },
        { onConflict: "plan_id,participant_id" },
      );
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("أُرسلت التمارين للاعتماد");
      void qc.invalidateQueries({ queryKey: ["month"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const submitApplication = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("application_submissions").upsert(
        {
          plan_id: plan!.id,
          participant_id: user!.id,
          description: appDesc,
          result: appResult,
          status: "pending",
        },
        { onConflict: "plan_id,participant_id" },
      );
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("أُرسل تمرين التطبيق");
      void qc.invalidateQueries({ queryKey: ["month"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!plan) {
    return (
      <AppShell title="خطة الشهر" subtitle="نجوم القيادة">
        <p className="panel p-5 text-sm text-muted-foreground">لا توجد خطة لهذا الشهر.</p>
      </AppShell>
    );
  }

  const data = dataQuery.data;

  return (
    <AppShell title="خطة الشهر" subtitle={monthLabel(plan.month)}>
      <section className="panel-light space-y-2 p-5">
        <h2 className="text-lg font-black">{plan.title}</h2>
        <p className="text-sm opacity-80">محاضرة الشهر: {plan.lecture_topic}</p>
        <p className="text-sm opacity-80">ورد القراءة: {plan.reading_topic}</p>
        <p className="text-sm opacity-80">الجلسة الحوارية: {plan.session_topic}</p>
      </section>

      <section className="panel space-y-3 p-5">
        <h3 className="text-sm font-black">مكوّنات الشهر ونسبها</h3>
        <ul className="space-y-2 text-sm">
          {[
            ["المحاضرة الشهرية", WEIGHTS.lecture],
            ["تمارين المحاضرة", WEIGHTS.exercises],
            ["ورد القراءة اليومي", WEIGHTS.reading],
            ["الجلسة الحوارية", WEIGHTS.session],
            ["المتابعة والتطبيق", WEIGHTS.application],
            ["عادة الشهر", WEIGHTS.habit],
          ].map(([label, weight]) => (
            <li key={label as string} className="flex items-center justify-between gap-3 border-b border-border pb-2 last:border-0">
              <span className="min-w-0 truncate text-muted-foreground">{label}</span>
              <span className="shrink-0 font-black">{weight}%</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="panel space-y-2 p-5">
        <h3 className="text-sm font-black">عادة الشهر</h3>
        <p className="text-sm text-muted-foreground">{plan.habit_title}</p>
        {plan.habit_requires_photo ? <Chip tone="accent">تتطلب صورة توثيق</Chip> : <Chip>تأكيد يومي</Chip>}
      </section>

      {role === "participant" ? (
        <>
          <section className="panel space-y-3 p-5">
            <header className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-black">تمارين المحاضرة</h3>
              {data?.exercise ? <Chip tone={data.exercise.status === "approved" ? "success" : "accent"}>{statusLabel(data.exercise.status)}</Chip> : null}
            </header>
            <Area
              placeholder="اكتب ما نفّذته من تمارين المحاضرة"
              value={exerciseNote}
              onChange={(e) => setExerciseNote(e.target.value)}
            />
            <Btn className="w-full" disabled={!exerciseNote.trim() || submitExercise.isPending} onClick={() => submitExercise.mutate()}>
              إرسال للاعتماد
            </Btn>
          </section>

          <section className="panel space-y-3 p-5">
            <header className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-black">تمرين المتابعة والتطبيق</h3>
              {data?.application ? <Chip tone={data.application.status === "approved" ? "success" : "accent"}>{statusLabel(data.application.status)}</Chip> : null}
            </header>
            <p className="text-xs text-muted-foreground">{plan.application_title} — {plan.application_description}</p>
            <Field placeholder="ماذا طبّقت؟" value={appDesc} onChange={(e) => setAppDesc(e.target.value)} />
            <Area placeholder="ما النتيجة أو الأثر الذي لاحظته؟" value={appResult} onChange={(e) => setAppResult(e.target.value)} />
            <Btn className="w-full" disabled={!appDesc.trim() || submitApplication.isPending} onClick={() => submitApplication.mutate()}>
              إرسال التطبيق
            </Btn>
          </section>
        </>
      ) : null}
    </AppShell>
  );
}

function statusLabel(status: string) {
  if (status === "approved") return "معتمد";
  if (status === "rejected") return "يحتاج متابعة";
  return "بانتظار الاعتماد";
}

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Btn, Chip } from "@/components/kit";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { fetchMonthData } from "@/lib/participant";
import { fetchCurrentPlan, monthLabel, scoreBand, type PlanRow } from "@/lib/program";

type Participant = { id: string; name: string };

async function fetchParticipants(): Promise<Participant[]> {
  const { data: roles } = await supabase.from("user_roles").select("user_id").eq("role", "participant");
  const ids = (roles ?? []).map((r) => r.user_id);
  if (ids.length === 0) return [];
  const { data: profiles } = await supabase.from("profiles").select("id,full_name").in("id", ids);
  return (profiles ?? []).map((p) => ({ id: p.id, name: p.full_name || "مشارك" }));
}

export function SupervisorHome() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"attendance" | "follow">("attendance");
  const planQuery = useQuery({ queryKey: ["plan"], queryFn: fetchCurrentPlan });
  const listQuery = useQuery({ queryKey: ["participants"], queryFn: fetchParticipants });
  const plan = planQuery.data ?? null;
  const participants = listQuery.data ?? [];

  return (
    <>
      {plan ? (
        <div className="panel-light p-5">
          <p className="text-xs opacity-70">{monthLabel(plan.month)}</p>
          <h2 className="text-lg font-black">{plan.title}</h2>
          <p className="mt-1 text-xs opacity-70">{participants.length} مشارك في البرنامج</p>
        </div>
      ) : null}

      <div className="flex rounded-2xl bg-muted p-1">
        {([
          ["attendance", "الحضور"],
          ["follow", "المتابعة"],
        ] as const).map(([v, l]) => (
          <button
            key={v}
            onClick={() => setTab(v)}
            className={`flex-1 rounded-xl py-2 text-sm font-bold ${tab === v ? "bg-accent text-accent-foreground" : "text-muted-foreground"}`}
          >
            {l}
          </button>
        ))}
      </div>

      {plan
        ? participants.map((p) =>
            tab === "attendance" ? (
              <AttendanceRow key={p.id} participant={p} plan={plan} supervisorId={user?.id ?? ""} />
            ) : (
              <FollowRow key={p.id} participant={p} plan={plan} />
            ),
          )
        : null}
      {participants.length === 0 ? (
        <p className="panel p-5 text-sm text-muted-foreground">لا يوجد مشاركون مسجّلون بعد.</p>
      ) : null}
    </>
  );
}

function AttendanceRow({ participant, plan, supervisorId }: { participant: Participant; plan: PlanRow; supervisorId: string }) {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["attendance", plan.id, participant.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("attendance")
        .select("kind,present")
        .eq("plan_id", plan.id)
        .eq("participant_id", participant.id);
      return data ?? [];
    },
  });

  const mark = useMutation({
    mutationFn: async ({ kind, present }: { kind: "lecture" | "session"; present: boolean }) => {
      const { error } = await supabase.from("attendance").upsert(
        {
          plan_id: plan.id,
          participant_id: participant.id,
          kind,
          present,
          recorded_by: supervisorId,
        },
        { onConflict: "plan_id,participant_id,kind" },
      );
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["attendance"] });
      void qc.invalidateQueries({ queryKey: ["month"] });
      toast.success("تم تحديث الحضور");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const present = (kind: string) => !!data?.find((a) => a.kind === kind)?.present;

  return (
    <section className="panel space-y-3 p-4">
      <h3 className="truncate text-sm font-black">{participant.name}</h3>
      {(["lecture", "session"] as const).map((kind) => (
        <div key={kind} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
          <span className="truncate text-xs text-muted-foreground">
            {kind === "lecture" ? "المحاضرة الشهرية" : "الجلسة الحوارية"}
          </span>
          <div className="flex shrink-0 gap-2">
            <Btn
              tone={present(kind) ? "accent" : "ghost"}
              className="min-h-9 px-3 text-xs"
              onClick={() => mark.mutate({ kind, present: true })}
            >
              حاضر
            </Btn>
            <Btn
              tone="ghost"
              className="min-h-9 px-3 text-xs"
              onClick={() => mark.mutate({ kind, present: false })}
            >
              غائب
            </Btn>
          </div>
        </div>
      ))}
    </section>
  );
}

function FollowRow({ participant, plan }: { participant: Participant; plan: PlanRow }) {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["month", plan.id, participant.id],
    queryFn: () => fetchMonthData(plan, participant.id),
  });

  const review = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "approved" | "rejected" }) => {
      const { error } = await supabase.from("application_submissions").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["month"] });
      toast.success("تم تحديث حالة النشاط");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const pct = data?.score ?? 0;
  const band = scoreBand(pct);

  return (
    <section className="panel space-y-3 p-4">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
        <h3 className="truncate text-sm font-black">{participant.name}</h3>
        <Chip tone={pct >= 70 ? "success" : pct >= 50 ? "accent" : "danger"}>
          {band.label} · {pct}%
        </Chip>
      </header>
      <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground">
        <span>قراءة {data?.readingDays ?? 0}/{data?.totalDays ?? 30}</span>
        <span>عادة {data?.habitDays ?? 0}/{data?.totalDays ?? 30}</span>
        <span>التمارين: {data?.exercise?.done ? "منفّذة" : "لم تُسجّل"}</span>
      </div>
      {data?.application ? (
        <div className="space-y-2 rounded-2xl bg-muted p-3">
          <p className="text-xs font-bold">تمرين التطبيق</p>
          <p className="text-xs text-muted-foreground">{data.application.result ?? data.application.description ?? "—"}</p>
          {data.application.status !== "approved" ? (
            <div className="flex gap-2">
              <Btn className="min-h-9 flex-1 text-xs" onClick={() => review.mutate({ id: data.application!.id, status: "approved" })}>
                اعتماد
              </Btn>
              <Btn tone="ghost" className="min-h-9 flex-1 text-xs" onClick={() => review.mutate({ id: data.application!.id, status: "rejected" })}>
                يحتاج تعديل
              </Btn>
            </div>
          ) : (
            <Chip tone="success">معتمد</Chip>
          )}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">لم يُسجّل تمرين التطبيق بعد.</p>
      )}
    </section>
  );
}

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Btn, Chip } from "@/components/kit";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { fetchMonthData } from "@/lib/participant";
import { fetchCurrentPlan, monthLabel, scoreBand } from "@/lib/program";

type Child = { id: string; name: string };

async function fetchChildren(parentId: string): Promise<Child[]> {
  const { data: links } = await supabase.from("parent_links").select("participant_id").eq("parent_id", parentId);
  const ids = (links ?? []).map((l) => l.participant_id);
  if (ids.length === 0) return [];
  const { data: profiles } = await supabase.from("profiles").select("id,full_name").in("id", ids);
  return (profiles ?? []).map((p) => ({ id: p.id, name: p.full_name || "مشارك" }));
}

export function ParentHome() {
  const { user } = useAuth();
  const childrenQuery = useQuery({
    queryKey: ["children", user?.id],
    enabled: !!user,
    queryFn: () => fetchChildren(user!.id),
  });
  const planQuery = useQuery({ queryKey: ["plan"], queryFn: fetchCurrentPlan });

  const children = childrenQuery.data ?? [];

  if (children.length === 0) {
    return (
      <div className="panel space-y-2 p-5">
        <h2 className="text-sm font-black">لا يوجد مشاركون مرتبطون بحسابك</h2>
        <p className="text-sm text-muted-foreground">
          تواصل مع المشرفة لربط حسابك بحساب ابنك أو ابنتك، وبعدها ستظهر هنا طلبات الاعتماد ومؤشرات المتابعة.
        </p>
      </div>
    );
  }

  return (
    <>
      {planQuery.data ? (
        <div className="panel-accent p-4">
          <p className="text-xs opacity-80">{monthLabel(planQuery.data.month)}</p>
          <p className="text-sm font-black">{planQuery.data.title}</p>
        </div>
      ) : null}
      {children.map((child) => (
        <ChildCard key={child.id} child={child} planId={planQuery.data?.id ?? null} />
      ))}
    </>
  );
}

function ChildCard({ child, planId }: { child: Child; planId: string | null }) {
  const qc = useQueryClient();
  const planQuery = useQuery({ queryKey: ["plan"], queryFn: fetchCurrentPlan });
  const plan = planQuery.data ?? null;

  const dataQuery = useQuery({
    queryKey: ["month", planId, child.id],
    enabled: !!plan,
    queryFn: () => fetchMonthData(plan!, child.id),
  });

  const decide = useMutation({
    mutationFn: async ({ table, id, status }: { table: "lecture_exercises" | "application_submissions"; id: string; status: "approved" | "rejected" }) => {
      const { error } = await supabase.from(table).update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("تم تحديث الاعتماد");
      void qc.invalidateQueries({ queryKey: ["month"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const data = dataQuery.data;
  const pct = data?.score ?? 0;
  const band = scoreBand(pct);

  return (
    <section className="panel space-y-3 p-5">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <h3 className="truncate text-base font-black">{child.name}</h3>
        <Chip tone={pct >= 70 ? "success" : "accent"}>{band.label} · {pct}%</Chip>
      </header>
      <div className="flex gap-2 text-[11px] text-muted-foreground">
        <span>القراءة: {data?.readingDays ?? 0} يوم</span>
        <span>العادة: {data?.habitDays ?? 0} يوم</span>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-bold text-muted-foreground">طلبات الاعتماد</p>
        {data?.exercise && data.exercise.status === "pending" ? (
          <ApprovalRow
            title="تمارين المحاضرة"
            detail={data.exercise.note ?? "بانتظار اعتمادك"}
            onApprove={() => decide.mutate({ table: "lecture_exercises", id: data.exercise!.id, status: "approved" })}
            onReject={() => decide.mutate({ table: "lecture_exercises", id: data.exercise!.id, status: "rejected" })}
          />
        ) : null}
        {data?.application && data.application.status === "pending" ? (
          <ApprovalRow
            title="تمرين المتابعة والتطبيق"
            detail={data.application.result ?? data.application.description ?? "بانتظار اعتمادك"}
            onApprove={() => decide.mutate({ table: "application_submissions", id: data.application!.id, status: "approved" })}
            onReject={() => decide.mutate({ table: "application_submissions", id: data.application!.id, status: "rejected" })}
          />
        ) : null}
        {!(data?.exercise?.status === "pending") && !(data?.application?.status === "pending") ? (
          <p className="text-sm text-muted-foreground">لا توجد طلبات معلّقة حاليًا.</p>
        ) : null}
      </div>
    </section>
  );
}

function ApprovalRow({
  title,
  detail,
  onApprove,
  onReject,
}: {
  title: string;
  detail: string;
  onApprove: () => void;
  onReject: () => void;
}) {
  return (
    <div className="space-y-2 rounded-2xl bg-muted p-3">
      <p className="text-sm font-bold">{title}</p>
      <p className="text-xs text-muted-foreground">{detail}</p>
      <div className="flex gap-2">
        <Btn className="flex-1" onClick={onApprove}>
          تم التنفيذ
        </Btn>
        <Btn tone="ghost" className="flex-1" onClick={onReject}>
          يحتاج متابعة
        </Btn>
      </div>
    </div>
  );
}

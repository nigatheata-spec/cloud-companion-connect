import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Ring, Stat } from "@/components/kit";
import { useAuth } from "@/lib/auth";
import { fetchGroups, fetchMembers, fetchOverview } from "@/lib/admin";
import { fetchCurrentPlan, monthLabel } from "@/lib/program";

export function OverviewPanel() {
  const { user } = useAuth();
  const [groupId, setGroupId] = useState("");

  const planQuery = useQuery({ queryKey: ["plan"], queryFn: fetchCurrentPlan });
  const groupsQuery = useQuery({ queryKey: ["groups"], queryFn: fetchGroups });
  const membersQuery = useQuery({ queryKey: ["members"], queryFn: fetchMembers });

  const plan = planQuery.data ?? null;
  const groups = groupsQuery.data ?? [];
  const members = membersQuery.data ?? [];

  // A supervisor with her own assigned camp starts scoped to it, instead of
  // to the whole program, the moment we know which group that is.
  const myGroup = groups.find((g) => g.supervisor_id === user?.id);
  useEffect(() => {
    if (myGroup && !groupId) setGroupId(myGroup.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myGroup?.id]);

  const participantIds = members
    .filter((m) => m.role === "participant" && (!groupId || m.groupId === groupId))
    .map((m) => m.id);

  const overviewQuery = useQuery({
    queryKey: ["overview", plan?.id, groupId, participantIds.length],
    enabled: !!plan && membersQuery.isSuccess,
    queryFn: () => fetchOverview(plan!, participantIds),
  });

  const o = overviewQuery.data;

  return (
    <>
      {groups.length > 0 ? (
        <label className="block space-y-1.5">
          <span className="text-xs font-bold text-muted-foreground">المجموعة</span>
          <select
            value={groupId}
            onChange={(e) => setGroupId(e.target.value)}
            className="min-h-11 w-full rounded-2xl border border-input bg-surface px-4 text-sm text-foreground outline-none focus:border-accent"
          >
            <option value="">كل المشاركين</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      <section className="panel-light p-5">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
          <div className="min-w-0">
            <p className="text-xs opacity-70">{plan ? monthLabel(plan.month) : "—"}</p>
            <h2 className="truncate text-lg font-black">{plan?.title ?? "لا توجد خطة"}</h2>
            <p className="mt-1 text-xs opacity-70">متوسط الالتزام هذا الشهر</p>
          </div>
          <div className="relative shrink-0">
            <Ring value={o?.averageScore ?? 0} size={72} />
            <span className="absolute inset-0 grid place-items-center text-sm font-black">
              {o?.averageScore ?? 0}%
            </span>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3 border-t border-black/10 pt-4">
          <Stat value={o?.participants ?? 0} label="مشارك" />
          <Stat value={o?.needsFollowUp ?? 0} label="يحتاج متابعة" />
          <Stat value={o?.pendingApprovals ?? 0} label="بانتظار الاعتماد" />
        </div>
      </section>

      <section className="panel space-y-3 p-4">
        <h3 className="text-sm font-black">الحضور هذا الشهر</h3>
        <Bar label="المحاضرة الشهرية" value={o?.lectureAttendance ?? 0} />
        <Bar label="الجلسة الحوارية" value={o?.sessionAttendance ?? 0} />
      </section>
    </>
  );
}

function Bar({ label, value }: { label: string; value: number }) {
  return (
    <div className="space-y-1.5">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 text-xs">
        <span className="truncate text-muted-foreground">{label}</span>
        <span className="font-bold">{value}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-accent transition-all"
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
    </div>
  );
}

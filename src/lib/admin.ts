import { supabase } from "@/integrations/supabase/client";
import { fetchMonthData } from "@/lib/participant";
import type { PlanRow } from "@/lib/program";

export type Group = {
  id: string;
  name: string;
  note: string;
  starts_on: string | null;
  is_active: boolean;
  supervisor_id: string | null;
};

export type Member = {
  id: string;
  name: string;
  role: "participant" | "parent" | "supervisor";
  groupId: string | null;
  parentIds: string[];
};

export async function fetchGroups(): Promise<Group[]> {
  const { data, error } = await supabase
    .from("groups")
    .select("id,name,note,starts_on,is_active,supervisor_id")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

/**
 * The whole roster in one shot. PostgREST embedded selects across these tables
 * type as `never` under the generated Database types, so each table is fetched
 * separately and stitched together here by id.
 */
export async function fetchMembers(): Promise<Member[]> {
  const [{ data: roles }, { data: profiles }, { data: memberships }, { data: links }] =
    await Promise.all([
      supabase.from("user_roles").select("user_id,role"),
      supabase.from("profiles").select("id,full_name"),
      supabase.from("group_members").select("group_id,participant_id"),
      supabase.from("parent_links").select("parent_id,participant_id"),
    ]);

  const nameById = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));
  const groupByParticipant = new Map(
    (memberships ?? []).map((m) => [m.participant_id, m.group_id]),
  );
  const parentsByParticipant = new Map<string, string[]>();
  for (const l of links ?? []) {
    const list = parentsByParticipant.get(l.participant_id) ?? [];
    list.push(l.parent_id);
    parentsByParticipant.set(l.participant_id, list);
  }

  return (roles ?? []).map((r) => ({
    id: r.user_id,
    name: nameById.get(r.user_id) || "بدون اسم",
    role: r.role,
    groupId: groupByParticipant.get(r.user_id) ?? null,
    parentIds: parentsByParticipant.get(r.user_id) ?? [],
  }));
}

export type Overview = {
  participants: number;
  averageScore: number;
  needsFollowUp: number;
  pendingApprovals: number;
  lectureAttendance: number;
  sessionAttendance: number;
};

/** Program-wide snapshot for the current month, optionally scoped to one group. */
export async function fetchOverview(
  plan: PlanRow,
  participantIds: string[],
): Promise<Overview> {
  if (participantIds.length === 0) {
    return {
      participants: 0,
      averageScore: 0,
      needsFollowUp: 0,
      pendingApprovals: 0,
      lectureAttendance: 0,
      sessionAttendance: 0,
    };
  }

  const months = await Promise.all(
    participantIds.map((id) => fetchMonthData(plan, id)),
  );

  const scores = months.map((m) => m.score);
  const averageScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  const needsFollowUp = scores.filter((s) => s < 50).length;

  const pendingApprovals = months.filter(
    (m) => m.application && m.application.status === "pending",
  ).length;

  const { data: attendance } = await supabase
    .from("attendance")
    .select("kind,present,participant_id")
    .eq("plan_id", plan.id)
    .in("participant_id", participantIds);

  const presentCount = (kind: string) =>
    (attendance ?? []).filter((a) => a.kind === kind && a.present).length;

  return {
    participants: participantIds.length,
    averageScore,
    needsFollowUp,
    pendingApprovals,
    lectureAttendance: Math.round((presentCount("lecture") / participantIds.length) * 100),
    sessionAttendance: Math.round((presentCount("session") / participantIds.length) * 100),
  };
}

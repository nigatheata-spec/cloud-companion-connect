import { supabase } from "@/integrations/supabase/client";
import { computeScore, daysInMonth, type PlanRow } from "@/lib/program";

export type DailyLog = {
  id: string;
  kind: string;
  log_date: string;
  confirmed: boolean;
  note: string | null;
  photo_path: string | null;
  status: string;
};

export type MonthData = {
  lecturePresent: boolean;
  sessionPresent: boolean;
  exercise: { id: string; done: boolean; note: string | null; status: string } | null;
  application: {
    id: string;
    done: boolean;
    description: string | null;
    result: string | null;
    photo_path: string | null;
    status: string;
    reviewer_note: string | null;
  } | null;
  logs: DailyLog[];
  readingDays: number;
  habitDays: number;
  score: number;
  totalDays: number;
};

export function readingComplete(log?: DailyLog) {
  return !!log && log.confirmed && !!log.note?.trim();
}

export function habitComplete(log: DailyLog | undefined, requiresPhoto: boolean) {
  if (!log || !log.confirmed) return false;
  if (!requiresPhoto) return true;
  return !!log.photo_path || log.status === "approved";
}

export async function fetchMonthData(plan: PlanRow, participantId: string): Promise<MonthData> {
  const from = plan.month;
  const total = daysInMonth(plan.month);
  const to = `${plan.month.slice(0, 8)}${String(total).padStart(2, "0")}`;

  const [attendance, exercise, application, logs] = await Promise.all([
    supabase.from("attendance").select("kind,present").eq("plan_id", plan.id).eq("participant_id", participantId),
    supabase
      .from("lecture_exercises")
      .select("id,done,note,status")
      .eq("plan_id", plan.id)
      .eq("participant_id", participantId)
      .maybeSingle(),
    supabase
      .from("application_submissions")
      .select("id,done,description,result,photo_path,status,reviewer_note")
      .eq("plan_id", plan.id)
      .eq("participant_id", participantId)
      .maybeSingle(),
    supabase
      .from("daily_logs")
      .select("id,kind,log_date,confirmed,note,photo_path,status")
      .eq("participant_id", participantId)
      .gte("log_date", from)
      .lte("log_date", to),
  ]);

  const rows = (logs.data ?? []) as DailyLog[];
  const readingDays = rows.filter((r) => r.kind === "reading" && readingComplete(r)).length;
  const habitDays = rows.filter((r) => r.kind === "habit" && habitComplete(r, plan.habit_requires_photo)).length;

  const lecturePresent = !!attendance.data?.find((a) => a.kind === "lecture")?.present;
  const sessionPresent = !!attendance.data?.find((a) => a.kind === "session")?.present;
  const ex = exercise.data ?? null;
  const app = application.data ?? null;

  return {
    lecturePresent,
    sessionPresent,
    exercise: ex,
    application: app,
    logs: rows,
    readingDays,
    habitDays,
    totalDays: total,
    score: computeScore({
      monthISO: plan.month,
      lecturePresent,
      sessionPresent,
      exercisesApproved: !!ex && ex.done && ex.status !== "rejected",
      applicationApproved: !!app && app.done && app.status === "approved",
      readingDays,
      habitDays,
    }),
  };
}

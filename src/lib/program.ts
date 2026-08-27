import { supabase } from "@/integrations/supabase/client";

export const WEIGHTS = {
  lecture: 10,
  exercises: 10,
  reading: 20,
  session: 10,
  application: 20,
  habit: 30,
} as const;

export type PlanRow = {
  id: string;
  month: string;
  title: string;
  lecture_topic: string;
  reading_topic: string;
  session_topic: string;
  application_title: string;
  application_description: string;
  application_requires_photo: boolean;
  application_requires_file: boolean;
  application_requires_text: boolean;
  application_requires_parent: boolean;
  habit_title: string;
  habit_requires_photo: boolean;
};

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function monthStart(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

export function daysInMonth(monthISO: string) {
  const [y, m] = monthISO.split("-").map(Number);
  return new Date(y, m, 0).getDate();
}

export function monthLabel(monthISO: string) {
  const [y, m] = monthISO.split("-").map(Number);
  const names = [
    "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
    "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
  ];
  return `${names[m - 1]} ${y}`;
}

export async function fetchPlans(): Promise<PlanRow[]> {
  const { data, error } = await supabase
    .from("monthly_plans")
    .select("*")
    .order("month", { ascending: true });
  if (error) throw error;
  return (data ?? []) as PlanRow[];
}

export async function fetchCurrentPlan(): Promise<PlanRow | null> {
  const plans = await fetchPlans();
  if (plans.length === 0) return null;
  const now = monthStart();
  return plans.find((p) => p.month === now) ?? plans[plans.length - 1];
}

export type ScoreInput = {
  monthISO: string;
  lecturePresent: boolean;
  sessionPresent: boolean;
  exercisesApproved: boolean;
  applicationApproved: boolean;
  readingDays: number;
  habitDays: number;
};

export function computeScore(i: ScoreInput) {
  const total = daysInMonth(i.monthISO);
  const reading = Math.min(i.readingDays / total, 1) * WEIGHTS.reading;
  const habit = Math.min(i.habitDays / total, 1) * WEIGHTS.habit;
  const score =
    (i.lecturePresent ? WEIGHTS.lecture : 0) +
    (i.sessionPresent ? WEIGHTS.session : 0) +
    (i.exercisesApproved ? WEIGHTS.exercises : 0) +
    (i.applicationApproved ? WEIGHTS.application : 0) +
    reading +
    habit;
  return Math.round(score);
}

export function scoreBand(pct: number) {
  if (pct >= 85) return { label: "متميز", tone: "success" as const };
  if (pct >= 70) return { label: "ملتزم", tone: "accent" as const };
  if (pct >= 50) return { label: "يحتاج متابعة", tone: "warn" as const };
  return { label: "متابعة مكثفة", tone: "danger" as const };
}

export const STATUS_LABEL: Record<string, string> = {
  approved: "معتمد",
  pending: "بانتظار الاعتماد",
  rejected: "يحتاج تعديل",
  none: "غير مطلوب",
};

export async function uploadEvidence(userId: string, file: File) {
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("evidence").upload(path, file);
  if (error) throw error;
  return path;
}

export async function evidenceUrl(path: string) {
  const { data } = await supabase.storage.from("evidence").createSignedUrl(path, 3600);
  return data?.signedUrl ?? null;
}

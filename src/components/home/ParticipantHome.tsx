import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { BookOpen, Camera, CheckCircle2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Area, Btn, Chip, Ring, Stat } from "@/components/kit";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { fetchMonthData, habitComplete, readingComplete, type DailyLog } from "@/lib/participant";
import { fetchCurrentPlan, monthLabel, scoreBand, todayISO, uploadEvidence } from "@/lib/program";

export function ParticipantHome() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [readingNote, setReadingNote] = useState("");
  const today = todayISO();

  const planQuery = useQuery({ queryKey: ["plan"], queryFn: fetchCurrentPlan });
  const plan = planQuery.data ?? null;

  const dataQuery = useQuery({
    queryKey: ["month", plan?.id, user?.id],
    enabled: !!plan && !!user,
    queryFn: () => fetchMonthData(plan!, user!.id),
  });

  const data = dataQuery.data;
  const readingToday = data?.logs.find((l) => l.kind === "reading" && l.log_date === today);
  const habitToday = data?.logs.find((l) => l.kind === "habit" && l.log_date === today);

  const saveLog = useMutation({
    mutationFn: async (payload: { kind: "reading" | "habit"; note?: string | undefined; photo_path?: string | undefined }) => {
      if (!plan || !user) return;
      const { error } = await supabase.from("daily_logs").upsert(
        {
          plan_id: plan.id,
          participant_id: user.id,
          kind: payload.kind,
          log_date: today,
          confirmed: true,
          ...(payload.note !== undefined ? { note: payload.note } : {}),
          ...(payload.photo_path ? { photo_path: payload.photo_path } : {}),
        },
        { onConflict: "participant_id,kind,log_date" },
      );
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("تم التسجيل");
      setReadingNote("");
      void qc.invalidateQueries({ queryKey: ["month"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!plan) {
    return <div className="panel p-5 text-sm text-muted-foreground">لا توجد خطة شهرية متاحة بعد.</div>;
  }

  const pct = data?.score ?? 0;
  const band = scoreBand(pct);

  return (
    <>
      <section className="panel-light space-y-4 p-5">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <div className="min-w-0">
            <p className="text-xs opacity-70">{monthLabel(plan.month)}</p>
            <h2 className="truncate text-lg font-black">{plan.title}</h2>
          </div>
          <div className="relative shrink-0">
            <Ring value={pct} />
            <span className="absolute inset-0 grid place-items-center text-sm font-black">{pct}%</span>
          </div>
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-card-foreground/10 pt-3">
          <Stat value={`${data?.readingDays ?? 0}`} label="أيام القراءة" />
          <Stat value={`${data?.habitDays ?? 0}`} label="أيام العادة" />
          <Stat value={band.label} label="حالة الشهر" />
        </div>
      </section>

      <section className="panel space-y-3 p-5">
        <header className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-accent" />
          <h3 className="text-sm font-black">ورد القراءة اليومي</h3>
          {readingComplete(readingToday) ? <Chip tone="success">مكتمل اليوم</Chip> : <Chip>غير مسجّل</Chip>}
        </header>
        {readingComplete(readingToday) ? (
          <p className="rounded-2xl bg-muted p-3 text-sm text-muted-foreground">{readingToday?.note}</p>
        ) : (
          <>
            <Area
              placeholder="اكتب عبارة أو فكرة مما قرأته اليوم"
              value={readingNote}
              onChange={(e) => setReadingNote(e.target.value)}
            />
            <Btn
              className="w-full"
              disabled={!readingNote.trim() || saveLog.isPending}
              onClick={() => saveLog.mutate({ kind: "reading", note: readingNote })}
            >
              <CheckCircle2 className="h-4 w-4" /> قرأت اليوم
            </Btn>
            <p className="text-[11px] text-muted-foreground">لا يُحتسب اليوم مكتملًا دون التأكيد والعبارة معًا.</p>
          </>
        )}
      </section>

      <HabitCard
        habitTitle={plan.habit_title}
        requiresPhoto={plan.habit_requires_photo}
        log={habitToday}
        userId={user?.id ?? ""}
        onSave={(photo_path) => saveLog.mutate({ kind: "habit", photo_path })}
        saving={saveLog.isPending}
      />

      <section className="panel-accent space-y-2 p-5">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4" />
          <h3 className="text-sm font-black">حضور هذا الشهر</h3>
        </div>
        <div className="flex gap-2">
          <Chip tone={data?.lecturePresent ? "success" : "muted"}>
            المحاضرة: {data?.lecturePresent ? "حاضر" : "لم يُعتمد"}
          </Chip>
          <Chip tone={data?.sessionPresent ? "success" : "muted"}>
            الجلسة: {data?.sessionPresent ? "حاضر" : "لم يُعتمد"}
          </Chip>
        </div>
        <p className="text-[11px] opacity-80">الحضور تعتمده المشرفة فقط ولا يمكن تسجيله ذاتيًا.</p>
      </section>
    </>
  );
}

function HabitCard({
  habitTitle,
  requiresPhoto,
  log,
  userId,
  onSave,
  saving,
}: {
  habitTitle: string;
  requiresPhoto: boolean;
  log?: DailyLog | undefined;
  userId: string;
  onSave: (photoPath?: string) => void;
  saving: boolean;
}) {
  const [uploading, setUploading] = useState(false);
  const done = habitComplete(log, requiresPhoto);

  const handleFile = async (file?: File) => {
    if (!file || !userId) return;
    setUploading(true);
    try {
      const path = await uploadEvidence(userId, file);
      onSave(path);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "تعذّر رفع الصورة");
    } finally {
      setUploading(false);
    }
  };

  return (
    <section className="panel space-y-3 p-5">
      <header className="flex flex-wrap items-center gap-2">
        <h3 className="text-sm font-black">عادة الشهر</h3>
        {done ? <Chip tone="success">موثّقة اليوم</Chip> : <Chip>بانتظار التوثيق</Chip>}
      </header>
      <p className="text-sm text-muted-foreground">{habitTitle}</p>
      {done ? null : requiresPhoto ? (
        <label className="flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-accent px-5 text-sm font-bold text-accent-foreground">
          <Camera className="h-4 w-4" />
          {uploading ? "جارٍ الرفع..." : "تأكيد + رفع صورة"}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => void handleFile(e.target.files?.[0])}
          />
        </label>
      ) : (
        <Btn className="w-full" disabled={saving} onClick={() => onSave()}>
          تأكيد تنفيذ العادة
        </Btn>
      )}
    </section>
  );
}

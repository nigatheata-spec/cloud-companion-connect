import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Area, Btn, Field } from "@/components/kit";
import { supabase } from "@/integrations/supabase/client";
import { fetchPlans, monthLabel, type PlanRow } from "@/lib/program";

export function PlanPanel() {
  const plansQuery = useQuery({ queryKey: ["plans"], queryFn: fetchPlans });
  const plans = plansQuery.data ?? [];
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <>
      <p className="panel p-4 text-xs text-muted-foreground">
        محتوى الأشهر الستة مشترك بين جميع المجموعات. أي تعديل هنا يظهر مباشرة
        لدى المشاركين وأولياء الأمور.
      </p>

      {plans.map((plan) =>
        openId === plan.id ? (
          <PlanForm key={plan.id} plan={plan} onDone={() => setOpenId(null)} />
        ) : (
          <button
            key={plan.id}
            onClick={() => setOpenId(plan.id)}
            className="panel w-full space-y-1 p-4 text-right"
          >
            <p className="text-[11px] text-muted-foreground">{monthLabel(plan.month)}</p>
            <h3 className="truncate text-sm font-black">{plan.title}</h3>
            <p className="truncate text-xs text-muted-foreground">{plan.habit_title}</p>
          </button>
        ),
      )}
    </>
  );
}

function PlanForm({ plan, onDone }: { plan: PlanRow; onDone: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    title: plan.title,
    lecture_topic: plan.lecture_topic,
    reading_topic: plan.reading_topic,
    session_topic: plan.session_topic,
    application_title: plan.application_title,
    application_description: plan.application_description,
    habit_title: plan.habit_title,
    habit_requires_photo: plan.habit_requires_photo,
    application_requires_photo: plan.application_requires_photo,
    application_requires_file: plan.application_requires_file,
    application_requires_text: plan.application_requires_text,
    application_requires_parent: plan.application_requires_parent,
  });

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const save = useMutation({
    mutationFn: async () => {
      if (!form.title.trim()) throw new Error("عنوان الشهر مطلوب");
      const { error } = await supabase.from("monthly_plans").update(form).eq("id", plan.id);
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["plans"] });
      void qc.invalidateQueries({ queryKey: ["plan"] });
      void qc.invalidateQueries({ queryKey: ["month"] });
      toast.success("تم حفظ خطة الشهر");
      onDone();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <section className="panel space-y-4 p-5">
      <p className="text-[11px] text-muted-foreground">{monthLabel(plan.month)}</p>

      <Field label="عنوان الشهر" value={form.title} onChange={(e) => set("title", e.target.value)} />
      <Field
        label="موضوع المحاضرة"
        value={form.lecture_topic}
        onChange={(e) => set("lecture_topic", e.target.value)}
      />
      <Field
        label="ورد القراءة"
        value={form.reading_topic}
        onChange={(e) => set("reading_topic", e.target.value)}
      />
      <Field
        label="موضوع الجلسة الحوارية"
        value={form.session_topic}
        onChange={(e) => set("session_topic", e.target.value)}
      />
      <Field
        label="عنوان تمرين التطبيق"
        value={form.application_title}
        onChange={(e) => set("application_title", e.target.value)}
      />
      <Area
        label="وصف تمرين التطبيق"
        value={form.application_description}
        onChange={(e) => set("application_description", e.target.value)}
      />
      <Field
        label="العادة اليومية"
        value={form.habit_title}
        onChange={(e) => set("habit_title", e.target.value)}
      />

      <div className="space-y-2">
        <span className="text-xs font-bold text-muted-foreground">طرق التوثيق المطلوبة</span>
        <Toggle
          label="العادة اليومية تتطلب صورة"
          checked={form.habit_requires_photo}
          onChange={(v) => set("habit_requires_photo", v)}
        />
        <Toggle
          label="التطبيق يتطلب صورة"
          checked={form.application_requires_photo}
          onChange={(v) => set("application_requires_photo", v)}
        />
        <Toggle
          label="التطبيق يتطلب ملفًا"
          checked={form.application_requires_file}
          onChange={(v) => set("application_requires_file", v)}
        />
        <Toggle
          label="التطبيق يتطلب إجابة نصية"
          checked={form.application_requires_text}
          onChange={(v) => set("application_requires_text", v)}
        />
        <Toggle
          label="التطبيق يتطلب اعتماد ولي الأمر"
          checked={form.application_requires_parent}
          onChange={(v) => set("application_requires_parent", v)}
        />
      </div>

      <div className="flex gap-2">
        <Btn className="flex-1" disabled={save.isPending} onClick={() => save.mutate()}>
          حفظ
        </Btn>
        <Btn tone="ghost" className="flex-1" onClick={onDone}>
          إلغاء
        </Btn>
      </div>
    </section>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between rounded-2xl bg-muted px-4 py-3">
      <span className="text-xs font-bold">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-5 w-5 accent-[var(--accent)]"
      />
    </label>
  );
}

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { RequireAuth } from "@/components/RequireAuth";
import { Btn, Chip } from "@/components/kit";
import { useAuth } from "@/lib/auth";
import { PATTERNS, QUESTIONS, scoreAnswers, submitQuizResult, type PersonalityType } from "@/lib/personality";

export const Route = createFileRoute("/quiz")({
  head: () => ({
    meta: [
      { title: "اختبار نمط الشخصية | نجوم القيادة" },
      { name: "description", content: "اكتشف نمط شخصيتك القيادية عبر إجابتك على مجموعة من الأسئلة." },
      { property: "og:title", content: "اختبار نمط الشخصية | نجوم القيادة" },
      { property: "og:description", content: "أجب على الأسئلة لتظهر لك نتيجة نمط شخصيتك." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <RequireAuth>
      <QuizPage />
    </RequireAuth>
  ),
});

function QuizPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<PersonalityType[]>([]);
  const [result, setResult] = useState<PersonalityType | null>(null);
  const [saving, setSaving] = useState(false);

  const answer = async (type: PersonalityType) => {
    const next = [...answers, type];
    setAnswers(next);
    if (step + 1 < QUESTIONS.length) {
      setStep(step + 1);
      return;
    }
    const final = scoreAnswers(next);
    setResult(final);
    if (!user) return;
    setSaving(true);
    try {
      await submitQuizResult(user.id, final);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "تعذّر حفظ النتيجة");
    } finally {
      setSaving(false);
    }
  };

  if (result) {
    const pattern = PATTERNS[result];
    return (
      <AppShell title="نتيجتك" subtitle="اختبار نمط الشخصية">
        <section className="panel-light space-y-3 p-6 text-center">
          <Chip tone="accent">نمط شخصيتك</Chip>
          <h2 className="text-2xl font-black">{pattern.label}</h2>
          <p className="text-sm opacity-80">{pattern.description}</p>
          {saving ? <p className="text-xs opacity-60">جارِ الحفظ…</p> : null}
        </section>
        <Btn className="w-full" onClick={() => void navigate({ to: "/" })}>
          الرجوع للرئيسية
        </Btn>
      </AppShell>
    );
  }

  const q = QUESTIONS[step]!;

  return (
    <AppShell title="اختبار نمط الشخصية" subtitle={`سؤال ${step + 1} من ${QUESTIONS.length}`}>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-accent transition-all"
          style={{ width: `${((step + 1) / QUESTIONS.length) * 100}%` }}
        />
      </div>

      <section className="panel space-y-3 p-5">
        <h2 className="text-base font-black leading-relaxed">{q.prompt}</h2>
        <div className="space-y-2">
          {(Object.keys(q.options) as PersonalityType[]).map((type) => (
            <button
              key={type}
              onClick={() => void answer(type)}
              className="w-full rounded-2xl border border-input bg-surface px-4 py-3 text-right text-sm transition hover:border-accent"
            >
              {q.options[type]}
            </button>
          ))}
        </div>
      </section>
    </AppShell>
  );
}

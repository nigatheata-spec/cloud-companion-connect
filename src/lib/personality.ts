import { supabase } from "@/integrations/supabase/client";

/**
 * A light DISC-style model: four behavioural patterns, scored from forced-
 * choice answers. Chosen because it maps cleanly onto four independent axes
 * (decisive/sociable/steady/careful) so a small question set still produces
 * a confident single result, and it reads naturally alongside the program's
 * leadership framing without requiring clinical language.
 */
export type PersonalityType = "driver" | "expressive" | "amiable" | "analytical";

export const PATTERNS: Record<PersonalityType, { label: string; description: string }> = {
  driver: {
    label: "القائد المبادر",
    description: "يتخذ القرار بسرعة، يحب التحدي، ويميل لتولي زمام الأمور والوصول إلى النتيجة.",
  },
  expressive: {
    label: "الملهم",
    description: "اجتماعي ومتحمس، يقود بالتأثير والحماس، ويحرّك من حوله بالطاقة الإيجابية.",
  },
  amiable: {
    label: "المتعاون",
    description: "صبور وداعم، يقدّم مصلحة الفريق على نفسه، ويبني الثقة والانسجام بين الجميع.",
  },
  analytical: {
    label: "المحلل",
    description: "منظم ودقيق، يفكر قبل أن يتصرف، ويحرص على التخطيط الجيد قبل أي خطوة.",
  },
};

export const PATTERN_ORDER: PersonalityType[] = ["driver", "expressive", "amiable", "analytical"];

export type Question = { prompt: string; options: Record<PersonalityType, string> };

export const QUESTIONS: Question[] = [
  {
    prompt: "عندما يواجه مجموعتك تحدٍ مفاجئ، ماذا تفعل غالبًا؟",
    options: {
      driver: "أبادر فورًا وأقترح حلًا واضحًا",
      expressive: "أشجّع المجموعة وأرفع حماسهم لمواجهته",
      amiable: "أستمع لكل شخص وأحرص أن يشعر الجميع بالأمان",
      analytical: "أفكر بهدوء وأدرس الخيارات قبل أي خطوة",
    },
  },
  {
    prompt: "في العمل الجماعي، أي دور تفضّله؟",
    options: {
      driver: "أن أقود المجموعة وأوزّع المهام",
      expressive: "أن أحمّس الفريق وأبقيه متفائلًا",
      amiable: "أن أدعم زملائي وأحل أي خلاف بينهم",
      analytical: "أن أنظّم التفاصيل وأتابع الجدول الزمني",
    },
  },
  {
    prompt: "كيف تصف رد فعلك عند اتخاذ قرار مهم؟",
    options: {
      driver: "أقرر بسرعة وأتحمّل النتيجة",
      expressive: "أستشير من حولي وأختار ما يحمّسني أكثر",
      amiable: "آخذ وقتي حتى لا أزعج أحدًا بقراري",
      analytical: "أجمع المعلومات وأزن الإيجابيات والسلبيات",
    },
  },
  {
    prompt: "ما الذي يزعجك أكثر أثناء العمل على مشروع؟",
    options: {
      driver: "التأخير وعدم الوصول لنتيجة",
      expressive: "الجو الممل وغياب التفاعل",
      amiable: "الخلافات والتوتر بين الأعضاء",
      analytical: "غياب التنظيم والخطة الواضحة",
    },
  },
  {
    prompt: "كيف يصفك أصدقاؤك المقربون؟",
    options: {
      driver: "حازم وواثق من قراراته",
      expressive: "اجتماعي ومحبوب وسط الناس",
      amiable: "هادئ ومتفهم ويسهل التعامل معه",
      analytical: "دقيق ومنظم في كل شيء",
    },
  },
  {
    prompt: "عند تعلّم شيء جديد، ماذا تفضّل؟",
    options: {
      driver: "أن أجرّبه مباشرة وأتعلّم من الممارسة",
      expressive: "أن أتعلّمه مع مجموعة بجو تفاعلي",
      amiable: "أن أتعلّمه بخطى هادئة مع من أثق بهم",
      analytical: "أن أقرأ وأفهم التفاصيل أولًا",
    },
  },
  {
    prompt: "ما هدفك الأقرب لقلبك في هذا البرنامج؟",
    options: {
      driver: "تحقيق إنجاز ملموس أفخر به",
      expressive: "بناء علاقات جديدة وإلهام من حولي",
      amiable: "أن أكون سندًا لزملائي طوال البرنامج",
      analytical: "أن أطوّر نفسي بخطة واضحة ومدروسة",
    },
  },
  {
    prompt: "عند تلقي ملاحظة على عملك، كيف يكون رد فعلك؟",
    options: {
      driver: "أطلب توضيحًا سريعًا وأصلح الأمر فورًا",
      expressive: "أتقبّلها بروح إيجابية وأشارك رأيي",
      amiable: "أتقبّلها بهدوء وأحرص على مشاعر من قدّمها",
      analytical: "أراجعها بعناية وأدرس كل نقطة فيها",
    },
  },
];

export function scoreAnswers(answers: PersonalityType[]): PersonalityType {
  const tally: Record<PersonalityType, number> = { driver: 0, expressive: 0, amiable: 0, analytical: 0 };
  for (const a of answers) tally[a] += 1;
  let best: PersonalityType = "driver";
  for (const type of PATTERN_ORDER) {
    if (tally[type] > tally[best]) best = type;
  }
  return best;
}

export type PersonalityResult = {
  participant_id: string;
  type: PersonalityType;
  source: "quiz" | "supervisor";
  note: string | null;
  updated_at: string;
};

export async function fetchPersonalityResult(participantId: string): Promise<PersonalityResult | null> {
  const { data, error } = await supabase
    .from("personality_results")
    .select("participant_id,type,source,note,updated_at")
    .eq("participant_id", participantId)
    .maybeSingle();
  if (error) throw error;
  return (data as PersonalityResult | null) ?? null;
}

export async function submitQuizResult(participantId: string, type: PersonalityType) {
  const { error } = await supabase.from("personality_results").upsert(
    { participant_id: participantId, type, source: "quiz", note: null, updated_at: new Date().toISOString() },
    { onConflict: "participant_id" },
  );
  if (error) throw error;
}

export async function overridePersonalityResult(
  participantId: string,
  type: PersonalityType,
  updatedBy: string,
  note: string,
) {
  const { error } = await supabase.from("personality_results").upsert(
    {
      participant_id: participantId,
      type,
      source: "supervisor",
      note: note || null,
      updated_by: updatedBy,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "participant_id" },
  );
  if (error) throw error;
}

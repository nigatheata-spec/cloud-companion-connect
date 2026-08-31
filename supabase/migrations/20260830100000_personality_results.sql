
-- ============================================================
-- Personality assessment (نمط الشخصية)
-- ============================================================
-- One row per participant. A participant sets it by taking the in-app quiz;
-- a supervisor can override it afterwards, e.g. after observing the
-- participant in person. Whichever write happens last wins - there is no
-- separate "supervisor lock" concept, since this is meant to stay a light,
-- editable label rather than a scored assessment record.
CREATE TABLE public.personality_results (
  participant_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('driver','expressive','amiable','analytical')),
  source text NOT NULL DEFAULT 'quiz' CHECK (source IN ('quiz','supervisor')),
  note text,
  updated_by uuid REFERENCES auth.users(id),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.personality_results TO authenticated;
GRANT ALL ON public.personality_results TO service_role;
ALTER TABLE public.personality_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "personality read" ON public.personality_results FOR SELECT TO authenticated
  USING (
    participant_id = auth.uid()
    OR public.is_parent_of(auth.uid(), participant_id)
    OR public.has_role(auth.uid(),'supervisor')
  );

CREATE POLICY "personality own write" ON public.personality_results FOR INSERT TO authenticated
  WITH CHECK (participant_id = auth.uid() OR public.has_role(auth.uid(),'supervisor'));

CREATE POLICY "personality own update" ON public.personality_results FOR UPDATE TO authenticated
  USING (participant_id = auth.uid() OR public.has_role(auth.uid(),'supervisor'));

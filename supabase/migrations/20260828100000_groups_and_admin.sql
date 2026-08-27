
-- ============================================================
-- Groups (camps / cohorts) + supervisor administration
-- ============================================================

-- A group is one camp or intake of participants. Monthly plans stay global
-- (the 6-month curriculum is the same for everyone); groups exist so a
-- supervisor can organise, filter and report on participants separately.
CREATE TABLE public.groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  note text NOT NULL DEFAULT '',
  starts_on date,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.groups TO authenticated;
GRANT ALL ON public.groups TO service_role;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "groups readable" ON public.groups FOR SELECT TO authenticated USING (true);
CREATE POLICY "groups managed by supervisor" ON public.groups FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'supervisor'))
  WITH CHECK (public.has_role(auth.uid(),'supervisor'));

-- One active group per participant keeps "which camp is this yafi3 in?"
-- unambiguous; moving someone is an update, not a second row.
CREATE TABLE public.group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  participant_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  added_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (participant_id)
);
CREATE INDEX group_members_group_idx ON public.group_members(group_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.group_members TO authenticated;
GRANT ALL ON public.group_members TO service_role;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members read" ON public.group_members FOR SELECT TO authenticated
  USING (
    participant_id = auth.uid()
    OR public.is_parent_of(auth.uid(), participant_id)
    OR public.has_role(auth.uid(),'supervisor')
  );
CREATE POLICY "members managed by supervisor" ON public.group_members FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'supervisor'))
  WITH CHECK (public.has_role(auth.uid(),'supervisor'));

-- parent_links previously had only a read policy, so no parent could ever be
-- attached to a participant through the app and the parent role was dead.
-- The supervisor is the one who vouches for the relationship, so they own it.
CREATE POLICY "links managed by supervisor" ON public.parent_links FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'supervisor'))
  WITH CHECK (public.has_role(auth.uid(),'supervisor'));

GRANT INSERT, UPDATE, DELETE ON public.parent_links TO authenticated;

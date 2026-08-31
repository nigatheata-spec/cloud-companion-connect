
-- Each group (camp) can now be assigned to one supervisor, so her
-- attendance/follow-up dashboard shows only her own camp instead of every
-- participant in the program.
ALTER TABLE public.groups
  ADD COLUMN supervisor_id uuid REFERENCES auth.users(id);

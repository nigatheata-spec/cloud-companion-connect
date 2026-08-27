
-- ============================================================
-- Restore EXECUTE on the RLS helper functions
-- ============================================================
--
-- Migrations 20260827115550 and 20260827115559 revoked EXECUTE on
-- has_role() and is_parent_of() from anon, authenticated and PUBLIC.
--
-- Both functions are referenced directly inside RLS policies on profiles,
-- user_roles, parent_links, monthly_plans, attendance, lecture_exercises,
-- daily_logs, application_submissions and storage.objects. A policy is
-- evaluated as the querying role, so with EXECUTE revoked every one of those
-- policies raises
--
--   42501: permission denied for function has_role
--
-- the moment the has_role branch is actually reached. Participants mostly got
-- away with it because `participant_id = auth.uid()` short-circuits first, but
-- supervisors and parents could not read anything at all - which silently
-- downgraded every supervisor to the participant dashboard, since
-- loadProfile() falls back to 'participant' when the role query errors.
--
-- Both functions are SECURITY DEFINER and only return a boolean about an
-- (already non-secret) role assignment, so granting EXECUTE back to
-- authenticated is the intended Supabase pattern. handle_new_user() stays
-- revoked: it is a trigger function and runs as its definer.

GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_parent_of(uuid, uuid) TO authenticated;

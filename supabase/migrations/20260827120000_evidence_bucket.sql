
-- The evidence bucket was created by hand in the Lovable dashboard and was
-- never captured in a migration, so a fresh project had storage policies
-- pointing at a bucket that did not exist.
INSERT INTO storage.buckets (id, name, public)
VALUES ('evidence', 'evidence', false)
ON CONFLICT (id) DO NOTHING;

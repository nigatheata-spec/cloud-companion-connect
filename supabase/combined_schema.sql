-- ============================================================
-- 20260827115542_1fc2fab4-6317-402c-a0b2-9c05a4502bef.sql
-- ============================================================

-- roles
CREATE TYPE public.app_role AS ENUM ('participant','parent','supervisor');
CREATE TYPE public.approval_status AS ENUM ('pending','approved','rejected','none');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  phone text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE TABLE public.parent_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  participant_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (parent_id, participant_id)
);
GRANT SELECT ON public.parent_links TO authenticated;
GRANT ALL ON public.parent_links TO service_role;
ALTER TABLE public.parent_links ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_parent_of(_parent uuid, _participant uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.parent_links WHERE parent_id = _parent AND participant_id = _participant)
$$;

-- profiles policies
CREATE POLICY "own profile read" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(),'supervisor') OR public.is_parent_of(auth.uid(), id));
CREATE POLICY "own profile write" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid() OR public.has_role(auth.uid(),'supervisor'));

CREATE POLICY "roles read" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'supervisor'));
CREATE POLICY "links read" ON public.parent_links FOR SELECT TO authenticated
  USING (parent_id = auth.uid() OR participant_id = auth.uid() OR public.has_role(auth.uid(),'supervisor'));

-- monthly plans
CREATE TABLE public.monthly_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  month date NOT NULL UNIQUE,
  title text NOT NULL,
  lecture_topic text NOT NULL DEFAULT '',
  reading_topic text NOT NULL DEFAULT '',
  session_topic text NOT NULL DEFAULT '',
  application_title text NOT NULL DEFAULT '',
  application_description text NOT NULL DEFAULT '',
  application_requires_photo boolean NOT NULL DEFAULT false,
  application_requires_file boolean NOT NULL DEFAULT false,
  application_requires_text boolean NOT NULL DEFAULT true,
  application_requires_parent boolean NOT NULL DEFAULT false,
  habit_title text NOT NULL DEFAULT '',
  habit_requires_photo boolean NOT NULL DEFAULT true,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.monthly_plans TO authenticated;
GRANT ALL ON public.monthly_plans TO service_role;
ALTER TABLE public.monthly_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "plans readable" ON public.monthly_plans FOR SELECT TO authenticated USING (true);
CREATE POLICY "plans managed by supervisor" ON public.monthly_plans FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'supervisor')) WITH CHECK (public.has_role(auth.uid(),'supervisor'));

-- attendance
CREATE TABLE public.attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES public.monthly_plans(id) ON DELETE CASCADE,
  participant_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('lecture','session')),
  present boolean NOT NULL DEFAULT false,
  recorded_by uuid REFERENCES auth.users(id),
  recorded_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (plan_id, participant_id, kind)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.attendance TO authenticated;
GRANT ALL ON public.attendance TO service_role;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "attendance read" ON public.attendance FOR SELECT TO authenticated
  USING (participant_id = auth.uid() OR public.is_parent_of(auth.uid(), participant_id) OR public.has_role(auth.uid(),'supervisor'));
CREATE POLICY "attendance supervisor write" ON public.attendance FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'supervisor')) WITH CHECK (public.has_role(auth.uid(),'supervisor'));

-- lecture exercises
CREATE TABLE public.lecture_exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES public.monthly_plans(id) ON DELETE CASCADE,
  participant_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  done boolean NOT NULL DEFAULT false,
  note text,
  status public.approval_status NOT NULL DEFAULT 'pending',
  reviewer_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (plan_id, participant_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lecture_exercises TO authenticated;
GRANT ALL ON public.lecture_exercises TO service_role;
ALTER TABLE public.lecture_exercises ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ex read" ON public.lecture_exercises FOR SELECT TO authenticated
  USING (participant_id = auth.uid() OR public.is_parent_of(auth.uid(), participant_id) OR public.has_role(auth.uid(),'supervisor'));
CREATE POLICY "ex own write" ON public.lecture_exercises FOR INSERT TO authenticated WITH CHECK (participant_id = auth.uid());
CREATE POLICY "ex own update" ON public.lecture_exercises FOR UPDATE TO authenticated
  USING (participant_id = auth.uid() OR public.is_parent_of(auth.uid(), participant_id) OR public.has_role(auth.uid(),'supervisor'));

-- daily logs
CREATE TABLE public.daily_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES public.monthly_plans(id) ON DELETE CASCADE,
  participant_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('reading','habit')),
  log_date date NOT NULL DEFAULT current_date,
  confirmed boolean NOT NULL DEFAULT false,
  note text,
  photo_path text,
  status public.approval_status NOT NULL DEFAULT 'none',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (participant_id, kind, log_date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.daily_logs TO authenticated;
GRANT ALL ON public.daily_logs TO service_role;
ALTER TABLE public.daily_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "logs read" ON public.daily_logs FOR SELECT TO authenticated
  USING (participant_id = auth.uid() OR public.is_parent_of(auth.uid(), participant_id) OR public.has_role(auth.uid(),'supervisor'));
CREATE POLICY "logs own insert" ON public.daily_logs FOR INSERT TO authenticated WITH CHECK (participant_id = auth.uid());
CREATE POLICY "logs update" ON public.daily_logs FOR UPDATE TO authenticated
  USING (participant_id = auth.uid() OR public.is_parent_of(auth.uid(), participant_id) OR public.has_role(auth.uid(),'supervisor'));

-- application submissions
CREATE TABLE public.application_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES public.monthly_plans(id) ON DELETE CASCADE,
  participant_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  done boolean NOT NULL DEFAULT false,
  description text,
  result text,
  photo_path text,
  file_path text,
  status public.approval_status NOT NULL DEFAULT 'pending',
  reviewer_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (plan_id, participant_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.application_submissions TO authenticated;
GRANT ALL ON public.application_submissions TO service_role;
ALTER TABLE public.application_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "app read" ON public.application_submissions FOR SELECT TO authenticated
  USING (participant_id = auth.uid() OR public.is_parent_of(auth.uid(), participant_id) OR public.has_role(auth.uid(),'supervisor'));
CREATE POLICY "app own insert" ON public.application_submissions FOR INSERT TO authenticated WITH CHECK (participant_id = auth.uid());
CREATE POLICY "app update" ON public.application_submissions FOR UPDATE TO authenticated
  USING (participant_id = auth.uid() OR public.is_parent_of(auth.uid(), participant_id) OR public.has_role(auth.uid(),'supervisor'));

-- new user handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name',''))
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, COALESCE((NEW.raw_user_meta_data->>'role')::public.app_role, 'participant'))
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- seed the 6 monthly plans
INSERT INTO public.monthly_plans (month, title, lecture_topic, reading_topic, session_topic, application_title, application_description, habit_title) VALUES
('2026-08-01','من المخيم إلى الحياة اليومية','المقدمة والعادة الأولى «كن مبادرًا»','ورد القراءة اليومي','كيف أكون مسؤولًا عن قراراتي؟','مبادرة شخصية','مبادرة شخصية في المنزل أو المدرسة ورفع تقرير مختصر عن أثرها','كتابة 3 أهداف لليوم والالتزام بإنجازها'),
('2026-09-01','صناعة الرؤية الشخصية','العادة الثانية «ابدأ والنهاية في ذهنك»','ورد القراءة اليومي','الرؤية الشخصية','لوحة الأهداف','تعديل الرؤية الشخصية ولوحة الأهداف وتحديد خطوات عملية للأشهر القادمة','المحافظة على الصلوات'),
('2026-10-01','إدارة الوقت والأولويات','العادة الثالثة «ابدأ بالأهم»','ورد القراءة اليومي','إدارة الوقت','خطة أسبوعية','تطبيق خطة أسبوعية لإدارة الوقت لمدة أسبوعين ومناقشة النتائج والعقبات','المشي أو ممارسة الرياضة 15 دقيقة يوميًا'),
('2026-11-01','القيادة بالتأثير والعلاقات','العادتان الرابعة والخامسة','ورد القراءة اليومي','التأثير والعلاقات','الاستماع الفعال','تطبيق الاستماع الفعال في موقف حقيقي وتوثيق التجربة والدروس المستفادة','مساعدة شخص واحد يوميًا'),
('2026-12-01','العمل الجماعي وصناعة المبادرات','العادة السادسة «تكاتف مع الآخرين»','ورد القراءة اليومي','العمل الجماعي','مبادرة جماعية','المشاركة في مبادرة أو مشروع جماعي وتوضيح الدور القيادي أثناء الإنجاز','الابتعاد عن استخدام الهاتف ساعة يوميًا'),
('2027-01-01','كيف أستمر قائدًا بعد انتهاء البرنامج؟','العادة السابعة «اشحذ المنشار»','ورد القراءة اليومي','الاستمرارية','ملف الإنجاز','إعداد ملف إنجاز شخصي وخطة تطوير للأشهر الستة التالية','كتابة إنجاز واحد تعلمه أو حققه كل يوم');


-- ============================================================
-- 20260827115550_4031a6c7-89f1-4d5b-90f0-efc1ec4d5af7.sql
-- ============================================================

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_parent_of(uuid, uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;


-- ============================================================
-- 20260827115559_dfd979f2-f300-4322-b388-ecbc96c97391.sql
-- ============================================================

REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_parent_of(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;


-- ============================================================
-- 20260827115613_d8dc4c51-0635-4867-8a01-73bd0f508bdf.sql
-- ============================================================

CREATE POLICY "evidence own insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'evidence' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "evidence read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'evidence' AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR public.has_role(auth.uid(),'supervisor')
    OR public.is_parent_of(auth.uid(), ((storage.foldername(name))[1])::uuid)
  ));
CREATE POLICY "evidence own update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'evidence' AND (storage.foldername(name))[1] = auth.uid()::text);


-- ============================================================
-- storage bucket (was created by hand in the Lovable dashboard,
-- never captured in a migration)
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('evidence', 'evidence', false)
ON CONFLICT (id) DO NOTHING;

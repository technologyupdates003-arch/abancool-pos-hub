
-- 1. Add 'school' to business_type enum
ALTER TYPE business_type ADD VALUE IF NOT EXISTS 'school';

-- 2. School-specific role within a business (extends member_role concept)
DO $$ BEGIN
  CREATE TYPE school_role AS ENUM ('principal','teacher','student','parent','accountant');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE attendance_status AS ENUM ('present','absent','late','excused');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE fee_status AS ENUM ('unpaid','partial','paid','overdue');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3. Classes / streams
CREATE TABLE public.school_classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  name text NOT NULL,
  grade_level text,
  stream text,
  academic_year text NOT NULL,
  class_teacher_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.school_classes ENABLE ROW LEVEL SECURITY;

-- 4. Subjects
CREATE TABLE public.school_subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  name text NOT NULL,
  code text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.school_subjects ENABLE ROW LEVEL SECURITY;

-- 5. Students
CREATE TABLE public.school_students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  admission_no text NOT NULL,
  full_name text NOT NULL,
  date_of_birth date,
  gender text,
  class_id uuid REFERENCES public.school_classes(id) ON DELETE SET NULL,
  parent_name text,
  parent_phone text,
  parent_email text,
  guardian_relation text,
  address text,
  medical_notes text,
  photo_url text,
  user_id uuid,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (business_id, admission_no)
);
ALTER TABLE public.school_students ENABLE ROW LEVEL SECURITY;

-- 6. Teachers
CREATE TABLE public.school_teachers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  user_id uuid,
  full_name text NOT NULL,
  email text,
  phone text,
  qualification text,
  subjects text[],
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.school_teachers ENABLE ROW LEVEL SECURITY;

-- 7. Parents
CREATE TABLE public.school_parents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  user_id uuid,
  full_name text NOT NULL,
  email text,
  phone text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.school_parents ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.school_parent_students (
  parent_id uuid NOT NULL REFERENCES public.school_parents(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.school_students(id) ON DELETE CASCADE,
  PRIMARY KEY (parent_id, student_id)
);
ALTER TABLE public.school_parent_students ENABLE ROW LEVEL SECURITY;

-- 8. Attendance
CREATE TABLE public.school_attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  student_id uuid NOT NULL REFERENCES public.school_students(id) ON DELETE CASCADE,
  class_id uuid REFERENCES public.school_classes(id) ON DELETE SET NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  status attendance_status NOT NULL DEFAULT 'present',
  marked_by uuid,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, date)
);
ALTER TABLE public.school_attendance ENABLE ROW LEVEL SECURITY;

-- 9. Exams
CREATE TABLE public.school_exams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  name text NOT NULL,
  term text,
  academic_year text NOT NULL,
  exam_type text,
  start_date date,
  end_date date,
  max_score numeric NOT NULL DEFAULT 100,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.school_exams ENABLE ROW LEVEL SECURITY;

-- 10. Exam results
CREATE TABLE public.school_exam_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  exam_id uuid NOT NULL REFERENCES public.school_exams(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.school_students(id) ON DELETE CASCADE,
  subject_id uuid REFERENCES public.school_subjects(id) ON DELETE SET NULL,
  score numeric NOT NULL DEFAULT 0,
  grade text,
  remarks text,
  entered_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (exam_id, student_id, subject_id)
);
ALTER TABLE public.school_exam_results ENABLE ROW LEVEL SECURITY;

-- 11. Fee structures
CREATE TABLE public.school_fee_structures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  class_id uuid REFERENCES public.school_classes(id) ON DELETE SET NULL,
  term text NOT NULL,
  academic_year text NOT NULL,
  item_name text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.school_fee_structures ENABLE ROW LEVEL SECURITY;

-- 12. Fee invoices
CREATE TABLE public.school_fee_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  student_id uuid NOT NULL REFERENCES public.school_students(id) ON DELETE CASCADE,
  invoice_number text NOT NULL,
  term text NOT NULL,
  academic_year text NOT NULL,
  total numeric NOT NULL DEFAULT 0,
  paid numeric NOT NULL DEFAULT 0,
  balance numeric NOT NULL DEFAULT 0,
  due_date date,
  status fee_status NOT NULL DEFAULT 'unpaid',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (business_id, invoice_number)
);
ALTER TABLE public.school_fee_invoices ENABLE ROW LEVEL SECURITY;

-- 13. Fee payments
CREATE TABLE public.school_fee_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  invoice_id uuid NOT NULL REFERENCES public.school_fee_invoices(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.school_students(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  method text NOT NULL DEFAULT 'cash',
  mpesa_receipt text,
  mpesa_request_id text,
  phone_number text,
  status text NOT NULL DEFAULT 'completed',
  recorded_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.school_fee_payments ENABLE ROW LEVEL SECURITY;

-- 14. Announcements
CREATE TABLE public.school_announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  audience text NOT NULL DEFAULT 'all', -- all|teachers|students|parents|class
  target_class_id uuid REFERENCES public.school_classes(id) ON DELETE SET NULL,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.school_announcements ENABLE ROW LEVEL SECURITY;

-- ===== Helper: is teacher / student / parent in this business =====
CREATE OR REPLACE FUNCTION public.is_school_teacher(_user_id uuid, _business_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.school_teachers WHERE user_id = _user_id AND business_id = _business_id AND is_active = true)
$$;

CREATE OR REPLACE FUNCTION public.is_school_parent(_user_id uuid, _business_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.school_parents WHERE user_id = _user_id AND business_id = _business_id)
$$;

CREATE OR REPLACE FUNCTION public.is_school_student(_user_id uuid, _business_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.school_students WHERE user_id = _user_id AND business_id = _business_id AND is_active = true)
$$;

CREATE OR REPLACE FUNCTION public.parent_owns_student(_user_id uuid, _student_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.school_parent_students sps
    JOIN public.school_parents p ON p.id = sps.parent_id
    WHERE p.user_id = _user_id AND sps.student_id = _student_id
  )
$$;

-- ===== RLS Policies =====
-- Generic: school admins (owner/manager) manage everything in their business
-- Members can view; restricted roles get scoped reads.

-- school_classes
CREATE POLICY "members view classes" ON public.school_classes FOR SELECT
  USING (is_business_member(auth.uid(), business_id));
CREATE POLICY "admins manage classes" ON public.school_classes FOR ALL
  USING (get_member_role(auth.uid(), business_id) = ANY(ARRAY['owner'::member_role,'manager'::member_role]));

-- school_subjects
CREATE POLICY "members view subjects" ON public.school_subjects FOR SELECT
  USING (is_business_member(auth.uid(), business_id));
CREATE POLICY "admins manage subjects" ON public.school_subjects FOR ALL
  USING (get_member_role(auth.uid(), business_id) = ANY(ARRAY['owner'::member_role,'manager'::member_role]));

-- school_students
CREATE POLICY "members view students" ON public.school_students FOR SELECT
  USING (is_business_member(auth.uid(), business_id));
CREATE POLICY "students view own record" ON public.school_students FOR SELECT
  USING (user_id = auth.uid());
CREATE POLICY "parents view own children" ON public.school_students FOR SELECT
  USING (parent_owns_student(auth.uid(), id));
CREATE POLICY "admins manage students" ON public.school_students FOR ALL
  USING (get_member_role(auth.uid(), business_id) = ANY(ARRAY['owner'::member_role,'manager'::member_role]));

-- school_teachers
CREATE POLICY "members view teachers" ON public.school_teachers FOR SELECT
  USING (is_business_member(auth.uid(), business_id));
CREATE POLICY "teacher views self" ON public.school_teachers FOR SELECT
  USING (user_id = auth.uid());
CREATE POLICY "admins manage teachers" ON public.school_teachers FOR ALL
  USING (get_member_role(auth.uid(), business_id) = ANY(ARRAY['owner'::member_role,'manager'::member_role]));

-- school_parents
CREATE POLICY "members view parents" ON public.school_parents FOR SELECT
  USING (is_business_member(auth.uid(), business_id));
CREATE POLICY "parent views self" ON public.school_parents FOR SELECT
  USING (user_id = auth.uid());
CREATE POLICY "admins manage parents" ON public.school_parents FOR ALL
  USING (get_member_role(auth.uid(), business_id) = ANY(ARRAY['owner'::member_role,'manager'::member_role]));

-- school_parent_students
CREATE POLICY "members view parent links" ON public.school_parent_students FOR SELECT
  USING (EXISTS(SELECT 1 FROM public.school_parents p WHERE p.id = parent_id AND is_business_member(auth.uid(), p.business_id)));
CREATE POLICY "admins manage parent links" ON public.school_parent_students FOR ALL
  USING (EXISTS(SELECT 1 FROM public.school_parents p WHERE p.id = parent_id AND get_member_role(auth.uid(), p.business_id) = ANY(ARRAY['owner'::member_role,'manager'::member_role])));

-- school_attendance
CREATE POLICY "members view attendance" ON public.school_attendance FOR SELECT
  USING (is_business_member(auth.uid(), business_id));
CREATE POLICY "parent views child attendance" ON public.school_attendance FOR SELECT
  USING (parent_owns_student(auth.uid(), student_id));
CREATE POLICY "student views own attendance" ON public.school_attendance FOR SELECT
  USING (EXISTS(SELECT 1 FROM public.school_students s WHERE s.id = student_id AND s.user_id = auth.uid()));
CREATE POLICY "members mark attendance" ON public.school_attendance FOR INSERT
  WITH CHECK (is_business_member(auth.uid(), business_id));
CREATE POLICY "admins update attendance" ON public.school_attendance FOR UPDATE
  USING (get_member_role(auth.uid(), business_id) = ANY(ARRAY['owner'::member_role,'manager'::member_role]));

-- school_exams
CREATE POLICY "members view exams" ON public.school_exams FOR SELECT
  USING (is_business_member(auth.uid(), business_id));
CREATE POLICY "students view exams" ON public.school_exams FOR SELECT
  USING (is_school_student(auth.uid(), business_id));
CREATE POLICY "parents view exams" ON public.school_exams FOR SELECT
  USING (is_school_parent(auth.uid(), business_id));
CREATE POLICY "admins manage exams" ON public.school_exams FOR ALL
  USING (get_member_role(auth.uid(), business_id) = ANY(ARRAY['owner'::member_role,'manager'::member_role]));

-- school_exam_results
CREATE POLICY "members view results" ON public.school_exam_results FOR SELECT
  USING (is_business_member(auth.uid(), business_id));
CREATE POLICY "student views own results" ON public.school_exam_results FOR SELECT
  USING (EXISTS(SELECT 1 FROM public.school_students s WHERE s.id = student_id AND s.user_id = auth.uid()));
CREATE POLICY "parent views child results" ON public.school_exam_results FOR SELECT
  USING (parent_owns_student(auth.uid(), student_id));
CREATE POLICY "admins manage results" ON public.school_exam_results FOR ALL
  USING (get_member_role(auth.uid(), business_id) = ANY(ARRAY['owner'::member_role,'manager'::member_role]));

-- school_fee_structures
CREATE POLICY "members view fee structures" ON public.school_fee_structures FOR SELECT
  USING (is_business_member(auth.uid(), business_id));
CREATE POLICY "parents view fee structures" ON public.school_fee_structures FOR SELECT
  USING (is_school_parent(auth.uid(), business_id));
CREATE POLICY "admins manage fee structures" ON public.school_fee_structures FOR ALL
  USING (get_member_role(auth.uid(), business_id) = ANY(ARRAY['owner'::member_role,'manager'::member_role]));

-- school_fee_invoices
CREATE POLICY "members view invoices" ON public.school_fee_invoices FOR SELECT
  USING (is_business_member(auth.uid(), business_id));
CREATE POLICY "parent views child invoices" ON public.school_fee_invoices FOR SELECT
  USING (parent_owns_student(auth.uid(), student_id));
CREATE POLICY "student views own invoices" ON public.school_fee_invoices FOR SELECT
  USING (EXISTS(SELECT 1 FROM public.school_students s WHERE s.id = student_id AND s.user_id = auth.uid()));
CREATE POLICY "admins manage invoices" ON public.school_fee_invoices FOR ALL
  USING (get_member_role(auth.uid(), business_id) = ANY(ARRAY['owner'::member_role,'manager'::member_role]));

-- school_fee_payments
CREATE POLICY "members view fee payments" ON public.school_fee_payments FOR SELECT
  USING (is_business_member(auth.uid(), business_id));
CREATE POLICY "parent views child payments" ON public.school_fee_payments FOR SELECT
  USING (parent_owns_student(auth.uid(), student_id));
CREATE POLICY "members record payments" ON public.school_fee_payments FOR INSERT
  WITH CHECK (is_business_member(auth.uid(), business_id) OR parent_owns_student(auth.uid(), student_id));

-- school_announcements
CREATE POLICY "members view announcements" ON public.school_announcements FOR SELECT
  USING (is_business_member(auth.uid(), business_id));
CREATE POLICY "students view announcements" ON public.school_announcements FOR SELECT
  USING (is_school_student(auth.uid(), business_id));
CREATE POLICY "parents view announcements" ON public.school_announcements FOR SELECT
  USING (is_school_parent(auth.uid(), business_id));
CREATE POLICY "admins manage announcements" ON public.school_announcements FOR ALL
  USING (get_member_role(auth.uid(), business_id) = ANY(ARRAY['owner'::member_role,'manager'::member_role]));

-- updated_at triggers
CREATE TRIGGER trg_school_classes_updated BEFORE UPDATE ON public.school_classes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_school_students_updated BEFORE UPDATE ON public.school_students FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_school_teachers_updated BEFORE UPDATE ON public.school_teachers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_school_results_updated BEFORE UPDATE ON public.school_exam_results FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_school_invoices_updated BEFORE UPDATE ON public.school_fee_invoices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

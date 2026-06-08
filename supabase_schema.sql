-- ==========================================================
-- Supabase Schema for Quran and General Lessons Management
-- مخطط قاعدة البيانات لجمعية تحفيظ القرآن والدروس
-- ==========================================================

-- 1. جدول الدروس (lessons)
CREATE TABLE IF NOT EXISTS public.lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. جدول المدرسين (teachers)
CREATE TABLE IF NOT EXISTS public.teachers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    gender TEXT NOT NULL CHECK (gender IN ('male', 'female')),
    salary_type TEXT NOT NULL CHECK (salary_type IN ('fixed', 'ratio')),
    salary_value NUMERIC NOT NULL DEFAULT 0,
    phone TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. جدول المجموعات (groups)
CREATE TABLE IF NOT EXISTS public.groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    teacher_id UUID REFERENCES public.teachers(id) ON DELETE CASCADE,
    lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE,
    schedule TEXT,
    gender_target TEXT NOT NULL CHECK (gender_target IN ('male', 'female', 'all')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. جدول الطلاب (students)
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    age INTEGER CHECK (age >= 0),
    birth_date DATE,
    gender TEXT NOT NULL CHECK (gender IN ('male', 'female')),
    parent_name TEXT,
    parent_phone TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. جدول التسجيلات والاشتراكات (enrollments)
CREATE TABLE IF NOT EXISTS public.enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
    lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE,
    price NUMERIC NOT NULL DEFAULT 0,
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- تمكين سياسات الحماية (Row Level Security) - اختياري للتجربة العامة
-- لتبسيط التطوير الأولي، يمكن السماح بالوصول العام أو ضبط السياسات كالتالي:

ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

-- سياسات وصول عامة (مفتوحة مؤقتاً للتجربة)
CREATE POLICY "Allow public read access on lessons" ON public.lessons FOR SELECT USING (true);
CREATE POLICY "Allow public write access on lessons" ON public.lessons FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow public read access on teachers" ON public.teachers FOR SELECT USING (true);
CREATE POLICY "Allow public write access on teachers" ON public.teachers FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow public read access on groups" ON public.groups FOR SELECT USING (true);
CREATE POLICY "Allow public write access on groups" ON public.groups FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow public read access on students" ON public.students FOR SELECT USING (true);
CREATE POLICY "Allow public write access on students" ON public.students FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow public read access on enrollments" ON public.enrollments FOR SELECT USING (true);
CREATE POLICY "Allow public write access on enrollments" ON public.enrollments FOR ALL USING (true) WITH CHECK (true);

-- ==========================================================
-- Supabase Schema for Multi-Tenant SaaS Quran Management Platform
-- مخطط قاعدة البيانات لمنصة تحفيظ القرآن متعددة الجمعيات
-- ==========================================================

-- 1. تنظيف الجداول القديمة لضمان بنية نظيفة ومعزولة
DROP TABLE IF EXISTS public.invoice_items CASCADE;
DROP TABLE IF EXISTS public.invoices CASCADE;
DROP TABLE IF EXISTS public.enrollments CASCADE;
DROP TABLE IF EXISTS public.expenses CASCADE;
DROP TABLE IF EXISTS public.groups CASCADE;
DROP TABLE IF EXISTS public.students CASCADE;
DROP TABLE IF EXISTS public.teachers CASCADE;
DROP TABLE IF EXISTS public.lessons CASCADE;
DROP TABLE IF EXISTS public.academic_levels CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.associations CASCADE;

-- 2. جدول الجمعيات (associations)
CREATE TABLE public.associations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
    trial_ends_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. جدول ملفات المستخدمين (profiles) المرتبط بـ auth.users
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('super_admin', 'association_admin')),
    association_id UUID REFERENCES public.associations(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.1. جدول المستويات الدراسية والتخصصات (academic_levels)
CREATE TABLE public.academic_levels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    stage TEXT NOT NULL CHECK (stage IN ('primary', 'middle', 'high', 'university', 'other')),
    specializations TEXT[] NOT NULL DEFAULT '{}',
    association_id UUID REFERENCES public.associations(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. جدول الدروس (lessons)
CREATE TABLE public.lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    association_id UUID REFERENCES public.associations(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. جدول المدرسين (teachers)
CREATE TABLE public.teachers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    gender TEXT NOT NULL CHECK (gender IN ('male', 'female')),
    salary_type TEXT NOT NULL CHECK (salary_type IN ('fixed', 'ratio')),
    salary_value NUMERIC NOT NULL DEFAULT 0,
    phone TEXT,
    association_id UUID REFERENCES public.associations(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. جدول المجموعات (groups)
CREATE TABLE public.groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    teacher_id UUID REFERENCES public.teachers(id) ON DELETE CASCADE,
    lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE,
    schedule TEXT,
    gender_target TEXT NOT NULL CHECK (gender_target IN ('male', 'female', 'all')),
    level_id UUID REFERENCES public.academic_levels(id) ON DELETE SET NULL,
    specialization TEXT,
    association_id UUID REFERENCES public.associations(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. جدول الطلاب (students)
CREATE TABLE public.students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    age INTEGER CHECK (age >= 0),
    birth_date DATE,
    gender TEXT CHECK (gender IN ('male', 'female')),
    parent_name TEXT,
    parent_phone TEXT,
    academic_level TEXT,
    specialization TEXT,
    registration_date DATE DEFAULT CURRENT_DATE,
    association_id UUID REFERENCES public.associations(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. جدول التسجيلات والاشتراكات (enrollments)
CREATE TABLE public.enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
    lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE,
    price NUMERIC NOT NULL DEFAULT 0,
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE NOT NULL,
    payment_status TEXT NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('paid', 'partial', 'unpaid')),
    paid_amount NUMERIC NOT NULL DEFAULT 0,
    notes TEXT DEFAULT '',
    association_id UUID REFERENCES public.associations(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8.1. جدول الفواتير (invoices)
CREATE TABLE public.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    total_amount NUMERIC NOT NULL DEFAULT 0,
    paid_amount NUMERIC NOT NULL DEFAULT 0,
    payment_status TEXT NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('paid', 'partial', 'unpaid')),
    invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '1 month'),
    association_id UUID REFERENCES public.associations(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8.2. جدول بنود الفواتير (invoice_items)
CREATE TABLE public.invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE,
    enrollment_id UUID REFERENCES public.enrollments(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    amount NUMERIC NOT NULL DEFAULT 0,
    association_id UUID REFERENCES public.associations(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. جدول النفقات والمالية (expenses)
CREATE TABLE public.expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    amount NUMERIC NOT NULL DEFAULT 0,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    category TEXT NOT NULL CHECK (category IN ('rent', 'bills', 'salaries', 'supplies', 'other')),
    description TEXT,
    association_id UUID REFERENCES public.associations(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================================
-- سياسات الحماية ونظام تصفية البيانات (RLS Policies)
-- ==========================================================

-- تفعيل الـ RLS على كافة الجداول
ALTER TABLE public.associations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;

-- دوال أمان لجلب معرف الجلسة الحالية ودور المستخدم
CREATE OR REPLACE FUNCTION public.get_user_association_id()
RETURNS UUID AS $$
  SELECT association_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- سياسات جدول الجمعيات (associations)
CREATE POLICY "super_admin_all_associations" ON public.associations 
  FOR ALL USING (public.get_user_role() = 'super_admin');

CREATE POLICY "association_admin_select_own_association" ON public.associations 
  FOR SELECT USING (public.get_user_role() = 'association_admin' AND id = public.get_user_association_id());

-- سياسات جدول ملفات التعريف (profiles)
CREATE POLICY "super_admin_all_profiles" ON public.profiles 
  FOR ALL USING (public.get_user_role() = 'super_admin');

CREATE POLICY "users_select_own_profile" ON public.profiles 
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "users_update_own_profile" ON public.profiles
  FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- سياسات الجداول التشغيلية (معزولة لكل جمعية ومفتوحة للمطور)
-- المستويات الدراسية والتخصصات
CREATE POLICY "academic_levels_super_admin" ON public.academic_levels FOR ALL USING (public.get_user_role() = 'super_admin');
CREATE POLICY "academic_levels_association_admin" ON public.academic_levels FOR ALL 
  USING (public.get_user_role() = 'association_admin' AND association_id = public.get_user_association_id())
  WITH CHECK (public.get_user_role() = 'association_admin' AND association_id = public.get_user_association_id());

-- الدروس
CREATE POLICY "lessons_super_admin" ON public.lessons FOR ALL USING (public.get_user_role() = 'super_admin');
CREATE POLICY "lessons_association_admin" ON public.lessons FOR ALL 
  USING (public.get_user_role() = 'association_admin' AND association_id = public.get_user_association_id())
  WITH CHECK (public.get_user_role() = 'association_admin' AND association_id = public.get_user_association_id());

-- المدرسين
CREATE POLICY "teachers_super_admin" ON public.teachers FOR ALL USING (public.get_user_role() = 'super_admin');
CREATE POLICY "teachers_association_admin" ON public.teachers FOR ALL 
  USING (public.get_user_role() = 'association_admin' AND association_id = public.get_user_association_id())
  WITH CHECK (public.get_user_role() = 'association_admin' AND association_id = public.get_user_association_id());

-- المجموعات
CREATE POLICY "groups_super_admin" ON public.groups FOR ALL USING (public.get_user_role() = 'super_admin');
CREATE POLICY "groups_association_admin" ON public.groups FOR ALL 
  USING (public.get_user_role() = 'association_admin' AND association_id = public.get_user_association_id())
  WITH CHECK (public.get_user_role() = 'association_admin' AND association_id = public.get_user_association_id());

-- الطلاب
CREATE POLICY "students_super_admin" ON public.students FOR ALL USING (public.get_user_role() = 'super_admin');
CREATE POLICY "students_association_admin" ON public.students FOR ALL 
  USING (public.get_user_role() = 'association_admin' AND association_id = public.get_user_association_id())
  WITH CHECK (public.get_user_role() = 'association_admin' AND association_id = public.get_user_association_id());

-- التسجيلات
CREATE POLICY "enrollments_super_admin" ON public.enrollments FOR ALL USING (public.get_user_role() = 'super_admin');
CREATE POLICY "enrollments_association_admin" ON public.enrollments FOR ALL 
  USING (public.get_user_role() = 'association_admin' AND association_id = public.get_user_association_id())
  WITH CHECK (public.get_user_role() = 'association_admin' AND association_id = public.get_user_association_id());

-- النفقات
CREATE POLICY "expenses_super_admin" ON public.expenses FOR ALL USING (public.get_user_role() = 'super_admin');
CREATE POLICY "expenses_association_admin" ON public.expenses FOR ALL 
  USING (public.get_user_role() = 'association_admin' AND association_id = public.get_user_association_id())
  WITH CHECK (public.get_user_role() = 'association_admin' AND association_id = public.get_user_association_id());

-- الفواتير
CREATE POLICY "invoices_super_admin" ON public.invoices FOR ALL USING (public.get_user_role() = 'super_admin');
CREATE POLICY "invoices_association_admin" ON public.invoices FOR ALL 
  USING (public.get_user_role() = 'association_admin' AND association_id = public.get_user_association_id())
  WITH CHECK (public.get_user_role() = 'association_admin' AND association_id = public.get_user_association_id());

-- بنود الفواتير
CREATE POLICY "invoice_items_super_admin" ON public.invoice_items FOR ALL USING (public.get_user_role() = 'super_admin');
CREATE POLICY "invoice_items_association_admin" ON public.invoice_items FOR ALL 
  USING (public.get_user_role() = 'association_admin' AND association_id = public.get_user_association_id())
  WITH CHECK (public.get_user_role() = 'association_admin' AND association_id = public.get_user_association_id());


-- ==========================================================
-- دوال الإدارة والتحكم (Administrative Functions & Triggers)
-- ==========================================================

-- دالة معالجة إضافة مستخدم جديد وتعبئة بروفايله تلقائياً
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = new.id) THEN
    INSERT INTO public.profiles (id, email, name, role, association_id)
    VALUES (
      new.id,
      new.email,
      COALESCE(new.raw_user_meta_data->>'name', 'مسؤول جمعية'),
      CASE WHEN new.email = 'admin@apex-academy.com' THEN 'super_admin' ELSE 'association_admin' END,
      NULL
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ربط دالة التهيئة بجدول مستخدمي النظام
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- دالة خاصة بالمطور لإنشاء حسابات مدراء الجمعيات بشكل آمن ومباشر
CREATE OR REPLACE FUNCTION public.admin_create_user(
    p_email TEXT,
    p_password TEXT,
    p_name TEXT,
    p_association_id UUID
)
RETURNS UUID
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_encrypted_password TEXT;
BEGIN
    -- التحقق من صلاحيات المنشئ (يجب أن يكون مطور/Super Admin)
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'super_admin'
    ) THEN
        RAISE EXCEPTION 'غير مصرح لك بإنشاء مستخدمين. صلاحية المطور فقط مطلوبة.';
    END IF;

    -- تشفير كلمة المرور باستخدام إضافة pgcrypto التابعة لـ Supabase
    v_encrypted_password := crypt(p_password, gen_salt('bf'));

    -- توليد معرف مستخدم جديد
    v_user_id := gen_random_uuid();

    -- إدخال السجل في جدول مستخدمي Supabase الأساسي
    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        confirmation_token,
        email_change,
        email_change_token_new,
        recovery_token
    )
    VALUES (
        '00000000-0000-0000-0000-000000000000',
        v_user_id,
        'authenticated',
        'authenticated',
        p_email,
        v_encrypted_password,
        NOW(),
        '{"provider": "email", "providers": ["email"]}',
        jsonb_build_object('name', p_name),
        NOW(),
        NOW(),
        '',
        '',
        '',
        ''
    );

    -- إدخال الهوية الافتراضية للمطابقة
    INSERT INTO auth.identities (
        id,
        user_id,
        provider_id,
        identity_data,
        provider,
        created_at,
        updated_at
    )
    VALUES (
        v_user_id,
        v_user_id,
        v_user_id::text,
        jsonb_build_object('sub', v_user_id, 'email', p_email),
        'email',
        NOW(),
        NOW()
    );

    -- إدخال السجل في البروفايل أو تحديثه إذا تم إنشاؤه تلقائياً بواسطة التريجر
    INSERT INTO public.profiles (
        id,
        email,
        name,
        role,
        association_id
    )
    VALUES (
        v_user_id,
        p_email,
        p_name,
        'association_admin',
        p_association_id
    )
    ON CONFLICT (id) DO UPDATE
    SET 
        association_id = EXCLUDED.association_id,
        role = EXCLUDED.role,
        name = EXCLUDED.name,
        email = EXCLUDED.email;

    RETURN v_user_id;
END;
$$ LANGUAGE plpgsql;

-- دالة خاصة بالمطور لتعديل بيانات حساب المدير والبروفايل بشكل آمن
CREATE OR REPLACE FUNCTION public.admin_update_user(
    p_user_id UUID,
    p_email TEXT,
    p_password TEXT,
    p_name TEXT
)
RETURNS VOID
SECURITY DEFINER
AS $$
BEGIN
    -- التحقق من صلاحيات المنشئ (يجب أن يكون مطور/Super Admin)
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'super_admin'
    ) THEN
        RAISE EXCEPTION 'غير مصرح لك بتعديل مستخدمين. صلاحية المطور فقط مطلوبة.';
    END IF;

    -- 1. تحديث البروفايل
    UPDATE public.profiles
    SET name = p_name,
        email = p_email
    WHERE id = p_user_id;

    -- 2. تحديث الحساب الأساسي
    IF p_password IS NOT NULL AND p_password <> '' THEN
        UPDATE auth.users
        SET email = p_email,
            encrypted_password = crypt(p_password, gen_salt('bf')),
            raw_user_meta_data = jsonb_set(raw_user_meta_data, '{name}', to_jsonb(p_name)),
            updated_at = NOW()
        WHERE id = p_user_id;
    ELSE
        UPDATE auth.users
        SET email = p_email,
            raw_user_meta_data = jsonb_set(raw_user_meta_data, '{name}', to_jsonb(p_name)),
            updated_at = NOW()
        WHERE id = p_user_id;
    END IF;

    -- 3. تحديث الهوية لمطابقة البريد
    UPDATE auth.identities
    SET identity_data = jsonb_build_object('sub', p_user_id, 'email', p_email),
        updated_at = NOW()
    WHERE user_id = p_user_id AND provider = 'email';
END;
$$ LANGUAGE plpgsql;

-- دالة خاصة بالمطور لحذف جمعية وكل الحسابات والبيانات المرتبطة بها نهائياً
CREATE OR REPLACE FUNCTION public.admin_delete_association(p_association_id UUID)
RETURNS VOID
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
BEGIN
    -- التحقق من صلاحيات المنشئ (يجب أن يكون مطور/Super Admin)
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'super_admin'
    ) THEN
        RAISE EXCEPTION 'غير مصرح لك بحذف جمعيات. صلاحية المطور فقط مطلوبة.';
    END IF;

    -- 1. حذف حسابات المستخدمين المرتبطة بالجمعية من auth.users (والتي ستحذف تلقائياً بروفايلاتها عبر الـ Cascade)
    FOR v_user_id IN 
        SELECT id FROM public.profiles WHERE association_id = p_association_id
    LOOP
        DELETE FROM auth.users WHERE id = v_user_id;
    END LOOP;

    -- 2. حذف الجمعية نفسها (والتي ستحذف كافة بياناتها في جداول الطلاب والمعلمين وغيرهم عبر الـ Cascade)
    DELETE FROM public.associations WHERE id = p_association_id;
END;
$$ LANGUAGE plpgsql;

-- ==========================================================
-- تهيئة حساب المطور الأول (Super Admin Seeding)
-- ==========================================================

DO $$
DECLARE
    v_admin_id UUID := '00000000-0000-0000-0000-000000000001';
    v_admin_email TEXT := 'admin@apex-academy.com';
    v_admin_pass TEXT := 'admin123456';
    v_encrypted_pass TEXT;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = v_admin_email) THEN
        v_encrypted_pass := crypt(v_admin_pass, gen_salt('bf'));

        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            email_change,
            email_change_token_new,
            recovery_token
        )
        VALUES (
            '00000000-0000-0000-0000-000000000000',
            v_admin_id,
            'authenticated',
            'authenticated',
            v_admin_email,
            v_encrypted_pass,
            NOW(),
            '{"provider": "email", "providers": ["email"]}',
            '{"name": "المطور"}',
            NOW(),
            NOW(),
            '',
            '',
            '',
            ''
        );

        INSERT INTO auth.identities (
            id,
            user_id,
            provider_id,
            identity_data,
            provider,
            created_at,
            updated_at
        )
        VALUES (
            v_admin_id,
            v_admin_id,
            v_admin_id::text,
            jsonb_build_object('sub', v_admin_id, 'email', v_admin_email),
            'email',
            NOW(),
            NOW()
        );
        
    END IF;
END;
$$;

-- التأكد دائماً من وجود بروفايل للمطور وربطه بالمعرف الحقيقي في auth.users
INSERT INTO public.profiles (
    id,
    email,
    name,
    role,
    association_id
)
SELECT 
    id,
    email,
    'المطور',
    'super_admin',
    NULL
FROM auth.users
WHERE email = 'admin@apex-academy.com'
ON CONFLICT (id) DO UPDATE SET role = 'super_admin';

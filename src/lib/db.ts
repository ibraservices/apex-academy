import { createClient } from '@supabase/supabase-js';

// تعريف الأنواع البرمجية (Types)
export interface Association {
  id: string;
  name: string;
  status: 'active' | 'suspended';
  trial_ends_at?: string | null;
  created_at?: string;
}

export interface Profile {
  id: string;
  email: string;
  name: string;
  role: 'super_admin' | 'association_admin';
  association_id?: string | null;
  association?: {
    name: string;
    status: 'active' | 'suspended';
    trial_ends_at?: string | null;
  } | null;
  created_at?: string;
}

export interface Lesson {
  id: string;
  name: string;
  description: string;
  association_id?: string;
  created_at?: string;
}

export interface Teacher {
  id: string;
  name: string;
  gender: 'male' | 'female';
  salary_type: 'fixed' | 'ratio'; // راتب قار أو نسبة مئوية
  salary_value: number; // قيمة الراتب أو النسبة المئوية (مثال: 50 لـ 50%)
  phone: string;
  association_id?: string;
  created_at?: string;
}

export interface Group {
  id: string;
  name: string;
  teacher_id: string;
  lesson_id: string;
  schedule: string; // الحصص والمواعيد
  gender_target: 'male' | 'female' | 'all'; // جنس المجموعة المستهدف
  association_id?: string;
  created_at?: string;
}

export interface Student {
  id: string;
  name: string;
  age: number;
  birth_date: string;
  gender: 'male' | 'female';
  parent_name: string;
  parent_phone: string;
  association_id?: string;
  created_at?: string;
}

export interface Enrollment {
  id: string;
  student_id: string;
  group_id: string;
  lesson_id: string;
  price: number; // ثمن الدرس
  start_date: string; // تاريخ البداية
  end_date: string; // تاريخ النهاية (تلقائياً شهر)
  payment_status?: 'paid' | 'partial' | 'unpaid'; // حالة الدفع
  paid_amount?: number; // المبلغ المدفوع
  association_id?: string;
  created_at?: string;
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  date: string;
  category: 'rent' | 'bills' | 'salaries' | 'supplies' | 'other';
  description?: string;
  association_id?: string;
  created_at?: string;
}

// فحص إعدادات Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// ==========================================
// البيانات التجريبية الأولية (Mock Data)
// ==========================================
const defaultAssociations: Association[] = [
  { id: 'assoc-1', name: 'جمعية الفرقان النموذجية', status: 'active' }
];

const defaultProfiles: Profile[] = [
  {
    id: 'user-assoc-admin-1',
    email: 'manager@firqan.com',
    name: 'أ. عمر الفاروق',
    role: 'association_admin',
    association_id: 'assoc-1'
  }
];

const defaultCredentials = [
  {
    email: 'manager@firqan.com',
    password: 'password123',
    profile: defaultProfiles[0]
  }
];

const defaultLessons: Lesson[] = [
  { id: 'lesson-1', name: 'تحفيظ القرآن الكريم', description: 'حفظ ودراسة سور القرآن الكريم بالتكرار والمتابعة اليومية مع التجويد.', association_id: 'assoc-1' },
  { id: 'lesson-2', name: 'التجويد وأحكام التلاوة', description: 'دراسة مخارج الحروف وقواعد التجويد النظري والتطبيق العملي.', association_id: 'assoc-1' }
];

const defaultTeachers: Teacher[] = [
  { id: 'teacher-1', name: 'أ. محمد الأحمد', gender: 'male', salary_type: 'fixed', salary_value: 2000, phone: '0612345678', association_id: 'assoc-1' },
  { id: 'teacher-2', name: 'أ. عائشة العمري', gender: 'female', salary_type: 'ratio', salary_value: 60, phone: '0698765432', association_id: 'assoc-1' } // 60% من اشتراكات طلابها
];

const defaultGroups: Group[] = [
  { id: 'group-1', name: 'حلقة أبي بكر الصديق (ذكور)', teacher_id: 'teacher-1', lesson_id: 'lesson-1', schedule: 'السبت والاثنين والأربعاء - 17:00 إلى 19:00', gender_target: 'male', association_id: 'assoc-1' },
  { id: 'group-2', name: 'حلقة خديجة بنت خويلد (إناث)', teacher_id: 'teacher-2', lesson_id: 'lesson-1', schedule: 'الأحد والثلاثاء والخميس - 16:00 إلى 18:00', gender_target: 'female', association_id: 'assoc-1' }
];

const defaultStudents: Student[] = [
  { id: 'student-1', name: 'أحمد خالد', age: 10, birth_date: '2016-03-12', gender: 'male', parent_name: 'خالد محمود', parent_phone: '0611223344', association_id: 'assoc-1' },
  { id: 'student-2', name: 'فاطمة محمد', age: 9, birth_date: '2017-08-25', gender: 'female', parent_name: 'محمد علي', parent_phone: '0655667788', association_id: 'assoc-1' },
  { id: 'student-3', name: 'يوسف أحمد', age: 12, birth_date: '2014-01-05', gender: 'male', parent_name: 'أحمد حسن', parent_phone: '0677889900', association_id: 'assoc-1' },
  { id: 'student-4', name: 'سارة يحيى', age: 11, birth_date: '2015-05-18', gender: 'female', parent_name: 'يحيى سعيد', parent_phone: '0688990011', association_id: 'assoc-1' }
];

const defaultEnrollments: Enrollment[] = [
  { id: 'enrollment-1', student_id: 'student-1', group_id: 'group-1', lesson_id: 'lesson-1', price: 150, start_date: '2026-06-01', end_date: '2026-07-01', payment_status: 'paid', paid_amount: 150, association_id: 'assoc-1' },
  { id: 'enrollment-2', student_id: 'student-2', group_id: 'group-2', lesson_id: 'lesson-1', price: 200, start_date: '2026-06-05', end_date: '2026-07-05', payment_status: 'partial', paid_amount: 120, association_id: 'assoc-1' },
  { id: 'enrollment-3', student_id: 'student-3', group_id: 'group-1', lesson_id: 'lesson-1', price: 150, start_date: '2026-06-01', end_date: '2026-07-01', payment_status: 'unpaid', paid_amount: 0, association_id: 'assoc-1' },
  { id: 'enrollment-4', student_id: 'student-4', group_id: 'group-2', lesson_id: 'lesson-1', price: 200, start_date: '2026-06-07', end_date: '2026-07-07', payment_status: 'paid', paid_amount: 200, association_id: 'assoc-1' }
];

const defaultExpenses: Expense[] = [
  { id: 'expense-1', title: 'كراء المقر الرئيسي للجمعية', amount: 1500, date: '2026-06-01', category: 'rent', description: 'كراء شهر يونيو 2026', association_id: 'assoc-1' },
  { id: 'expense-2', title: 'فاتورة الكهرباء والماء', amount: 240, date: '2026-06-03', category: 'bills', description: 'مقر الجمعية', association_id: 'assoc-1' },
  { id: 'expense-3', title: 'أدوات مكتبية وأوراق طباعة', amount: 180, date: '2026-06-05', category: 'supplies', description: 'أقلام وسبورة وورق A4', association_id: 'assoc-1' }
];

// دالة مساعدة لتهيئة التخزين المحلي
const initLocalStorage = () => {
  if (!localStorage.getItem('quran_associations')) {
    localStorage.setItem('quran_associations', JSON.stringify(defaultAssociations));
  }
  if (!localStorage.getItem('quran_profiles')) {
    localStorage.setItem('quran_profiles', JSON.stringify(defaultProfiles));
  }
  if (!localStorage.getItem('quran_credentials')) {
    localStorage.setItem('quran_credentials', JSON.stringify(defaultCredentials));
  }
  if (!localStorage.getItem('quran_lessons')) {
    localStorage.setItem('quran_lessons', JSON.stringify(defaultLessons));
  }
  if (!localStorage.getItem('quran_teachers')) {
    localStorage.setItem('quran_teachers', JSON.stringify(defaultTeachers));
  }
  if (!localStorage.getItem('quran_groups')) {
    localStorage.setItem('quran_groups', JSON.stringify(defaultGroups));
  }
  if (!localStorage.getItem('quran_students')) {
    localStorage.setItem('quran_students', JSON.stringify(defaultStudents));
  }
  if (!localStorage.getItem('quran_enrollments')) {
    localStorage.setItem('quran_enrollments', JSON.stringify(defaultEnrollments));
  }
  if (!localStorage.getItem('quran_expenses')) {
    localStorage.setItem('quran_expenses', JSON.stringify(defaultExpenses));
  }
};

// تشغيل التهيئة
if (!isSupabaseConfigured) {
  initLocalStorage();
}

// دالة مساعدة للحصول على البيانات من التخزين المحلي
const getLocalData = <T>(key: string): T[] => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
};

// دالة مساعدة لحفظ البيانات في التخزين المحلي
const setLocalData = <T>(key: string, data: T[]): void => {
  localStorage.setItem(key, JSON.stringify(data));
};

// دالات مساعدة لجلب معلومات الجلسة المحلية النشطة
export const getProfileAssociationId = (): string | null => {
  const profileStr = localStorage.getItem('al_hidaya_current_profile');
  if (!profileStr) return null;
  try {
    const profile = JSON.parse(profileStr);
    return profile.association_id || null;
  } catch {
    return null;
  }
};

export const getProfileRole = (): string | null => {
  const profileStr = localStorage.getItem('al_hidaya_current_profile');
  if (!profileStr) return null;
  try {
    const profile = JSON.parse(profileStr);
    return profile.role || null;
  } catch {
    return null;
  }
};

// ==========================================
// وظائف الجمعيات وإدارة الحسابات
// ==========================================

export async function getAssociations(): Promise<Association[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.from('associations').select('*').order('name');
    if (error) throw error;
    return data || [];
  } else {
    return getLocalData<Association>('quran_associations');
  }
}

export async function saveAssociation(association: Omit<Association, 'id'> & { id?: string }): Promise<Association> {
  if (isSupabaseConfigured && supabase) {
    if (association.id) {
      const { data, error } = await supabase.from('associations').update(association).eq('id', association.id).select().single();
      if (error) throw error;
      return data;
    } else {
      const { data, error } = await supabase.from('associations').insert(association).select().single();
      if (error) throw error;
      return data;
    }
  } else {
    const associations = getLocalData<Association>('quran_associations');
    if (association.id) {
      const updated = associations.map(a => a.id === association.id ? { ...a, ...association } as Association : a);
      setLocalData('quran_associations', updated);
      return { ...association } as Association;
    } else {
      const newAssoc = { ...association, id: 'assoc-' + Date.now(), status: association.status || 'active' } as Association;
      associations.push(newAssoc);
      setLocalData('quran_associations', associations);
      return newAssoc;
    }
  }
}

export async function getCurrentProfile(): Promise<Profile | null> {
  if (isSupabaseConfigured && supabase) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data, error } = await supabase.from('profiles').select('*, association:associations(name, status, trial_ends_at)').eq('id', user.id).maybeSingle();
    if (error) throw error;
    
    // التحقق من تعليق الحساب إن كان مسؤول جمعية
    if (data && data.association && data.association.status === 'suspended') {
      await supabase.auth.signOut();
      throw new Error('حساب الجمعية معطل حالياً. يرجى مراجعة المطور.');
    }
    
    return data;
  } else {
    const profileStr = localStorage.getItem('al_hidaya_current_profile');
    if (!profileStr) return null;
    try {
      const cachedProfile = JSON.parse(profileStr);
      if (cachedProfile.association_id) {
        const associations = getLocalData<Association>('quran_associations');
        const assoc = associations.find(a => a.id === cachedProfile.association_id);
        cachedProfile.association = assoc ? { name: assoc.name, status: assoc.status, trial_ends_at: assoc.trial_ends_at } : null;
      }
      return cachedProfile;
    } catch {
      return null;
    }
  }
}

export async function adminCreateUser(email: string, password: string, name: string, associationId: string): Promise<string> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.rpc('admin_create_user', {
      p_email: email,
      p_password: password,
      p_name: name,
      p_association_id: associationId
    });
    if (error) throw error;
    return data;
  } else {
    const mockProfileId = 'user-' + Date.now();
    const newProfile: Profile = {
      id: mockProfileId,
      email,
      name,
      role: 'association_admin',
      association_id: associationId
    };
    const mockProfiles = getLocalData<Profile>('quran_profiles');
    mockProfiles.push(newProfile);
    setLocalData('quran_profiles', mockProfiles);
    
    const mockCredentials = getLocalData<any>('quran_credentials');
    mockCredentials.push({ email, password, profile: newProfile });
    setLocalData('quran_credentials', mockCredentials);
    
    return mockProfileId;
  }
}

// ==========================================
// دالات المصادقة الوهمية عند عدم الاتصال بـ Supabase
// ==========================================
export async function mockLogin(email: string, password: string): Promise<Profile> {
  if (email === 'admin@alhidaya.com' && password === 'admin123456') {
    const superAdminProfile: Profile = {
      id: '00000000-0000-0000-0000-000000000001',
      email: 'admin@alhidaya.com',
      name: 'المطور',
      role: 'super_admin',
      association_id: null
    };
    localStorage.setItem('al_hidaya_current_profile', JSON.stringify(superAdminProfile));
    return superAdminProfile;
  }
  
  const mockCredentials = getLocalData<any>('quran_credentials');
  const user = mockCredentials.find((c: any) => c.email.toLowerCase() === email.toLowerCase() && c.password === password);
  
  if (user) {
    const associations = getLocalData<Association>('quran_associations');
    const assoc = associations.find(a => a.id === user.profile.association_id);
    
    if (assoc && assoc.status === 'suspended') {
      throw new Error('حساب الجمعية معطل حالياً. يرجى مراجعة المطور.');
    }
    
    const profile: Profile = {
      ...user.profile,
      association: assoc ? { name: assoc.name, status: assoc.status, trial_ends_at: assoc.trial_ends_at } : null
    };
    
    localStorage.setItem('al_hidaya_current_profile', JSON.stringify(profile));
    return profile;
  }
  
  throw new Error('البريد الإلكتروني أو كلمة المرور غير صحيحة.');
}

export function mockLogout(): void {
  localStorage.removeItem('al_hidaya_current_profile');
}

// ==========================================
// وظائف الدروس (Lessons CRUD)
// ==========================================
export async function getLessons(): Promise<Lesson[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.from('lessons').select('*').order('name');
    if (error) throw error;
    return data || [];
  } else {
    const assocId = getProfileAssociationId();
    const role = getProfileRole();
    const all = getLocalData<Lesson>('quran_lessons');
    if (role === 'super_admin') return all;
    return all.filter(l => l.association_id === assocId);
  }
}

export async function saveLesson(lesson: Omit<Lesson, 'id'> & { id?: string, association_id?: string }): Promise<Lesson> {
  const assocId = lesson.association_id || getProfileAssociationId() || '';
  const dataToSave = { ...lesson, association_id: assocId };

  if (isSupabaseConfigured && supabase) {
    if (lesson.id) {
      const { data, error } = await supabase.from('lessons').update(dataToSave).eq('id', lesson.id).select().single();
      if (error) throw error;
      return data;
    } else {
      const { data, error } = await supabase.from('lessons').insert(dataToSave).select().single();
      if (error) throw error;
      return data;
    }
  } else {
    const lessons = getLocalData<Lesson>('quran_lessons');
    if (lesson.id) {
      const updatedLessons = lessons.map(l => l.id === lesson.id ? { ...l, ...dataToSave } as Lesson : l);
      setLocalData('quran_lessons', updatedLessons);
      return { ...dataToSave } as Lesson;
    } else {
      const newLesson = { ...dataToSave, id: 'lesson-' + Date.now() } as Lesson;
      lessons.push(newLesson);
      setLocalData('quran_lessons', lessons);
      return newLesson;
    }
  }
}

export async function deleteLesson(id: string): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.from('lessons').delete().eq('id', id);
    if (error) throw error;
  } else {
    const lessons = getLocalData<Lesson>('quran_lessons');
    setLocalData('quran_lessons', lessons.filter(l => l.id !== id));
    
    // تنظيف المجموعات والاشتراكات المرتبطة تلقائياً
    const groups = getLocalData<Group>('quran_groups');
    setLocalData('quran_groups', groups.filter(g => g.lesson_id !== id));
    
    const enrollments = getLocalData<Enrollment>('quran_enrollments');
    setLocalData('quran_enrollments', enrollments.filter(e => e.lesson_id !== id));
  }
}

// ==========================================
// وظائف المدرسين (Teachers CRUD)
// ==========================================
export async function getTeachers(): Promise<Teacher[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.from('teachers').select('*').order('name');
    if (error) throw error;
    return data || [];
  } else {
    const assocId = getProfileAssociationId();
    const role = getProfileRole();
    const all = getLocalData<Teacher>('quran_teachers');
    if (role === 'super_admin') return all;
    return all.filter(t => t.association_id === assocId);
  }
}

export async function saveTeacher(teacher: Omit<Teacher, 'id'> & { id?: string, association_id?: string }): Promise<Teacher> {
  const assocId = teacher.association_id || getProfileAssociationId() || '';
  const dataToSave = { ...teacher, association_id: assocId };

  if (isSupabaseConfigured && supabase) {
    if (teacher.id) {
      const { data, error } = await supabase.from('teachers').update(dataToSave).eq('id', teacher.id).select().single();
      if (error) throw error;
      return data;
    } else {
      const { data, error } = await supabase.from('teachers').insert(dataToSave).select().single();
      if (error) throw error;
      return data;
    }
  } else {
    const teachers = getLocalData<Teacher>('quran_teachers');
    if (teacher.id) {
      const updated = teachers.map(t => t.id === teacher.id ? { ...t, ...dataToSave } as Teacher : t);
      setLocalData('quran_teachers', updated);
      return { ...dataToSave } as Teacher;
    } else {
      const newTeacher = { ...dataToSave, id: 'teacher-' + Date.now() } as Teacher;
      teachers.push(newTeacher);
      setLocalData('quran_teachers', teachers);
      return newTeacher;
    }
  }
}

export async function deleteTeacher(id: string): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.from('teachers').delete().eq('id', id);
    if (error) throw error;
  } else {
    const teachers = getLocalData<Teacher>('quran_teachers');
    setLocalData('quran_teachers', teachers.filter(t => t.id !== id));

    // تنظيف المجموعات المرتبطة
    const groups = getLocalData<Group>('quran_groups');
    const affectedGroupIds = groups.filter(g => g.teacher_id === id).map(g => g.id);
    setLocalData('quran_groups', groups.filter(g => g.teacher_id !== id));

    // تنظيف الاشتراكات المرتبطة
    const enrollments = getLocalData<Enrollment>('quran_enrollments');
    setLocalData('quran_enrollments', enrollments.filter(e => !affectedGroupIds.includes(e.group_id)));
  }
}

// ==========================================
// وظائف المجموعات (Groups CRUD)
// ==========================================
export async function getGroups(): Promise<Group[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.from('groups').select('*').order('name');
    if (error) throw error;
    return data || [];
  } else {
    const assocId = getProfileAssociationId();
    const role = getProfileRole();
    const all = getLocalData<Group>('quran_groups');
    if (role === 'super_admin') return all;
    return all.filter(g => g.association_id === assocId);
  }
}

export async function saveGroup(group: Omit<Group, 'id'> & { id?: string, association_id?: string }): Promise<Group> {
  const assocId = group.association_id || getProfileAssociationId() || '';
  const dataToSave = { ...group, association_id: assocId };

  if (isSupabaseConfigured && supabase) {
    if (group.id) {
      const { data, error } = await supabase.from('groups').update(dataToSave).eq('id', group.id).select().single();
      if (error) throw error;
      return data;
    } else {
      const { data, error } = await supabase.from('groups').insert(dataToSave).select().single();
      if (error) throw error;
      return data;
    }
  } else {
    const groups = getLocalData<Group>('quran_groups');
    if (group.id) {
      const updated = groups.map(g => g.id === group.id ? { ...g, ...dataToSave } as Group : g);
      setLocalData('quran_groups', updated);
      return { ...dataToSave } as Group;
    } else {
      const newGroup = { ...dataToSave, id: 'group-' + Date.now() } as Group;
      groups.push(newGroup);
      setLocalData('quran_groups', groups);
      return newGroup;
    }
  }
}

export async function deleteGroup(id: string): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.from('groups').delete().eq('id', id);
    if (error) throw error;
  } else {
    const groups = getLocalData<Group>('quran_groups');
    setLocalData('quran_groups', groups.filter(g => g.id !== id));

    // تنظيف الاشتراكات المرتبطة بالمجموعة
    const enrollments = getLocalData<Enrollment>('quran_enrollments');
    setLocalData('quran_enrollments', enrollments.filter(e => e.group_id !== id));
  }
}

// ==========================================
// وظائف الطلاب (Students CRUD)
// ==========================================
export async function getStudents(): Promise<Student[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.from('students').select('*').order('name');
    if (error) throw error;
    return data || [];
  } else {
    const assocId = getProfileAssociationId();
    const role = getProfileRole();
    const all = getLocalData<Student>('quran_students');
    if (role === 'super_admin') return all;
    return all.filter(s => s.association_id === assocId);
  }
}

export async function saveStudent(student: Omit<Student, 'id'> & { id?: string, association_id?: string }): Promise<Student> {
  const assocId = student.association_id || getProfileAssociationId() || '';
  const dataToSave = { ...student, association_id: assocId };

  if (isSupabaseConfigured && supabase) {
    if (student.id) {
      const { data, error } = await supabase.from('students').update(dataToSave).eq('id', student.id).select().single();
      if (error) throw error;
      return data;
    } else {
      const { data, error } = await supabase.from('students').insert(dataToSave).select().single();
      if (error) throw error;
      return data;
    }
  } else {
    const students = getLocalData<Student>('quran_students');
    if (student.id) {
      const updated = students.map(s => s.id === student.id ? { ...s, ...dataToSave } as Student : s);
      setLocalData('quran_students', updated);
      return { ...dataToSave } as Student;
    } else {
      const newStudent = { ...dataToSave, id: 'student-' + Date.now() } as Student;
      students.push(newStudent);
      setLocalData('quran_students', students);
      return newStudent;
    }
  }
}

export async function deleteStudent(id: string): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.from('students').delete().eq('id', id);
    if (error) throw error;
  } else {
    const students = getLocalData<Student>('quran_students');
    setLocalData('quran_students', students.filter(s => s.id !== id));

    // حذف الاشتراكات المرتبطة بالطالب تلقائياً
    const enrollments = getLocalData<Enrollment>('quran_enrollments');
    setLocalData('quran_enrollments', enrollments.filter(e => e.student_id !== id));
  }
}

// ==========================================
// وظائف الاشتراكات والتسجيلات (Enrollments CRUD)
// ==========================================
export async function getEnrollments(): Promise<Enrollment[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.from('enrollments').select('*');
    if (error) throw error;
    return data || [];
  } else {
    const assocId = getProfileAssociationId();
    const role = getProfileRole();
    const all = getLocalData<Enrollment>('quran_enrollments');
    if (role === 'super_admin') return all;
    return all.filter(e => e.association_id === assocId);
  }
}

export async function saveEnrollment(enrollment: Omit<Enrollment, 'id'> & { id?: string, association_id?: string }): Promise<Enrollment> {
  const assocId = enrollment.association_id || getProfileAssociationId() || '';
  const dataToSave = { ...enrollment, association_id: assocId };

  if (isSupabaseConfigured && supabase) {
    if (enrollment.id) {
      const { data, error } = await supabase.from('enrollments').update(dataToSave).eq('id', enrollment.id).select().single();
      if (error) throw error;
      return data;
    } else {
      const { data, error } = await supabase.from('enrollments').insert(dataToSave).select().single();
      if (error) throw error;
      return data;
    }
  } else {
    const enrollments = getLocalData<Enrollment>('quran_enrollments');
    if (enrollment.id) {
      const updated = enrollments.map(e => e.id === enrollment.id ? { ...e, ...dataToSave } as Enrollment : e);
      setLocalData('quran_enrollments', updated);
      return { ...dataToSave } as Enrollment;
    } else {
      const newEnrollment = { ...dataToSave, id: 'enrollment-' + Date.now() } as Enrollment;
      enrollments.push(newEnrollment);
      setLocalData('quran_enrollments', enrollments);
      return newEnrollment;
    }
  }
}

export async function deleteEnrollment(id: string): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.from('enrollments').delete().eq('id', id);
    if (error) throw error;
  } else {
    const enrollments = getLocalData<Enrollment>('quran_enrollments');
    setLocalData('quran_enrollments', enrollments.filter(e => e.id !== id));
  }
}

// دالة مساعدة لحساب الأجر الفعلي للمدرس
export function calculateTeacherSalary(teacher: Teacher, enrollments: Enrollment[], groups: Group[]): number {
  const teacherGroupIds = groups.filter(g => g.teacher_id === teacher.id).map(g => g.id);
  const teacherEnrollments = enrollments.filter(e => teacherGroupIds.includes(e.group_id));
  
  if (teacher.salary_type === 'fixed') {
    return teacher.salary_value;
  } else {
    // نسبة مئوية من مجموع اشتراكات الطلاب الفعليين في مجموعاته
    const totalEnrollmentsPrice = teacherEnrollments.reduce((sum, e) => sum + Number(e.price), 0);
    return Math.round((totalEnrollmentsPrice * teacher.salary_value) / 100);
  }
}

// دالة مساعدة لحساب عدد الطلاب الفعليين للمدرس
export function countTeacherStudents(teacher: Teacher, enrollments: Enrollment[], groups: Group[]): number {
  const teacherGroupIds = groups.filter(g => g.teacher_id === teacher.id).map(g => g.id);
  const teacherEnrollments = enrollments.filter(e => teacherGroupIds.includes(e.group_id));
  // تجنب التكرار لو الطالب مسجل في أكثر من مجموعة لنفس المدرس
  const uniqueStudentIds = new Set(teacherEnrollments.map(e => e.student_id));
  return uniqueStudentIds.size;
}

// ==========================================
// وظائف النماذج والنفقات (Expenses CRUD)
// ==========================================
export async function getExpenses(): Promise<Expense[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.from('expenses').select('*').order('date', { ascending: false });
    if (error) throw error;
    return data || [];
  } else {
    const assocId = getProfileAssociationId();
    const role = getProfileRole();
    const all = getLocalData<Expense>('quran_expenses');
    if (role === 'super_admin') return all;
    return all.filter(e => e.association_id === assocId);
  }
}

export async function saveExpense(expense: Omit<Expense, 'id'> & { id?: string, association_id?: string }): Promise<Expense> {
  const assocId = expense.association_id || getProfileAssociationId() || '';
  const dataToSave = { ...expense, association_id: assocId };

  if (isSupabaseConfigured && supabase) {
    if (expense.id) {
      const { data, error } = await supabase.from('expenses').update(dataToSave).eq('id', expense.id).select().single();
      if (error) throw error;
      return data;
    } else {
      const { data, error } = await supabase.from('expenses').insert(dataToSave).select().single();
      if (error) throw error;
      return data;
    }
  } else {
    const expenses = getLocalData<Expense>('quran_expenses');
    if (expense.id) {
      const updated = expenses.map(e => e.id === expense.id ? { ...e, ...dataToSave } as Expense : e);
      setLocalData('quran_expenses', updated);
      return { ...dataToSave } as Expense;
    } else {
      const newExpense = { ...dataToSave, id: 'expense-' + Date.now() } as Expense;
      expenses.push(newExpense);
      setLocalData('quran_expenses', expenses);
      return newExpense;
    }
  }
}

export async function deleteExpense(id: string): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.from('expenses').delete().eq('id', id);
    if (error) throw error;
  } else {
    const expenses = getLocalData<Expense>('quran_expenses');
    setLocalData('quran_expenses', expenses.filter(e => e.id !== id));
  }
}

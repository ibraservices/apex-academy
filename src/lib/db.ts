import { createClient } from '@supabase/supabase-js';

// تعريف الأنواع البرمجية (Types)
export interface Lesson {
  id: string;
  name: string;
  description: string;
  created_at?: string;
}

export interface Teacher {
  id: string;
  name: string;
  gender: 'male' | 'female';
  salary_type: 'fixed' | 'ratio'; // راتب قار أو نسبة مئوية
  salary_value: number; // قيمة الراتب أو النسبة المئوية (مثال: 50 لـ 50%)
  phone: string;
  created_at?: string;
}

export interface Group {
  id: string;
  name: string;
  teacher_id: string;
  lesson_id: string;
  schedule: string; // الحصص والمواعيد
  gender_target: 'male' | 'female' | 'all'; // جنس المجموعة المستهدف
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
  created_at?: string;
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  date: string;
  category: 'rent' | 'bills' | 'salaries' | 'supplies' | 'other';
  description?: string;
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
const defaultLessons: Lesson[] = [
  { id: 'lesson-1', name: 'تحفيظ القرآن الكريم', description: 'حفظ ودراسة سور القرآن الكريم بالتكرار والمتابعة اليومية مع التجويد.' },
  { id: 'lesson-2', name: 'التجويد وأحكام التلاوة', description: 'دراسة مخارج الحروف وقواعد التجويد النظري والتطبيق العملي.' }
];

const defaultTeachers: Teacher[] = [
  { id: 'teacher-1', name: 'أ. محمد الأحمد', gender: 'male', salary_type: 'fixed', salary_value: 2000, phone: '0612345678' },
  { id: 'teacher-2', name: 'أ. عائشة العمري', gender: 'female', salary_type: 'ratio', salary_value: 60, phone: '0698765432' } // 60% من اشتراكات طلابها
];

const defaultGroups: Group[] = [
  { id: 'group-1', name: 'حلقة أبي بكر الصديق (ذكور)', teacher_id: 'teacher-1', lesson_id: 'lesson-1', schedule: 'السبت والاثنين والأربعاء - 17:00 إلى 19:00', gender_target: 'male' },
  { id: 'group-2', name: 'حلقة خديجة بنت خويلد (إناث)', teacher_id: 'teacher-2', lesson_id: 'lesson-1', schedule: 'الأحد والثلاثاء والخميس - 16:00 إلى 18:00', gender_target: 'female' }
];

const defaultStudents: Student[] = [
  { id: 'student-1', name: 'أحمد خالد', age: 10, birth_date: '2016-03-12', gender: 'male', parent_name: 'خالد محمود', parent_phone: '0611223344' },
  { id: 'student-2', name: 'فاطمة محمد', age: 9, birth_date: '2017-08-25', gender: 'female', parent_name: 'محمد علي', parent_phone: '0655667788' },
  { id: 'student-3', name: 'يوسف أحمد', age: 12, birth_date: '2014-01-05', gender: 'male', parent_name: 'أحمد حسن', parent_phone: '0677889900' },
  { id: 'student-4', name: 'سارة يحيى', age: 11, birth_date: '2015-05-18', gender: 'female', parent_name: 'يحيى سعيد', parent_phone: '0688990011' }
];

const defaultEnrollments: Enrollment[] = [
  { id: 'enrollment-1', student_id: 'student-1', group_id: 'group-1', lesson_id: 'lesson-1', price: 150, start_date: '2026-06-01', end_date: '2026-07-01', payment_status: 'paid', paid_amount: 150 },
  { id: 'enrollment-2', student_id: 'student-2', group_id: 'group-2', lesson_id: 'lesson-1', price: 200, start_date: '2026-06-05', end_date: '2026-07-05', payment_status: 'partial', paid_amount: 120 },
  { id: 'enrollment-3', student_id: 'student-3', group_id: 'group-1', lesson_id: 'lesson-1', price: 150, start_date: '2026-06-01', end_date: '2026-07-01', payment_status: 'unpaid', paid_amount: 0 },
  { id: 'enrollment-4', student_id: 'student-4', group_id: 'group-2', lesson_id: 'lesson-1', price: 200, start_date: '2026-06-07', end_date: '2026-07-07', payment_status: 'paid', paid_amount: 200 }
];

const defaultExpenses: Expense[] = [
  { id: 'expense-1', title: 'كراء المقر الرئيسي للجمعية', amount: 1500, date: '2026-06-01', category: 'rent', description: 'كراء شهر يونيو 2026' },
  { id: 'expense-2', title: 'فاتورة الكهرباء والماء', amount: 240, date: '2026-06-03', category: 'bills', description: 'مقر الجمعية' },
  { id: 'expense-3', title: 'أدوات مكتبية وأوراق طباعة', amount: 180, date: '2026-06-05', category: 'supplies', description: 'أقلام وسبورة وورق A4' }
];

// دالة مساعدة لتهيئة التخزين المحلي
const initLocalStorage = () => {
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

// ==========================================
// وظائف الدروس (Lessons CRUD)
// ==========================================
export async function getLessons(): Promise<Lesson[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.from('lessons').select('*').order('name');
    if (error) throw error;
    return data || [];
  } else {
    return getLocalData<Lesson>('quran_lessons');
  }
}

export async function saveLesson(lesson: Omit<Lesson, 'id'> & { id?: string }): Promise<Lesson> {
  if (isSupabaseConfigured && supabase) {
    if (lesson.id) {
      const { data, error } = await supabase.from('lessons').update(lesson).eq('id', lesson.id).select().single();
      if (error) throw error;
      return data;
    } else {
      const { data, error } = await supabase.from('lessons').insert(lesson).select().single();
      if (error) throw error;
      return data;
    }
  } else {
    const lessons = getLocalData<Lesson>('quran_lessons');
    if (lesson.id) {
      const updatedLessons = lessons.map(l => l.id === lesson.id ? { ...l, ...lesson } as Lesson : l);
      setLocalData('quran_lessons', updatedLessons);
      return { ...lesson } as Lesson;
    } else {
      const newLesson = { ...lesson, id: 'lesson-' + Date.now() } as Lesson;
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
    return getLocalData<Teacher>('quran_teachers');
  }
}

export async function saveTeacher(teacher: Omit<Teacher, 'id'> & { id?: string }): Promise<Teacher> {
  if (isSupabaseConfigured && supabase) {
    if (teacher.id) {
      const { data, error } = await supabase.from('teachers').update(teacher).eq('id', teacher.id).select().single();
      if (error) throw error;
      return data;
    } else {
      const { data, error } = await supabase.from('teachers').insert(teacher).select().single();
      if (error) throw error;
      return data;
    }
  } else {
    const teachers = getLocalData<Teacher>('quran_teachers');
    if (teacher.id) {
      const updated = teachers.map(t => t.id === teacher.id ? { ...t, ...teacher } as Teacher : t);
      setLocalData('quran_teachers', updated);
      return { ...teacher } as Teacher;
    } else {
      const newTeacher = { ...teacher, id: 'teacher-' + Date.now() } as Teacher;
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
    return getLocalData<Group>('quran_groups');
  }
}

export async function saveGroup(group: Omit<Group, 'id'> & { id?: string }): Promise<Group> {
  if (isSupabaseConfigured && supabase) {
    if (group.id) {
      const { data, error } = await supabase.from('groups').update(group).eq('id', group.id).select().single();
      if (error) throw error;
      return data;
    } else {
      const { data, error } = await supabase.from('groups').insert(group).select().single();
      if (error) throw error;
      return data;
    }
  } else {
    const groups = getLocalData<Group>('quran_groups');
    if (group.id) {
      const updated = groups.map(g => g.id === group.id ? { ...g, ...group } as Group : g);
      setLocalData('quran_groups', updated);
      return { ...group } as Group;
    } else {
      const newGroup = { ...group, id: 'group-' + Date.now() } as Group;
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
    return getLocalData<Student>('quran_students');
  }
}

export async function saveStudent(student: Omit<Student, 'id'> & { id?: string }): Promise<Student> {
  if (isSupabaseConfigured && supabase) {
    if (student.id) {
      const { data, error } = await supabase.from('students').update(student).eq('id', student.id).select().single();
      if (error) throw error;
      return data;
    } else {
      const { data, error } = await supabase.from('students').insert(student).select().single();
      if (error) throw error;
      return data;
    }
  } else {
    const students = getLocalData<Student>('quran_students');
    if (student.id) {
      const updated = students.map(s => s.id === student.id ? { ...s, ...student } as Student : s);
      setLocalData('quran_students', updated);
      return { ...student } as Student;
    } else {
      const newStudent = { ...student, id: 'student-' + Date.now() } as Student;
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
    return getLocalData<Enrollment>('quran_enrollments');
  }
}

export async function saveEnrollment(enrollment: Omit<Enrollment, 'id'> & { id?: string }): Promise<Enrollment> {
  if (isSupabaseConfigured && supabase) {
    if (enrollment.id) {
      const { data, error } = await supabase.from('enrollments').update(enrollment).eq('id', enrollment.id).select().single();
      if (error) throw error;
      return data;
    } else {
      const { data, error } = await supabase.from('enrollments').insert(enrollment).select().single();
      if (error) throw error;
      return data;
    }
  } else {
    const enrollments = getLocalData<Enrollment>('quran_enrollments');
    if (enrollment.id) {
      const updated = enrollments.map(e => e.id === enrollment.id ? { ...e, ...enrollment } as Enrollment : e);
      setLocalData('quran_enrollments', updated);
      return { ...enrollment } as Enrollment;
    } else {
      const newEnrollment = { ...enrollment, id: 'enrollment-' + Date.now() } as Enrollment;
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
    return getLocalData<Expense>('quran_expenses');
  }
}

export async function saveExpense(expense: Omit<Expense, 'id'> & { id?: string }): Promise<Expense> {
  if (isSupabaseConfigured && supabase) {
    if (expense.id) {
      const { data, error } = await supabase.from('expenses').update(expense).eq('id', expense.id).select().single();
      if (error) throw error;
      return data;
    } else {
      const { data, error } = await supabase.from('expenses').insert(expense).select().single();
      if (error) throw error;
      return data;
    }
  } else {
    const expenses = getLocalData<Expense>('quran_expenses');
    if (expense.id) {
      const updated = expenses.map(e => e.id === expense.id ? { ...e, ...expense } as Expense : e);
      setLocalData('quran_expenses', updated);
      return { ...expense } as Expense;
    } else {
      const newExpense = { ...expense, id: 'expense-' + Date.now() } as Expense;
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

import { useState, useEffect } from 'react';
import { 
  BookOpen, 
  GraduationCap, 
  Layers, 
  Users, 
  LayoutDashboard, 
  Sparkles,
  RefreshCw,
  Wallet,
  LogOut
} from 'lucide-react';
import { 
  type Lesson, 
  type Teacher, 
  type Group, 
  type Student, 
  type Enrollment,
  type Expense,
  type Profile,
  getLessons,
  saveLesson,
  deleteLesson,
  getTeachers,
  saveTeacher,
  deleteTeacher,
  getGroups,
  saveGroup,
  deleteGroup,
  getStudents,
  saveStudent,
  deleteStudent,
  getEnrollments,
  saveEnrollment,
  deleteEnrollment,
  getExpenses,
  saveExpense,
  deleteExpense,
  getCurrentProfile,
  isSupabaseConfigured,
  supabase,
  mockLogout
} from './lib/db';
import { Dashboard } from './components/Dashboard';
import { LessonsManager } from './components/LessonsManager';
import { TeachersManager } from './components/TeachersManager';
import { GroupsManager } from './components/GroupsManager';
import { StudentsManager } from './components/StudentsManager';
import { ExpensesManager } from './components/ExpensesManager';
import { AuthManager } from './components/AuthManager';
import { SuperAdminPanel } from './components/SuperAdminPanel';

export default function App() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [view, setView] = useState<string>('dashboard');
  const [loading, setLoading] = useState<boolean>(false);

  // الكيانات البرمجية لمدير الجمعية
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  // تحميل البيانات الخاصة بالجمعية المسجل عليها المستخدم الحالي
  const loadAllData = async () => {
    try {
      setLoading(true);
      const [fetchedLessons, fetchedTeachers, fetchedGroups, fetchedStudents, fetchedEnrollments, fetchedExpenses] = await Promise.all([
        getLessons(),
        getTeachers(),
        getGroups(),
        getStudents(),
        getEnrollments(),
        getExpenses()
      ]);

      setLessons(fetchedLessons);
      setTeachers(fetchedTeachers);
      setGroups(fetchedGroups);
      setStudents(fetchedStudents);
      setEnrollments(fetchedEnrollments);
      setExpenses(fetchedExpenses);
    } catch (error) {
      console.error('حدث خطأ أثناء تحميل البيانات:', error);
      alert('عذراً، تعذر تحميل البيانات. يرجى مراجعة إعدادات قاعدة البيانات.');
    } finally {
      setLoading(false);
    }
  };

  const checkAuth = async () => {
    try {
      setAuthLoading(true);
      const userProfile = await getCurrentProfile();
      setProfile(userProfile);
      if (userProfile && userProfile.role === 'association_admin') {
        await loadAllData();
      }
    } catch (err: any) {
      console.error('فحص الجلسة فشل:', err);
      alert(err.message || 'حدث خطأ أثناء التحقق من الجلسة.');
      setProfile(null);
    } finally {
      setAuthLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();

    if (isSupabaseConfigured && supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
        if (event === 'SIGNED_IN') {
          await checkAuth();
        } else if (event === 'SIGNED_OUT') {
          setProfile(null);
          setAuthLoading(false);
        }
      });
      return () => subscription.unsubscribe();
    }
  }, []);

  const handleLogout = () => {
    setProfile(null);
    setView('dashboard');
  };

  const handleLogoutClick = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    } else {
      mockLogout();
    }
    handleLogout();
  };

  // دالات التحديث مع تمرير معرف الجمعية تلقائياً
  const handleSaveLesson = async (lessonData: Omit<Lesson, 'id'> & { id?: string }) => {
    await saveLesson({
      ...lessonData,
      association_id: profile?.association_id || undefined
    });
    await loadAllData();
  };

  const handleDeleteLesson = async (id: string) => {
    await deleteLesson(id);
    await loadAllData();
  };

  const handleSaveTeacher = async (teacherData: Omit<Teacher, 'id'> & { id?: string }) => {
    await saveTeacher({
      ...teacherData,
      association_id: profile?.association_id || undefined
    });
    await loadAllData();
  };

  const handleDeleteTeacher = async (id: string) => {
    await deleteTeacher(id);
    await loadAllData();
  };

  const handleSaveGroup = async (groupData: Omit<Group, 'id'> & { id?: string }) => {
    await saveGroup({
      ...groupData,
      association_id: profile?.association_id || undefined
    });
    await loadAllData();
  };

  const handleDeleteGroup = async (id: string) => {
    await deleteGroup(id);
    await loadAllData();
  };

  const handleSaveStudent = async (studentData: Omit<Student, 'id'> & { id?: string }) => {
    const saved = await saveStudent({
      ...studentData,
      association_id: profile?.association_id || undefined
    });
    await loadAllData();
    return saved;
  };

  const handleDeleteStudent = async (id: string) => {
    await deleteStudent(id);
    await loadAllData();
  };

  const handleSaveEnrollment = async (enrollmentData: Omit<Enrollment, 'id'> & { id?: string }) => {
    await saveEnrollment({
      ...enrollmentData,
      association_id: profile?.association_id || undefined
    });
    await loadAllData();
  };

  const handleDeleteEnrollment = async (id: string) => {
    await deleteEnrollment(id);
    await loadAllData();
  };

  const handleSaveExpense = async (expenseData: Omit<Expense, 'id'> & { id?: string }) => {
    await saveExpense({
      ...expenseData,
      association_id: profile?.association_id || undefined
    });
    await loadAllData();
  };

  const handleDeleteExpense = async (id: string) => {
    await deleteExpense(id);
    await loadAllData();
  };

  // تبديل العرض بين المكونات لمدير الجمعية
  const renderMainContent = () => {
    if (loading) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '16px' }}>
          <RefreshCw size={44} className="spin-animation" style={{ color: 'var(--primary-green)', animation: 'spin 1.5s linear infinite' }} />
          <p style={{ fontWeight: 'bold', color: 'var(--text-muted)' }}>جاري تحميل البيانات وتحديث الحسابات...</p>
        </div>
      );
    }

    switch (view) {
      case 'dashboard':
        return (
          <Dashboard 
            students={students}
            teachers={teachers}
            groups={groups}
            lessons={lessons}
            enrollments={enrollments}
            expenses={expenses}
            setView={setView}
          />
        );
      case 'lessons':
        return (
          <LessonsManager 
            lessons={lessons}
            onSave={handleSaveLesson}
            onDelete={handleDeleteLesson}
          />
        );
      case 'teachers':
        return (
          <TeachersManager 
            teachers={teachers}
            groups={groups}
            enrollments={enrollments}
            students={students}
            onSave={handleSaveTeacher}
            onDelete={handleDeleteTeacher}
          />
        );
      case 'groups':
        return (
          <GroupsManager 
            groups={groups}
            teachers={teachers}
            lessons={lessons}
            enrollments={enrollments}
            students={students}
            onSave={handleSaveGroup}
            onDelete={handleDeleteGroup}
          />
        );
      case 'students':
        return (
          <StudentsManager 
            students={students}
            groups={groups}
            lessons={lessons}
            enrollments={enrollments}
            onSaveStudent={handleSaveStudent}
            onDeleteStudent={handleDeleteStudent}
            onSaveEnrollment={handleSaveEnrollment}
            onDeleteEnrollment={handleDeleteEnrollment}
          />
        );
      case 'expenses':
        return (
          <ExpensesManager 
            expenses={expenses}
            teachers={teachers}
            groups={groups}
            enrollments={enrollments}
            onSaveExpense={handleSaveExpense}
            onDeleteExpense={handleDeleteExpense}
          />
        );
      default:
        return <div>الصفحة غير موجودة</div>;
    }
  };

  // شاشة الانتظار للتحقق من الجلسة
  if (authLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: '16px', backgroundColor: '#f4f8f7' }}>
        <RefreshCw size={50} className="spin-animation" style={{ color: '#0d9488', animation: 'spin 1.2s linear infinite' }} />
        <p style={{ fontWeight: 'bold', color: '#64748b', fontFamily: 'Cairo, sans-serif' }}>جاري التحقق من الصلاحيات والاتصال الآمن...</p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // إذا لم يسجل المستخدم دخوله، أظهر شاشة الدخول الموحدة
  if (!profile) {
    return <AuthManager onLoginSuccess={(p) => setProfile(p)} />;
  }

  // إذا كان المستخدم مطور (Super Admin)، أظهر لوحة تحكم الجمعيات
  if (profile.role === 'super_admin') {
    return <SuperAdminPanel currentProfile={profile} onLogout={handleLogout} />;
  }

  // إذا كان مستخدم جمعية عادي (Association Admin)، أظهر واجهة الإدارة العادية
  return (
    <div className="app-container">
      {/* الشريط الجانبي (Sidebar) */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <Sparkles size={24} />
          </div>
          <div className="sidebar-logo-text">
            <h1>{profile.association?.name || 'جمعية القرآن'}</h1>
            <p>لوحة إدارة الجمعية</p>
          </div>
        </div>

        <nav style={{ flexGrow: 1 }}>
          <ul className="sidebar-menu">
            <li>
              <button 
                className={`sidebar-item-btn ${view === 'dashboard' ? 'active' : ''}`}
                onClick={() => setView('dashboard')}
              >
                <LayoutDashboard size={20} />
                <span>لوحة التحكم</span>
              </button>
            </li>
            <li>
              <button 
                className={`sidebar-item-btn ${view === 'lessons' ? 'active' : ''}`}
                onClick={() => setView('lessons')}
              >
                <BookOpen size={20} />
                <span>إدارة الدروس</span>
              </button>
            </li>
            <li>
              <button 
                className={`sidebar-item-btn ${view === 'teachers' ? 'active' : ''}`}
                onClick={() => setView('teachers')}
              >
                <GraduationCap size={20} />
                <span>إدارة المدرسين</span>
              </button>
            </li>
            <li>
              <button 
                className={`sidebar-item-btn ${view === 'groups' ? 'active' : ''}`}
                onClick={() => setView('groups')}
              >
                <Layers size={20} />
                <span>إدارة المجموعات</span>
              </button>
            </li>
            <li>
              <button 
                className={`sidebar-item-btn ${view === 'students' ? 'active' : ''}`}
                onClick={() => setView('students')}
              >
                <Users size={20} />
                <span>إدارة الطلاب</span>
              </button>
            </li>
            <li>
              <button 
                className={`sidebar-item-btn ${view === 'expenses' ? 'active' : ''}`}
                onClick={() => setView('expenses')}
              >
                <Wallet size={20} />
                <span>النفقات والمالية</span>
              </button>
            </li>
            
            {/* زر تسجيل الخروج لمدير الجمعية */}
            <li style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
              <button 
                className="sidebar-item-btn"
                onClick={handleLogoutClick}
                style={{ color: 'var(--color-danger)' }}
              >
                <LogOut size={20} />
                <span>تسجيل الخروج</span>
              </button>
            </li>
          </ul>
        </nav>

        <div className="sidebar-footer">
          <p style={{ fontWeight: 'bold', color: 'var(--primary-green)' }}>{profile.name}</p>
          <p style={{ fontSize: '0.65rem', color: 'var(--text-light)', marginTop: '2px' }}>
            {isSupabaseConfigured ? 'متصل بقاعدة Supabase' : 'تخزين محلي نشط'}
          </p>
        </div>
      </aside>

      {/* منطقة العرض الرئيسية */}
      <main className="main-content">
        {renderMainContent()}
      </main>
    </div>
  );
}

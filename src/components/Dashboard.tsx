import { Users, GraduationCap, Layers, DollarSign, BookOpen, Activity, Sparkles, CheckCircle2, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { type Lesson, type Teacher, type Group, type Student, type Enrollment, type Expense, type AcademicLevel, calculateTeacherSalary } from '../lib/db';

interface DashboardProps {
  students: Student[];
  teachers: Teacher[];
  groups: Group[];
  lessons: Lesson[];
  academicLevels: AcademicLevel[];
  enrollments: Enrollment[];
  expenses: Expense[];
  setView: (view: string) => void;
  onInitDefaultData: () => Promise<void>;
}

export const Dashboard = ({
  students,
  teachers,
  groups,
  lessons,
  academicLevels,
  enrollments,
  expenses,
  setView,
  onInitDefaultData
}: DashboardProps) => {
  const [initLoading, setInitLoading] = useState(false);
  // حساب الإحصائيات
  const totalStudents = students.length;
  const totalTeachers = teachers.length;
  const totalGroups = groups.length;

  // حساب المبالغ الماليّة للاشتراكات النشطة
  const currentDate = new Date();
  const activeEnrollments = enrollments.filter(e => {
    const endDate = new Date(e.end_date);
    return endDate >= currentDate;
  });

  let totalExpected = 0;
  let totalCollected = 0;
  let totalRemaining = 0;
  let countPaid = 0;
  let countPartial = 0;
  let countUnpaid = 0;

  activeEnrollments.forEach(e => {
    const price = Number(e.price) || 0;
    const status = e.payment_status || 'paid';
    
    let paid = 0;
    if (status === 'paid') {
      paid = price;
      countPaid++;
    } else if (status === 'unpaid') {
      paid = 0;
      countUnpaid++;
    } else if (status === 'partial') {
      paid = e.paid_amount !== undefined ? Number(e.paid_amount) : price;
      countPartial++;
    }
    
    totalExpected += price;
    totalCollected += paid;
    totalRemaining += (price - paid);
  });

  const collectionRate = totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 100) : 100;

  // حساب النفقات والمصاريف للشهر الحالي
  const currentMonthNum = currentDate.getMonth() + 1;
  const currentYearNum = currentDate.getFullYear();
  const currentMonthExpenses = expenses.filter(exp => {
    if (!exp.date) return false;
    const d = new Date(exp.date);
    return d.getFullYear() === currentYearNum && (d.getMonth() + 1) === currentMonthNum;
  });
  const totalGeneralExpenses = currentMonthExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0);

  // حساب رواتب المعلمين للشهر الحالي
  const totalSalaries = teachers.reduce((sum, teacher) => {
    return sum + calculateTeacherSalary(teacher, activeEnrollments, groups);
  }, 0);

  const totalExpensesCurrentMonth = totalGeneralExpenses + totalSalaries;
  const netProfitCurrentMonth = totalCollected - totalExpensesCurrentMonth;

  // إحصائيات الجنس للطلاب
  const maleStudents = students.filter(s => s.gender === 'male').length;
  const femaleStudents = students.filter(s => s.gender === 'female').length;

  // المدرسين حسب الجنس
  const maleTeachers = teachers.filter(t => t.gender === 'male').length;
  const femaleTeachers = teachers.filter(t => t.gender === 'female').length;

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <h2>لوحة التحكم</h2>
          <p>نظرة عامة على إحصائيات وأنشطة المركز التعليمي</p>
        </div>
        <div className="badge badge-green" style={{ padding: '8px 16px', fontSize: '0.9rem' }}>
          <Activity size={16} style={{ marginLeft: '6px' }} />
          الوضع التجريبي نشط
        </div>
      </div>

      {/* بطاقة الترحيب والتهيئة التلقائية لأول مرة */}
      {lessons.length === 0 && academicLevels.length === 0 && (
        <div className="onboarding-setup-card card" style={{
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          color: '#ffffff',
          borderRadius: '16px',
          padding: '24px 32px',
          boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.3)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          position: 'relative',
          overflow: 'hidden',
          marginBottom: '32px',
          border: 'none',
          transition: 'all 0.3s ease'
        }}>
          {/* Subtle background decoration */}
          <div style={{
            position: 'absolute',
            top: '-20px',
            left: '-20px',
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.08)',
            pointerEvents: 'none'
          }} />
          <div style={{
            position: 'absolute',
            bottom: '-40px',
            right: '-10px',
            width: '180px',
            height: '180px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.05)',
            pointerEvents: 'none'
          }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '12px',
              padding: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Sparkles size={28} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '800', letterSpacing: '-0.5px' }}>مرحباً بك في أكاديمية أيبكس!</h3>
              <p style={{ margin: '4px 0 0 0', opacity: 0.9, fontSize: '0.95rem' }}>مساعد التهيئة السريعة لقاعدة البيانات الجديدة</p>
            </div>
          </div>

          <p style={{ margin: 0, fontSize: '1.05rem', lineHeight: '1.7', opacity: 0.95, maxWidth: '800px' }}>
            يبدو أن هذه هي المرة الأولى لتشغيل الأكاديمية وقاعدة البيانات فارغة تماماً. لمساعدتك في إعداد المنصة بسرعة وبدء العمل، نقترح تعبئة الجداول تلقائياً بـ **المستويات الدراسية المعتمدة** (الابتدائي، المتوسط، والثانوي بكافة تخصصاته وشعبه) بالإضافة إلى **المواد الأساسية** (الرياضيات، الفيزياء، العلوم، اللغات، الفلسفة) بضغطة زر واحدة دون الحاجة لكتابتها يدوياً.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '8px', alignItems: 'center' }}>
            <button
              onClick={async () => {
                setInitLoading(true);
                try {
                  await onInitDefaultData();
                } catch (err) {
                  console.error(err);
                } finally {
                  setInitLoading(false);
                }
              }}
              disabled={initLoading}
              style={{
                background: '#ffffff',
                color: '#065f46',
                border: 'none',
                borderRadius: '10px',
                padding: '12px 24px',
                fontSize: '1rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                transition: 'all 0.2s ease',
              }}
            >
              {initLoading ? (
                <>
                  <RefreshCw size={18} className="spin-animation" style={{ animation: 'spin 1s linear infinite' }} />
                  <span>جاري تهيئة وتعبئة قاعدة البيانات...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={18} />
                  <span>تعبئة قاعدة البيانات تلقائياً بالبيانات المعتمدة</span>
                </>
              )}
            </button>

            <button
              onClick={() => setView('levels')}
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '10px',
                padding: '12px 20px',
                fontSize: '1rem',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              سأقوم بتهيئة البيانات يدوياً
            </button>
          </div>
        </div>
      )}

      {/* كروت الأرقام السريعة */}
      <div className="stats-grid">
        <div className="stat-card green" onClick={() => setView('students')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon">
            <Users size={28} />
          </div>
          <div className="stat-info">
            <span className="stat-title">عدد التلاميذ الكلي</span>
            <span className="stat-value">{totalStudents} تلميذ/ة</span>
          </div>
        </div>

        <div className="stat-card blue" onClick={() => setView('teachers')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon">
            <GraduationCap size={28} />
          </div>
          <div className="stat-info">
            <span className="stat-title">الأساتذة والأستاذات</span>
            <span className="stat-value">{totalTeachers} أساتذة</span>
          </div>
        </div>

        <div className="stat-card mint" onClick={() => setView('groups')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon">
            <Layers size={28} />
          </div>
          <div className="stat-info">
            <span className="stat-title">الأفواج الحالية</span>
            <span className="stat-value">{totalGroups} أفواج</span>
          </div>
        </div>

        <div className="stat-card orange" onClick={() => setView('expenses')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon">
            <DollarSign size={28} />
          </div>
          <div className="stat-info">
            <span className="stat-title">صافي أرباح الشهر الحالي</span>
            <span className="stat-value">{netProfitCurrentMonth} د.م.</span>
          </div>
        </div>
      </div>

      {/* تفاصيل التوزيع */}
      <div className="cards-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', marginTop: '32px' }}>
        {/* كرت التحصيل والتقرير المالي */}
        <div className="card" style={{ minHeight: 'auto' }}>
          <div className="card-header">
            <div>
              <h3 className="card-title">تقرير الفواتير والتحصيل المالي</h3>
              <p className="card-subtitle">تتبع المداخيل المستهدفة والمبالغ المحصلة والديون المتبقية للفواتير</p>
            </div>
            <DollarSign size={20} className="card-info-icon" style={{ color: 'var(--primary-green)' }} />
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* شريط تقدم التحصيل الفعلي */}
              <div style={{ backgroundColor: 'var(--primary-green-subtle)', padding: '14px', borderRadius: '12px', border: '1px solid var(--primary-green-light)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 'bold', fontSize: '0.9rem', color: 'var(--primary-green-dark)' }}>نسبة تحصيل المداخيل</span>
                  <span style={{ fontWeight: '800', fontSize: '1.1rem', color: 'var(--primary-green-dark)' }}>{collectionRate}%</span>
                </div>
                <div style={{ height: '10px', borderRadius: '5px', backgroundColor: '#e2e8f0', overflow: 'hidden', display: 'flex' }}>
                  <div 
                    style={{ 
                      width: `${collectionRate}%`, 
                      backgroundImage: 'linear-gradient(to left, var(--primary-green), var(--color-success))', 
                      height: '100%',
                      borderRadius: '5px',
                      transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                  />
                </div>
              </div>

              {/* تفاصيل المبالغ */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', textAlign: 'center' }}>
                <div style={{ padding: '12px 8px', backgroundColor: 'var(--primary-blue-subtle)', borderRadius: '10px', border: '1px solid var(--primary-blue-light)' }}>
                  <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--primary-blue-dark)', fontWeight: 'bold', marginBottom: '4px' }}>الإيرادات المتوقعة</span>
                  <span style={{ display: 'block', fontSize: '1.1rem', fontWeight: '800', color: 'var(--primary-blue-dark)' }}>{totalExpected} <span style={{ fontSize: '0.75rem', fontWeight: 'normal' }}>د.م.</span></span>
                </div>

                <div style={{ padding: '12px 8px', backgroundColor: 'var(--primary-green-subtle)', borderRadius: '10px', border: '1px solid var(--primary-green-light)' }}>
                  <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--primary-green-dark)', fontWeight: 'bold', marginBottom: '4px' }}>المبالغ المحصلة</span>
                  <span style={{ display: 'block', fontSize: '1.1rem', fontWeight: '800', color: 'var(--primary-green-dark)' }}>{totalCollected} <span style={{ fontSize: '0.75rem', fontWeight: 'normal' }}>د.م.</span></span>
                </div>

                <div style={{ padding: '12px 8px', backgroundColor: totalRemaining > 0 ? '#fef2f2' : '#f0fdf4', borderRadius: '10px', border: `1px solid ${totalRemaining > 0 ? '#fee2e2' : '#dcfce7'}` }}>
                  <span style={{ display: 'block', fontSize: '0.75rem', color: totalRemaining > 0 ? 'var(--color-danger)' : 'var(--color-success)', fontWeight: 'bold', marginBottom: '4px' }}>المستحقات المتبقية</span>
                  <span style={{ display: 'block', fontSize: '1.1rem', fontWeight: '800', color: totalRemaining > 0 ? 'var(--color-danger)' : 'var(--color-success)' }}>{totalRemaining} <span style={{ fontSize: '0.75rem', fontWeight: 'normal' }}>د.م.</span></span>
                </div>
              </div>

              {/* تفاصيل حالات الدفع بالعدد */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-success)' }}></span>
                    <span>اشتراكات مدفوعة بالكامل:</span>
                  </span>
                  <span style={{ fontWeight: 'bold' }}>{countPaid} اشتراك</span>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-warning)' }}></span>
                    <span>اشتراكات بدفع جزئي:</span>
                  </span>
                  <span style={{ fontWeight: 'bold' }}>{countPartial} اشتراك</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-danger)' }}></span>
                    <span>اشتراكات متأخرة / غير مدفوعة:</span>
                  </span>
                  <span style={{ fontWeight: 'bold', color: countUnpaid > 0 ? 'var(--color-danger)' : 'inherit' }}>{countUnpaid} اشتراك</span>
                </div>
              </div>
            </div>
          </div>
          <div className="card-footer" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <span>تحديث تلقائي للفواتير والاشتراكات النشطة</span>
            <button className="btn-link" onClick={() => setView('students')} style={{ border: 'none', background: 'none', color: 'var(--primary-blue)', cursor: 'pointer', padding: 0 }}>عرض الاشتراكات</button>
          </div>
        </div>

        {/* كرت توزيع التلاميذ والأساتذة */}
        <div className="card" style={{ minHeight: 'auto' }}>
          <div className="card-header">
            <div>
              <h3 className="card-title">توزيع الفئات حسب الجنس</h3>
              <p className="card-subtitle">الذكور والإناث في المركز</p>
            </div>
            <Users size={20} className="card-info-icon" />
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* التلاميذ */}
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '8px' }}>التلاميذ والتلميذات ({totalStudents}):</h4>
                <div style={{ display: 'flex', height: '28px', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#e2e8f0' }}>
                  <div 
                    style={{ 
                      width: totalStudents ? `${(maleStudents / totalStudents) * 100}%` : '0%', 
                      backgroundColor: 'var(--primary-blue)', 
                      color: 'white', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      fontSize: '0.75rem', 
                      fontWeight: 'bold',
                      transition: 'width 0.5s ease'
                    }}
                    title={`ذكور: ${maleStudents}`}
                  >
                    {maleStudents > 0 && `تلاميذ (${maleStudents})`}
                  </div>
                  <div 
                    style={{ 
                      width: totalStudents ? `${(femaleStudents / totalStudents) * 100}%` : '0%', 
                      backgroundColor: 'var(--primary-green)', 
                      color: 'white', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      fontSize: '0.75rem', 
                      fontWeight: 'bold',
                      transition: 'width 0.5s ease'
                    }}
                    title={`إناث: ${femaleStudents}`}
                  >
                    {femaleStudents > 0 && `تلميذات (${femaleStudents})`}
                  </div>
                </div>
              </div>

              {/* الأساتذة */}
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '8px' }}>الأساتذة والأستاذات ({totalTeachers}):</h4>
                <div style={{ display: 'flex', height: '28px', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#e2e8f0' }}>
                  <div 
                    style={{ 
                      width: totalTeachers ? `${(maleTeachers / totalTeachers) * 100}%` : '0%', 
                      backgroundColor: 'var(--primary-blue)', 
                      color: 'white', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      fontSize: '0.75rem', 
                      fontWeight: 'bold',
                      transition: 'width 0.5s ease'
                    }}
                    title={`أساتذة: ${maleTeachers}`}
                  >
                    {maleTeachers > 0 && `أساتذة (${maleTeachers})`}
                  </div>
                  <div 
                    style={{ 
                      width: totalTeachers ? `${(femaleTeachers / totalTeachers) * 100}%` : '0%', 
                      backgroundColor: 'var(--primary-green)', 
                      color: 'white', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      fontSize: '0.75rem', 
                      fontWeight: 'bold',
                      transition: 'width 0.5s ease'
                    }}
                    title={`أستاذات: ${femaleTeachers}`}
                  >
                    {femaleTeachers > 0 && `أستاذات (${femaleTeachers})`}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="card-footer" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <span>تحديث فوري بناءً على الجداول الفعالة</span>
          </div>
        </div>

        {/* كرت المجموعات والدروس السريعة */}
        <div className="card" style={{ minHeight: 'auto' }}>
          <div className="card-header">
            <div>
              <h3 className="card-title">المواد الدراسية الحالية</h3>
              <p className="card-subtitle">المواد المسجلة وعدد أفواجها</p>
            </div>
            <BookOpen size={20} className="card-info-icon" />
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {lessons.map(lesson => {
                const groupCount = groups.filter(g => g.lesson_id === lesson.id).length;
                const studentCount = enrollments.filter(e => e.lesson_id === lesson.id).length;
                return (
                  <div key={lesson.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', backgroundColor: 'var(--bg-main)', borderRadius: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--primary-green)' }}></div>
                      <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{lesson.name}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <span className="badge badge-blue">{groupCount} أفواج</span>
                      <span className="badge badge-green">{studentCount} تلاميذ</span>
                    </div>
                  </div>
                );
              })}
              {lessons.length === 0 && (
                <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                  لا توجد مواد دراسية حالياً
                </div>
              )}
            </div>
          </div>
          <div className="card-footer">
            <button className="btn btn-outline" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setView('lessons')}>
              <BookOpen size={16} />
              إدارة المواد الدراسية بالتفصيل
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

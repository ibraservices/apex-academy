import { useState, type FormEvent } from 'react';
import { Plus, Edit2, Trash2, X, Printer, CreditCard, FileText } from 'lucide-react';
import { type Expense, type Teacher, type Group, type Enrollment, type Student, type Lesson, calculateTeacherSalary } from '../lib/db';

interface ExpensesManagerProps {
  expenses: Expense[];
  teachers: Teacher[];
  groups: Group[];
  lessons: Lesson[];
  enrollments: Enrollment[];
  students: Student[];
  onSaveExpense: (expense: Omit<Expense, 'id'> & { id?: string }) => Promise<void>;
  onDeleteExpense: (id: string) => Promise<void>;
}

export const ExpensesManager = ({
  expenses,
  teachers,
  groups,
  lessons,
  enrollments,
  students,
  onSaveExpense,
  onDeleteExpense
}: ExpensesManagerProps) => {
  const [activeTab, setActiveTab] = useState<'list' | 'report'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // حالات تسجيل وتعديل المصاريف
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentExpense, setCurrentExpense] = useState<Partial<Expense> | null>(null);

  // حالات فلتر التقرير الشهري
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const [reportYear, setReportYear] = useState<number>(currentYear);
  const [reportMonth, setReportMonth] = useState<number>(currentMonth);
  const [includeSalaries, setIncludeSalaries] = useState<boolean>(true);

  // فئات المصاريف باللغة العربية
  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'rent': return 'كراء';
      case 'bills': return 'فواتير (ماء/كهرباء/إنترنت)';
      case 'salaries': return 'رواتب إضافية';
      case 'supplies': return 'أدوات مكتبية ومستلزمات';
      default: return 'أخرى';
    }
  };

  // تصفية النفقات العامة لجدول المصاريف
  const filteredExpenses = expenses.filter(exp => {
    const matchesSearch = exp.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (exp.description && exp.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = categoryFilter === 'all' || exp.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleOpenAddModal = () => {
    setCurrentExpense({
      title: '',
      amount: 0,
      date: new Date().toISOString().split('T')[0],
      category: 'other',
      description: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (expense: Expense) => {
    setCurrentExpense(expense);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentExpense(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentExpense?.title?.trim() || !currentExpense?.amount || !currentExpense?.date) return;
    
    await onSaveExpense(currentExpense as Expense);
    handleCloseModal();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذه النفقة نهائياً؟')) {
      await onDeleteExpense(id);
    }
  };

  // ==========================================
  // حسابات التقرير المالي للشهر المختار
  // ==========================================

  // دالة مساعدة للتحقق مما إذا كان التاريخ يقع في الشهر المختار
  const isDateInSelectedMonth = (dateStr: string) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    return d.getFullYear() === reportYear && (d.getMonth() + 1) === reportMonth;
  };

  // 1. المداخيل المحصلة فعلياً في هذا الشهر
  const monthEnrollments = enrollments.filter(e => isDateInSelectedMonth(e.start_date));
  const totalIncomeCollected = monthEnrollments.reduce((sum, e) => {
    const status = e.payment_status || 'paid';
    if (status === 'paid') return sum + Number(e.price);
    if (status === 'partial') return sum + (e.paid_amount !== undefined ? Number(e.paid_amount) : Number(e.price));
    return sum; // unpaid = 0
  }, 0);

  // 2. النفقات العامة المسجلة في هذا الشهر
  const monthGeneralExpenses = expenses.filter(exp => isDateInSelectedMonth(exp.date));
  const totalGeneralExpenses = monthGeneralExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0);

  // 3. رواتب الأساتذة المحتسبة لهذا الشهر
  // الأساتذة النشطون هم الذين لديهم مجموعات ولدى مجموعاتهم تلاميذ مسجلين
  const teacherSalariesList = teachers.map(teacher => {
    // حساب الراتب بناءً على اشتراكات هذا الشهر المختار فقط
    const salary = calculateTeacherSalary(teacher, monthEnrollments, groups);
    return {
      id: teacher.id,
      name: teacher.name,
      type: teacher.salary_type,
      value: teacher.salary_value,
      calculatedSalary: salary
    };
  }).filter(t => t.calculatedSalary > 0 || t.type === 'fixed'); // إظهار الأساتذة المستحقين

  const totalTeachersSalaries = teacherSalariesList.reduce((sum, t) => sum + t.calculatedSalary, 0);

  // 4. الحسابات الإجمالية للتقرير
  const totalExpenses = totalGeneralExpenses + (includeSalaries ? totalTeachersSalaries : 0);
  const netProfit = totalIncomeCollected - totalExpenses;

  // الاشتراكات المنتهية ولها مستحقات معلقة للشهر المختار
  const expiredUnpaidEnrollments = enrollments.filter(e => {
    if (!isDateInSelectedMonth(e.start_date)) return false;
    const endDate = new Date(e.end_date);
    const now = new Date();
    endDate.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    const isExpired = now > endDate;
    if (!isExpired) return false;
    const status = e.payment_status || 'paid';
    return status === 'unpaid' || status === 'partial';
  });

  const totalUnpaidExpired = expiredUnpaidEnrollments.reduce((sum, e) => {
    const pAmount = e.paid_amount !== undefined ? e.paid_amount : e.price;
    return sum + (e.price - pAmount);
  }, 0);

  // خيارات الأشهر باللغة العربية
  const monthsArabic = [
    'يناير (01)', 'فبراير (02)', 'مارس (03)', 'أبريل (04)', 'ماي (05)', 'يونيو (06)',
    'يوليوز (07)', 'غشت (08)', 'شتنبر (09)', 'أكتوبر (10)', 'نونبر (11)', 'دجنبر (12)'
  ];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div>
      {/* رأس الصفحة والهيدر - مخفي في الطباعة */}
      <div className="page-header no-print">
        <div className="page-title">
          <h2>إدارة النفقات والتقرير المالي</h2>
          <p>متابعة وتوثيق المصاريف، أجور الأساتذة، وصافي الأرباح الشهرية</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            className={`btn ${activeTab === 'list' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setActiveTab('list')}
          >
            <CreditCard size={18} />
            النفقات والمصاريف
          </button>
          <button 
            className={`btn ${activeTab === 'report' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setActiveTab('report')}
          >
            <FileText size={18} />
            التقرير المالي الشهري
          </button>
        </div>
      </div>

      {/* ========================================== */}
      {/* التبويب الأول: إدارة وتسجيل المصاريف */}
      {/* ========================================== */}
      {activeTab === 'list' && (
        <div className="no-print">
          {/* شريط الفلاتر للمصاريف */}
          <div className="filters-container">
            <div className="filter-group" style={{ flexGrow: 2 }}>
              <label className="filter-label">البحث عن نفقة</label>
              <input
                type="text"
                className="filter-input"
                placeholder="ابحث بالعنوان أو التفاصيل..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>

            <div className="filter-group">
              <label className="filter-label">التصنيف</label>
              <select className="filter-input" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                <option value="all">كل التصنيفات</option>
                <option value="rent">كراء</option>
                <option value="bills">فواتير</option>
                <option value="supplies">أدوات مكتبية</option>
                <option value="salaries">رواتب إضافية</option>
                <option value="other">أخرى</option>
              </select>
            </div>

            <button 
              className="btn btn-primary" 
              style={{ alignSelf: 'flex-end', height: '45px' }}
              onClick={handleOpenAddModal}
            >
              <Plus size={18} />
              تسجيل نفقة جديدة
            </button>
          </div>

          {/* جدول النفقات */}
          {filteredExpenses.length > 0 ? (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>عنوان النفقة</th>
                    <th>المبلغ (درهم)</th>
                    <th>التاريخ</th>
                    <th>الفئة / التصنيف</th>
                    <th>التفاصيل</th>
                    <th>الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExpenses.map(exp => (
                    <tr key={exp.id}>
                      <td style={{ fontWeight: 'bold', color: 'var(--text-dark)' }}>{exp.title}</td>
                      <td style={{ fontWeight: 'bold', color: 'var(--color-danger)' }}>{exp.amount} د.م.</td>
                      <td>{exp.date}</td>
                      <td>
                        <span className="badge badge-blue">
                          {getCategoryLabel(exp.category)}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{exp.description || '-'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button 
                            className="btn-icon-only" 
                            title="تعديل النفقة" 
                            onClick={() => handleOpenEditModal(exp)}
                          >
                            <Edit2 size={14} />
                          </button>
                          <button 
                            className="btn-icon-only danger" 
                            title="حذف النفقة" 
                            onClick={() => handleDelete(exp.id)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="no-data-card">
              <CreditCard className="no-data-icon" size={48} />
              <h4 className="no-data-text">لا توجد نفقات مسجلة</h4>
              <p>سجل مصاريف المركز (مثل الكراء، الفواتير، الأدوات) لتتمكن من رصد التقرير المالي بدقة.</p>
            </div>
          )}
        </div>
      )}

      {/* ========================================== */}
      {/* التبويب الثاني: التقرير المالي الشهري */}
      {/* ========================================== */}
      {activeTab === 'report' && (
        <div>
          {/* التحكم والفلترة بالتقرير - مخفي في الطباعة */}
          <div className="filters-container no-print" style={{ backgroundColor: 'var(--primary-blue-subtle)', border: '1px solid var(--primary-blue-light)' }}>
            <div className="filter-group">
              <label className="filter-label" style={{ color: 'var(--primary-blue-dark)', fontWeight: 'bold' }}>اختر السنة</label>
              <select className="filter-input" value={reportYear} onChange={(e) => setReportYear(Number(e.target.value))}>
                {[2025, 2026, 2027, 2028].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label className="filter-label" style={{ color: 'var(--primary-blue-dark)', fontWeight: 'bold' }}>اختر الشهر</label>
              <select className="filter-input" value={reportMonth} onChange={(e) => setReportMonth(Number(e.target.value))}>
                {monthsArabic.map((m, idx) => (
                  <option key={idx} value={idx + 1}>{m}</option>
                ))}
              </select>
            </div>

            <div className="filter-group" style={{ display: 'flex', alignItems: 'center', marginTop: '20px', gap: '8px' }}>
              <input
                type="checkbox"
                id="includeSalariesCheckbox"
                checked={includeSalaries}
                onChange={(e) => setIncludeSalaries(e.target.checked)}
                style={{ accentColor: 'var(--primary-green)', cursor: 'pointer', width: '18px', height: '18px' }}
              />
              <label htmlFor="includeSalariesCheckbox" style={{ fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem' }}>
                تضمين أجور الأساتذة في حساب المصاريف والأرباح
              </label>
            </div>

            <button 
              className="btn btn-primary" 
              style={{ alignSelf: 'flex-end', height: '45px', gap: '8px' }}
              onClick={handlePrint}
            >
              <Printer size={18} />
              طباعة التقرير المالي
            </button>
          </div>

          {/* محتوى المعاينة المطبوعة والظاهرة */}
          <div className="printable-report-wrapper" style={{ marginTop: '20px' }}>
            
            {/* عنوان الترويسة للتقرير المالي المطبوع - يظهر في الطباعة وفي المعاينة */}
            <div style={{ 
              textAlign: 'center', 
              paddingBottom: '20px', 
              borderBottom: '2px solid var(--primary-green)', 
              marginBottom: '25px'
            }}>
              <h2 style={{ fontSize: '1.6rem', color: 'var(--primary-green-dark)', fontWeight: '800' }}>
                التقرير المالي الشهري للمركز
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '6px' }}>
                الفترة المحددة: <strong style={{ color: 'var(--text-dark)' }}>{monthsArabic[reportMonth - 1]} / {reportYear}</strong>
              </p>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-light)', display: 'block', marginTop: '4px' }}>
                تاريخ توليد التقرير: {new Date().toLocaleDateString('ar-MA')}
              </span>
            </div>

            {/* بطاقات المؤشرات المالية الثلاثة */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
              {/* بطاقة المداخيل */}
              <div style={{ padding: '16px', backgroundColor: 'var(--primary-green-subtle)', borderRadius: '12px', border: '1px solid var(--primary-green-light)', textAlign: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--primary-green-dark)', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>
                  إجمالي المقبوضات والمداخيل
                </span>
                <span style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--primary-green-dark)' }}>
                  {totalIncomeCollected} <span style={{ fontSize: '0.85rem', fontWeight: 'normal' }}>د.م.</span>
                </span>
                <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  ({monthEnrollments.length} تسجيل نشط للشهر)
                </span>
              </div>

              {/* بطاقة المصاريف */}
              <div style={{ padding: '16px', backgroundColor: '#fef2f2', borderRadius: '12px', border: '1px solid #fee2e2', textAlign: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--color-danger)', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>
                  إجمالي النفقات والمصاريف
                </span>
                <span style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--color-danger)' }}>
                  {totalExpenses} <span style={{ fontSize: '0.85rem', fontWeight: 'normal' }}>د.م.</span>
                </span>
                <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  {includeSalaries 
                    ? `(${monthGeneralExpenses.length} نفقات عامة + رواتب الأساتذة)`
                    : `(${monthGeneralExpenses.length} نفقات عامة - دون الرواتب)`}
                </span>
              </div>

              {/* بطاقة الرصيد الصافي */}
              <div style={{ 
                padding: '16px', 
                backgroundColor: netProfit >= 0 ? 'var(--primary-blue-subtle)' : '#fff5f5', 
                borderRadius: '12px', 
                border: `1px solid ${netProfit >= 0 ? 'var(--primary-blue-light)' : '#ffe3e3'}`, 
                textAlign: 'center' 
              }}>
                <span style={{ fontSize: '0.85rem', color: netProfit >= 0 ? 'var(--primary-blue-dark)' : 'var(--color-danger)', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>
                  الرصيد المالي وصافي الأرباح
                </span>
                <span style={{ fontSize: '1.4rem', fontWeight: '800', color: netProfit >= 0 ? 'var(--primary-blue-dark)' : 'var(--color-danger)' }}>
                  {netProfit} <span style={{ fontSize: '0.85rem', fontWeight: 'normal' }}>د.م.</span>
                </span>
                <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  {netProfit >= 0 ? 'فائض مالي نشط' : 'عجز مالي سلبي'}
                </span>
              </div>
            </div>

            {/* تفصيل جداول التقرير */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
              
              {/* جدول 1: المصاريف والنفقات العامة */}
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 'bold', color: 'var(--text-dark)', borderRight: '4px solid var(--color-danger)', paddingRight: '8px', marginBottom: '12px' }}>
                  أولاً: تفصيل النفقات والمصاريف العامة ({monthGeneralExpenses.length})
                </h3>
                {monthGeneralExpenses.length > 0 ? (
                  <table className="data-table" style={{ width: '100%' }}>
                    <thead>
                      <tr>
                        <th>البيان / الوصف</th>
                        <th>التاريخ</th>
                        <th>التصنيف</th>
                        <th>المبلغ بالدرهم</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monthGeneralExpenses.map(exp => (
                        <tr key={exp.id}>
                          <td>{exp.title}</td>
                          <td>{exp.date}</td>
                          <td>{getCategoryLabel(exp.category)}</td>
                          <td style={{ fontWeight: 'bold', color: 'var(--color-danger)' }}>{exp.amount} د.م.</td>
                        </tr>
                      ))}
                      <tr style={{ backgroundColor: '#fafafa', fontWeight: 'bold' }}>
                        <td colSpan={3} style={{ textAlign: 'left' }}>مجموع المصاريف العامة:</td>
                        <td style={{ color: 'var(--color-danger)' }}>{totalGeneralExpenses} د.م.</td>
                      </tr>
                    </tbody>
                  </table>
                ) : (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '10px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
                    لا توجد نفقات عامة مسجلة في هذا الشهر.
                  </p>
                )}
              </div>

              {/* جدول 2: أجور المعلمين (يظهر فقط إذا كان اختيار الرواتب مفعلاً) */}
              {includeSalaries && (
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 'bold', color: 'var(--text-dark)', borderRight: '4px solid var(--primary-blue)', paddingRight: '8px', marginBottom: '12px' }}>
                    ثانياً: أجور الأساتذة المحتسبة لهذا الشهر ({teacherSalariesList.length})
                  </h3>
                  {teacherSalariesList.length > 0 ? (
                    <table className="data-table" style={{ width: '100%' }}>
                      <thead>
                        <tr>
                          <th>اسم الأستاذ</th>
                          <th>طريقة احتساب الراتب</th>
                          <th>الأجر المستحق بالدرهم</th>
                        </tr>
                      </thead>
                      <tbody>
                        {teacherSalariesList.map(t => (
                          <tr key={t.id}>
                            <td>{t.name}</td>
                            <td>
                              {t.type === 'fixed' 
                                ? `راتب قار (${t.value} د.م. شهرياً)` 
                                : `نسبة مئوية (${t.value}% من اشتراكات تلاميذه المجمعة)`}
                            </td>
                            <td style={{ fontWeight: 'bold', color: 'var(--primary-blue-dark)' }}>{t.calculatedSalary} د.م.</td>
                          </tr>
                        ))}
                        <tr style={{ backgroundColor: '#fafafa', fontWeight: 'bold' }}>
                          <td colSpan={2} style={{ textAlign: 'left' }}>مجموع أجور الأساتذة المستحقة:</td>
                          <td style={{ color: 'var(--primary-blue-dark)' }}>{totalTeachersSalaries} د.م.</td>
                        </tr>
                      </tbody>
                    </table>
                  ) : (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '10px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
                      لا توجد أجور مستحقة للأساتذة في هذا الشهر (لا توجد اشتراكات نشطة في أفواجهم).
                    </p>
                  )}
                </div>
              )}

              {/* جدول 3: المداخيل بالتفصيل (للتوثيق) */}
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 'bold', color: 'var(--text-dark)', borderRight: '4px solid var(--primary-green)', paddingRight: '8px', marginBottom: '12px' }}>
                  ثالثاً: تفاصيل مقبوضات اشتراكات التلاميذ المجمعة ({monthEnrollments.length})
                </h3>
                {monthEnrollments.length > 0 ? (
                  <table className="data-table" style={{ width: '100%' }}>
                    <thead>
                      <tr>
                        <th>اسم التلميذ(ة)</th>
                        <th>المادة / الفوج</th>
                        <th>تاريخ البدء</th>
                        <th>ثمن الاشتراك الكلي</th>
                        <th>المبلغ المحصل فعلياً</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monthEnrollments.map(e => {
                        const student = students.find(s => s.id === e.student_id);
                        const group = groups.find(g => g.id === e.group_id);
                        const lesson = lessons.find(l => l.id === e.lesson_id);
                        const status = e.payment_status || 'paid';
                        const collected = status === 'paid' ? e.price : (status === 'unpaid' ? 0 : (e.paid_amount || 0));
                        return (
                          <tr key={e.id}>
                            <td style={{ fontWeight: 'bold' }}>{student?.name || 'تلميذ محذوف'}</td>
                            <td>{lesson?.name || 'مادة محذوفة'} - {group?.name || 'فوج محذوف'}</td>
                            <td>{e.start_date}</td>
                            <td>{e.price} د.م.</td>
                            <td style={{ fontWeight: 'bold', color: 'var(--primary-green-dark)' }}>{collected} د.م.</td>
                          </tr>
                        );
                      })}
                      <tr style={{ backgroundColor: '#fafafa', fontWeight: 'bold' }}>
                        <td colSpan={4} style={{ textAlign: 'left' }}>إجمالي المداخيل المحصلة:</td>
                        <td style={{ color: 'var(--primary-green-dark)' }}>{totalIncomeCollected} د.م.</td>
                      </tr>
                    </tbody>
                  </table>
                ) : (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '10px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
                    لا توجد اشتراكات تلاميذ مسجلة في هذا الشهر.
                  </p>
                )}
              </div>

              {/* جدول 4: الاشتراكات المنتهية وبها مستحقات معلقة */}
              <div style={{ marginTop: '20px' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 'bold', color: 'var(--text-dark)', borderRight: '4px solid #ef4444', paddingRight: '8px', marginBottom: '12px' }}>
                  رابعاً: الاشتراكات المنتهية ولها مستحقات مالية معلقة (الديون غير المحصلة)
                </h3>
                {expiredUnpaidEnrollments.length > 0 ? (
                  <table className="data-table" style={{ width: '100%' }}>
                    <thead>
                      <tr>
                        <th>اسم التلميذ(ة)</th>
                        <th>المادة / الفوج</th>
                        <th>تاريخ البدء والانتهاء</th>
                        <th>ثمن الاشتراك الكلي</th>
                        <th>المبلغ المدفوع</th>
                        <th>المستحقات المعلقة</th>
                      </tr>
                    </thead>
                    <tbody>
                      {expiredUnpaidEnrollments.map(e => {
                        const student = students.find(s => s.id === e.student_id);
                        const group = groups.find(g => g.id === e.group_id);
                        const lesson = lessons.find(l => l.id === e.lesson_id);
                        const pAmount = e.paid_amount !== undefined ? e.paid_amount : e.price;
                        const unpaid = e.price - pAmount;
                        return (
                          <tr key={e.id}>
                            <td style={{ fontWeight: 'bold' }}>{student?.name || 'تلميذ محذوف'}</td>
                            <td>{lesson?.name || 'مادة محذوفة'} - {group?.name || 'فوج محذوف'}</td>
                            <td style={{ fontSize: '0.85rem' }}>من {e.start_date} إلى {e.end_date}</td>
                            <td>{e.price} د.م.</td>
                            <td style={{ color: 'var(--primary-green)' }}>{pAmount} د.م.</td>
                            <td style={{ fontWeight: 'bold', color: '#ef4444' }}>{unpaid} د.م.</td>
                          </tr>
                        );
                      })}
                      <tr style={{ backgroundColor: '#fafafa', fontWeight: 'bold' }}>
                        <td colSpan={5} style={{ textAlign: 'left' }}>إجمالي الديون المعلقة غير المحصلة للاشتراكات المنتهية:</td>
                        <td style={{ color: '#ef4444' }}>{totalUnpaidExpired} د.م.</td>
                      </tr>
                    </tbody>
                  </table>
                ) : (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '10px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
                    لا توجد اشتراكات منتهية بها مستحقات معلقة في هذا الشهر.
                  </p>
                )}
              </div>

              {/* ذيل الفاتورة للتوقيع - يظهر فقط في الطباعة بفضل CSS */}
              <div className="print-only" style={{ 
                marginTop: '60px', 
                display: 'none', 
                justifyContent: 'space-between',
                paddingLeft: '40px',
                paddingRight: '40px'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontWeight: 'bold', textDecoration: 'underline' }}>توقيع أمين المال</p>
                  <p style={{ marginTop: '50px', color: '#ccc' }}>__________________</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontWeight: 'bold', textDecoration: 'underline' }}>توقيع مدير المركز</p>
                  <p style={{ marginTop: '50px', color: '#ccc' }}>__________________</p>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* نافذة إضافة وتعديل النفقات */}
      {/* ========================================== */}
      {isModalOpen && currentExpense && (
        <div className="modal-overlay no-print">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">
                {currentExpense.id ? 'تعديل بيانات النفقة' : 'تسجيل مصروف / نفقة جديدة'}
              </h3>
              <button className="modal-close-btn" onClick={handleCloseModal}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">عنوان النفقة أو البند *</label>
                    <input
                      type="text"
                      className="form-input"
                      required
                      placeholder="مثال: فاتورة الإنترنت لشهر يونيو"
                      value={currentExpense.title || ''}
                      onChange={(e) => setCurrentExpense({ ...currentExpense, title: e.target.value })}
                    />
                  </div>

                  <div className="form-grid two-cols">
                    <div className="form-group">
                      <label className="form-label">المبلغ بالدرهم *</label>
                      <input
                        type="number"
                        className="form-input"
                        required
                        min="1"
                        placeholder="المبلغ بالدرهم"
                        value={currentExpense.amount || ''}
                        onChange={(e) => setCurrentExpense({ ...currentExpense, amount: Number(e.target.value) })}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">التاريخ *</label>
                      <input
                        type="date"
                        className="form-input"
                        required
                        value={currentExpense.date || ''}
                        onChange={(e) => setCurrentExpense({ ...currentExpense, date: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">الفئة / التصنيف *</label>
                    <select
                      className="form-input"
                      required
                      value={currentExpense.category || 'other'}
                      onChange={(e) => setCurrentExpense({ ...currentExpense, category: e.target.value as any })}
                    >
                      <option value="rent">كراء</option>
                      <option value="bills">فواتير</option>
                      <option value="supplies">أدوات مكتبية ومستلزمات</option>
                      <option value="salaries">رواتب إضافية</option>
                      <option value="other">أخرى</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">تفاصيل إضافية</label>
                    <textarea
                      className="form-input"
                      rows={3}
                      placeholder="أية ملاحظات أو تفاصيل عن هذا المصرف..."
                      value={currentExpense.description || ''}
                      onChange={(e) => setCurrentExpense({ ...currentExpense, description: e.target.value })}
                      style={{ resize: 'vertical' }}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={handleCloseModal}>
                  إلغاء
                </button>
                <button type="submit" className="btn btn-primary">
                  {currentExpense.id ? 'حفظ التعديلات' : 'تسجيل المصروف'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

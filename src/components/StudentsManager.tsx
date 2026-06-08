import { useState, type FormEvent } from 'react';
import { Plus, Search, Edit2, Trash2, X, Users, User, Phone, Sparkles, AlertTriangle } from 'lucide-react';
import { type Student, type Group, type Lesson, type Enrollment } from '../lib/db';

interface StudentsManagerProps {
  students: Student[];
  groups: Group[];
  lessons: Lesson[];
  enrollments: Enrollment[];
  onSaveStudent: (student: Omit<Student, 'id'> & { id?: string }) => Promise<Student>;
  onDeleteStudent: (id: string) => Promise<void>;
  onSaveEnrollment: (enrollment: Omit<Enrollment, 'id'> & { id?: string }) => Promise<void>;
  onDeleteEnrollment: (id: string) => Promise<void>;
}

export const StudentsManager = ({
  students,
  groups,
  lessons,
  enrollments,
  onSaveStudent,
  onDeleteStudent,
  onSaveEnrollment,
  onDeleteEnrollment
}: StudentsManagerProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [genderFilter, setGenderFilter] = useState<string>('all');
  const [lessonFilter, setLessonFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [expiringFilter, setExpiringFilter] = useState<boolean>(false);

  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [currentStudent, setCurrentStudent] = useState<Partial<Student> | null>(null);

  // حالات التسجيل المباشر داخل نموذج إضافة طالب جديد
  const [directEnroll, setDirectEnroll] = useState(false);
  const [directGroupId, setDirectGroupId] = useState('');
  const [directPrice, setDirectPrice] = useState(150);
  const [directStartDate, setDirectStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [directPaymentStatus, setDirectPaymentStatus] = useState<'paid' | 'partial' | 'unpaid'>('paid');
  const [directPaidAmount, setDirectPaidAmount] = useState<number>(150);

  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [enrollStudentId, setEnrollStudentId] = useState<string | null>(null);
  const [enrollGroupId, setEnrollGroupId] = useState('');
  const [enrollPrice, setEnrollPrice] = useState(150);
  const [enrollStartDate, setEnrollStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [editingEnrollmentId, setEditingEnrollmentId] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'partial' | 'unpaid'>('paid');
  const [paidAmount, setPaidAmount] = useState<number>(150);

  // حساب تاريخ النهاية تلقائياً بعد شهر
  const calculateEndDate = (startDateStr: string): string => {
    if (!startDateStr) return '';
    const date = new Date(startDateStr);
    date.setMonth(date.getMonth() + 1);
    return date.toISOString().split('T')[0];
  };

  const enrollEndDate = calculateEndDate(enrollStartDate);

  // فحص حالة الاشتراك للمجموعات المحددة
  const getEnrollmentStatus = (endDateStr: string): 'active' | 'expired' => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const end = new Date(endDateStr);
    return end >= today ? 'active' : 'expired';
  };

  // حساب الأيام المتبقية لانتهاء الاشتراك
  const getDaysRemaining = (endDateStr: string): number => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const end = new Date(endDateStr);
    const diffTime = end.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // تصفية الطلاب وترتيبهم (الأحدث أولاً لسهولة الوصول)
  const filteredStudents = students
    .filter(student => {
      const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            student.parent_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            student.parent_phone.includes(searchTerm);
      const matchesGender = genderFilter === 'all' || student.gender === genderFilter;

      // تصفية حسب التسجيل في درس معين
      const studentEnrollments = enrollments.filter(e => e.student_id === student.id);
      const matchesLesson = lessonFilter === 'all' || studentEnrollments.some(e => e.lesson_id === lessonFilter);

      // تصفية حسب حالة الاشتراك
      let matchesStatus = true;
      if (statusFilter !== 'all') {
        const hasActive = studentEnrollments.some(e => getEnrollmentStatus(e.end_date) === 'active');
        const hasExpired = studentEnrollments.some(e => getEnrollmentStatus(e.end_date) === 'expired');
        const hasNoEnrollments = studentEnrollments.length === 0;

        if (statusFilter === 'active') {
          matchesStatus = hasActive;
        } else if (statusFilter === 'expired') {
          matchesStatus = hasExpired && !hasActive;
        } else if (statusFilter === 'none') {
          matchesStatus = hasNoEnrollments;
        }
      }

      // تصفية حسب حالة الدفع
      let matchesPayment = true;
      if (paymentFilter !== 'all') {
        matchesPayment = studentEnrollments.some(e => {
          const status = e.payment_status || 'paid';
          return status === paymentFilter;
        });
      }

      // تصفية حسب اقتراب انتهاء الاشتراك (5 أيام أو أقل)
      let matchesExpiring = true;
      if (expiringFilter) {
        matchesExpiring = studentEnrollments.some(e => {
          const status = getEnrollmentStatus(e.end_date);
          if (status !== 'active') return false;
          const days = getDaysRemaining(e.end_date);
          return days >= 0 && days <= 5;
        });
      }

      return matchesSearch && matchesGender && matchesLesson && matchesStatus && matchesPayment && matchesExpiring;
    })
    .sort((a, b) => {
      // 1. الترتيب حسب تاريخ الإنشاء إن وجد
      if (a.created_at && b.created_at) {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      
      // 2. الترتيب حسب معرّف التخزين المحلي (student-timestamp)
      const aTime = a.id.startsWith('student-') ? parseInt(a.id.replace('student-', '')) || 0 : 0;
      const bTime = b.id.startsWith('student-') ? parseInt(b.id.replace('student-', '')) || 0 : 0;
      
      if (aTime && bTime) {
        return bTime - aTime;
      }
      
      // 3. ترتيب تنازلي للمعرف
      return b.id.localeCompare(a.id);
    });

  const handleOpenAddStudentModal = () => {
    setCurrentStudent({ name: '', age: 10, birth_date: '', gender: 'female', parent_name: '', parent_phone: '' });
    setDirectEnroll(false);
    setDirectGroupId(groups[0]?.id || '');
    setDirectPrice(150);
    setDirectStartDate(new Date().toISOString().split('T')[0]);
    setDirectPaymentStatus('paid');
    setDirectPaidAmount(150);
    setIsStudentModalOpen(true);
  };

  const handleOpenEditStudentModal = (student: Student) => {
    setCurrentStudent(student);
    setIsStudentModalOpen(true);
  };

  const handleCloseStudentModal = () => {
    setIsStudentModalOpen(false);
    setCurrentStudent(null);
  };

  const handleOpenEnrollModal = (studentId: string) => {
    setEditingEnrollmentId(null);
    setEnrollStudentId(studentId);
    setEnrollGroupId('');
    setEnrollPrice(150);
    setEnrollStartDate(new Date().toISOString().split('T')[0]);
    setPaymentStatus('paid');
    setPaidAmount(150);
    setIsEnrollModalOpen(true);
  };

  const handleOpenEditEnrollment = (enrollment: Enrollment) => {
    setEditingEnrollmentId(enrollment.id);
    setEnrollStudentId(enrollment.student_id);
    setEnrollGroupId(enrollment.group_id);
    setEnrollPrice(enrollment.price);
    setEnrollStartDate(enrollment.start_date);
    setPaymentStatus(enrollment.payment_status || 'paid');
    setPaidAmount(enrollment.paid_amount !== undefined ? enrollment.paid_amount : enrollment.price);
    setIsEnrollModalOpen(true);
  };

  const handleCloseEnrollModal = () => {
    setIsEnrollModalOpen(false);
    setEnrollStudentId(null);
    setEnrollGroupId('');
    setEditingEnrollmentId(null);
  };

  const handleSubmitStudent = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentStudent?.name?.trim() || !currentStudent?.gender || !currentStudent?.parent_name?.trim()) return;

    if (directEnroll && !currentStudent.id) {
      if (!directGroupId) {
        alert('يرجى اختيار الحلقة المراد تسجيل الطالب بها.');
        return;
      }
    }

    const savedStudent = await onSaveStudent(currentStudent as Student);

    if (directEnroll && !currentStudent.id && savedStudent) {
      const group = groups.find(g => g.id === directGroupId);
      if (group) {
        const directEndDate = calculateEndDate(directStartDate);
        await onSaveEnrollment({
          student_id: savedStudent.id,
          group_id: directGroupId,
          lesson_id: group.lesson_id,
          price: Number(directPrice),
          start_date: directStartDate,
          end_date: directEndDate,
          payment_status: directPaymentStatus,
          paid_amount: directPaymentStatus === 'paid' ? Number(directPrice) : (directPaymentStatus === 'unpaid' ? 0 : Number(directPaidAmount))
        });
      }
    }

    handleCloseStudentModal();
  };

  const handleSubmitEnrollment = async (e: FormEvent) => {
    e.preventDefault();
    if (!enrollStudentId || !enrollGroupId || !enrollPrice || !enrollStartDate) return;

    // التحقق من تكرار تسجيل الطالب في نفس المجموعة (فقط في حالة التسجيل الجديد أو تغيير المجموعة)
    const existingEnrollment = editingEnrollmentId ? enrollments.find(e => e.id === editingEnrollmentId) : null;
    if (!editingEnrollmentId || (existingEnrollment && existingEnrollment.group_id !== enrollGroupId)) {
      const isAlreadyEnrolled = enrollments.some(
        e => e.student_id === enrollStudentId && e.group_id === enrollGroupId && e.id !== editingEnrollmentId
      );
      if (isAlreadyEnrolled) {
        alert('خطأ: هذا الطالب مسجل بالفعل في هذه الحلقة ولا يمكن تكرار التسجيل.');
        return;
      }
    }

    const group = groups.find(g => g.id === enrollGroupId);
    if (!group) return;

    // التحقق الاختياري: هل جنس الطالب متطابق مع فئة الحلقة؟ (فقط في حالة التسجيل الجديد أو تغيير المجموعة)
    if (!existingEnrollment || existingEnrollment.group_id !== enrollGroupId) {
      const student = students.find(s => s.id === enrollStudentId);
      if (student && group.gender_target !== 'all' && group.gender_target !== student.gender) {
        if (!window.confirm(`تنبيه: جنس الطالب (${student.gender === 'male' ? 'ذكر' : 'أنثى'}) لا يطابق الفئة المخصصة للحلقة (${group.gender_target === 'male' ? 'ذكور' : 'إناث'}). هل تريد المتابعة على أي حال؟`)) {
          return;
        }
      }
    }

    const enrollmentToSave = {
      ...(editingEnrollmentId ? { id: editingEnrollmentId } : {}),
      student_id: enrollStudentId,
      group_id: enrollGroupId,
      lesson_id: group.lesson_id,
      price: Number(enrollPrice),
      start_date: enrollStartDate,
      end_date: enrollEndDate,
      payment_status: paymentStatus,
      paid_amount: paymentStatus === 'paid' ? Number(enrollPrice) : (paymentStatus === 'unpaid' ? 0 : Number(paidAmount))
    };

    await onSaveEnrollment(enrollmentToSave);
    handleCloseEnrollModal();
  };

  const handleDeleteStudent = async (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الطالب نهائياً؟ سيتم إلغاء جميع اشتراكاته وتسجيلاته.')) {
      await onDeleteStudent(id);
    }
  };

  const handleDeleteEnrollment = async (id: string) => {
    if (window.confirm('هل أنت متأكد من إلغاء هذا الاشتراك المحدد؟')) {
      await onDeleteEnrollment(id);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <h2>إدارة الطلاب والتسجيلات</h2>
          <p>تسجيل الطلاب الجدد، وتنسيق اشتراكاتهم بالدروس والتحقق من صلاحيتها</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenAddStudentModal}>
          <Plus size={18} />
          تسجيل طالب جديد
        </button>
      </div>

      {/* شريط الفلاتر */}
      <div className="filters-container">
        <div className="filter-group" style={{ flexGrow: 2 }}>
          <label className="filter-label">البحث عن طالب</label>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              className="filter-input"
              placeholder="ابحث باسم الطالب، ولي الأمر، أو الهاتف..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', paddingRight: '40px' }}
            />
            <Search size={18} style={{ position: 'absolute', right: '14px', top: '12px', color: 'var(--text-light)' }} />
          </div>
        </div>

        <div className="filter-group">
          <label className="filter-label">الجنس</label>
          <select className="filter-input" value={genderFilter} onChange={(e) => setGenderFilter(e.target.value)}>
            <option value="all">الكل</option>
            <option value="male">ذكور</option>
            <option value="female">إناث</option>
          </select>
        </div>

        <div className="filter-group">
          <label className="filter-label">المشتركين بدرس</label>
          <select className="filter-input" value={lessonFilter} onChange={(e) => setLessonFilter(e.target.value)}>
            <option value="all">كل الدروس</option>
            {lessons.map(l => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label className="filter-label">حالة الاشتراك الحالي</label>
          <select className="filter-input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">كل الحالات</option>
            <option value="active">نشط حالياً</option>
            <option value="expired">منتهي الصلاحية</option>
            <option value="none">غير مسجل بأي درس</option>
          </select>
        </div>

        <div className="filter-group">
          <label className="filter-label">حالة الدفع</label>
          <select className="filter-input" value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)}>
            <option value="all">كل الحالات</option>
            <option value="paid">مدفوع بالكامل</option>
            <option value="partial">دفع جزئي</option>
            <option value="unpaid">متأخر / غير مدفوع</option>
          </select>
        </div>

        <div className="filter-group">
          <label className="filter-label">صلاحية الاشتراك</label>
          <select className="filter-input" value={expiringFilter ? 'expiring' : 'all'} onChange={(e) => setExpiringFilter(e.target.value === 'expiring')}>
            <option value="all">كل الاشتراكات</option>
            <option value="expiring">ينتهي خلال 5 أيام أو أقل</option>
          </select>
        </div>
      </div>

      {/* جدول الطلاب الفعلي */}
      {filteredStudents.length > 0 ? (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>اسم الطالب</th>
                <th>العمر (تاريخ الميلاد)</th>
                <th>الجنس</th>
                <th>ولي الأمر والهاتف</th>
                <th>الدروس والاشتراكات المسجلة</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map(student => {
                const studentEnrollments = enrollments.filter(e => e.student_id === student.id);
                
                return (
                  <tr key={student.id}>
                    {/* الاسم */}
                    <td style={{ fontWeight: 'bold', color: 'var(--text-dark)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ 
                          width: '32px', 
                          height: '32px', 
                          borderRadius: '50%', 
                          backgroundColor: student.gender === 'male' ? 'var(--primary-blue-light)' : 'var(--primary-green-light)',
                          color: student.gender === 'male' ? 'var(--primary-blue-dark)' : 'var(--primary-green-dark)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <User size={16} />
                        </div>
                        {student.name}
                      </div>
                    </td>

                    {/* العمر وتاريخ الميلاد */}
                    <td>
                      {student.age} سنة 
                      <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {student.birth_date || 'تاريخ غير محدد'}
                      </span>
                    </td>

                    {/* الجنس */}
                    <td>
                      <span className={`badge ${student.gender === 'male' ? 'badge-blue' : 'badge-green'}`}>
                        {student.gender === 'male' ? 'ذكر' : 'أنثى'}
                      </span>
                    </td>

                    {/* ولي الأمر */}
                    <td>
                      {student.parent_name}
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                        <Phone size={12} />
                        {student.parent_phone}
                      </span>
                    </td>

                    {/* الاشتراكات الفعالة */}
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {studentEnrollments.map(e => {
                          const group = groups.find(g => g.id === e.group_id);
                          const lesson = lessons.find(l => l.id === e.lesson_id);
                          const status = getEnrollmentStatus(e.end_date);

                          return (
                            <div key={e.id} className="enrollment-list-item">
                              <div className="enrollment-list-item-info">
                                <span className="enrollment-list-item-title">{lesson?.name} - {group?.name}</span>
                                <span className="enrollment-list-item-dates">
                                  من {e.start_date} إلى {e.end_date} | {e.price} د.م.
                                </span>
                                {(() => {
                                  if (status === 'active') {
                                    const days = getDaysRemaining(e.end_date);
                                    if (days >= 0 && days <= 5) {
                                      return (
                                        <span style={{ 
                                          display: 'flex', 
                                          alignItems: 'center', 
                                          gap: '4px', 
                                          fontSize: '0.75rem', 
                                          color: 'var(--color-danger)', 
                                          fontWeight: 'bold',
                                          marginTop: '2px' 
                                        }}>
                                          <AlertTriangle size={12} />
                                          ينتهي خلال {days === 0 ? 'اليوم' : (days === 1 ? 'غداً' : `${days} أيام`)}!
                                        </span>
                                      );
                                    }
                                  }
                                  return null;
                                })()}
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                <span className={`badge ${status === 'active' ? 'badge-success' : 'badge-danger'}`} style={{ padding: '2px 8px', fontSize: '0.7rem' }}>
                                  {status === 'active' ? 'نشط' : 'منتهي'}
                                </span>
                                {(() => {
                                  const pStatus = e.payment_status || 'paid';
                                  const pAmount = e.paid_amount !== undefined ? e.paid_amount : e.price;
                                  if (pStatus === 'paid') {
                                    return (
                                      <span className="badge badge-success" style={{ padding: '2px 8px', fontSize: '0.7rem' }}>
                                        مدفوع
                                      </span>
                                    );
                                  } else if (pStatus === 'partial') {
                                    return (
                                      <span className="badge badge-warning" style={{ padding: '2px 8px', fontSize: '0.7rem' }} title={`تم دفع ${pAmount} د.م. والمتبقي ${e.price - pAmount} د.م.`}>
                                        جزئي (باقي: {e.price - pAmount} د.م.)
                                      </span>
                                    );
                                  } else {
                                    return (
                                      <span className="badge badge-danger" style={{ padding: '2px 8px', fontSize: '0.7rem' }}>
                                        غير مدفوع
                                      </span>
                                    );
                                  }
                                })()}
                                <button 
                                  className="btn-icon-only" 
                                  style={{ padding: '3px', color: 'var(--primary-blue)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }} 
                                  title="تعديل الاشتراك" 
                                  onClick={() => handleOpenEditEnrollment(e)}
                                >
                                  <Edit2 size={12} />
                                </button>
                                <button 
                                  className="btn-icon-only danger" 
                                  style={{ padding: '3px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }} 
                                  title="إلغاء الاشتراك" 
                                  onClick={() => handleDeleteEnrollment(e.id)}
                                >
                                  <X size={12} />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                        
                        <button 
                          className="btn btn-outline" 
                          style={{ padding: '6px 12px', fontSize: '0.75rem', marginTop: '4px', width: 'fit-content' }}
                          onClick={() => handleOpenEnrollModal(student.id)}
                          disabled={groups.length === 0}
                        >
                          <Plus size={12} />
                          تسجيل في درس جديد
                        </button>
                      </div>
                    </td>

                    {/* العمليات */}
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button 
                          className="btn-icon-only" 
                          title="تعديل الطالب" 
                          onClick={() => handleOpenEditStudentModal(student)}
                        >
                          <Edit2 size={14} />
                        </button>
                        <button 
                          className="btn-icon-only danger" 
                          title="حذف الطالب" 
                          onClick={() => handleDeleteStudent(student.id)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="no-data-card">
          <Users className="no-data-icon" size={48} />
          <h4 className="no-data-text">لم يتم العثور على أي طلاب</h4>
          <p>يرجى إضافة طلاب وتحديد رغبات التسجيل والدروس لهم.</p>
        </div>
      )}

      {/* نافذة إضافة وتعديل الطالب */}
      {isStudentModalOpen && currentStudent && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">
                {currentStudent.id ? 'تعديل بيانات الطالب' : 'تسجيل طالب جديد'}
              </h3>
              <button className="modal-close-btn" onClick={handleCloseStudentModal}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitStudent}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">الاسم الكامل للطالب *</label>
                    <input
                      type="text"
                      className="form-input"
                      required
                      placeholder="اسم الطالب الثلاثي"
                      value={currentStudent.name || ''}
                      onChange={(e) => setCurrentStudent({ ...currentStudent, name: e.target.value })}
                    />
                  </div>

                  <div className="form-grid two-cols">
                    <div className="form-group">
                      <label className="form-label">الجنس *</label>
                      <select
                        className="form-input"
                        required
                        value={currentStudent.gender || 'female'}
                        onChange={(e) => setCurrentStudent({ ...currentStudent, gender: e.target.value as 'male' | 'female' })}
                      >
                        <option value="male">ذكر</option>
                        <option value="female">أنثى</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">السن (بالسنوات) *</label>
                      <input
                        type="number"
                        className="form-input"
                        required
                        min="2"
                        max="100"
                        value={currentStudent.age !== undefined ? currentStudent.age : ''}
                        onChange={(e) => {
                          const newAge = Number(e.target.value);
                          const currentYear = new Date().getFullYear();
                          const birthYear = currentYear - newAge;
                          const newBirthDate = `${birthYear}-01-01`;
                          setCurrentStudent({
                            ...currentStudent,
                            age: newAge,
                            birth_date: newBirthDate
                          });
                        }}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">تاريخ الميلاد *</label>
                    <input
                      type="date"
                      className="form-input"
                      required
                      value={currentStudent.birth_date || ''}
                      onChange={(e) => {
                        const newBirthDate = e.target.value;
                        if (newBirthDate) {
                          const birthDate = new Date(newBirthDate);
                          const today = new Date();
                          let calculatedAge = today.getFullYear() - birthDate.getFullYear();
                          const monthDiff = today.getMonth() - birthDate.getMonth();
                          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                            calculatedAge--;
                          }
                          setCurrentStudent({
                            ...currentStudent,
                            birth_date: newBirthDate,
                            age: calculatedAge > 0 ? calculatedAge : 0
                          });
                        } else {
                          setCurrentStudent({
                            ...currentStudent,
                            birth_date: newBirthDate
                          });
                        }
                      }}
                    />
                  </div>

                  <div className="form-grid two-cols" style={{ backgroundColor: 'var(--primary-blue-subtle)', padding: '16px', borderRadius: '12px', marginTop: '8px' }}>
                    <div className="form-group">
                      <label className="form-label">اسم ولي الأمر *</label>
                      <input
                        type="text"
                        className="form-input"
                        required
                        placeholder="الأب أو الأم أو الوصي"
                        value={currentStudent.parent_name || ''}
                        onChange={(e) => setCurrentStudent({ ...currentStudent, parent_name: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">رقم هاتف ولي الأمر *</label>
                      <input
                        type="text"
                        className="form-input"
                        required
                        placeholder="رقم الهاتف للتواصل"
                        value={currentStudent.parent_phone || ''}
                        onChange={(e) => setCurrentStudent({ ...currentStudent, parent_phone: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* تسجيل التلميذ في حلقة مباشرة عند الإنشاء لأول مرة */}
                  {!currentStudent.id && (
                    <div style={{ 
                      marginTop: '15px', 
                      padding: '14px', 
                      backgroundColor: 'var(--bg-main)', 
                      borderRadius: '12px', 
                      border: '1px solid var(--border-color)' 
                    }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'bold', color: 'var(--primary-green-dark)' }}>
                        <input
                          type="checkbox"
                          checked={directEnroll}
                          onChange={(e) => setDirectEnroll(e.target.checked)}
                          style={{ accentColor: 'var(--primary-green)', cursor: 'pointer', width: '16px', height: '16px' }}
                        />
                        <span>تسجيل الطالب في حلقة دراسية مباشرة عند الحفظ</span>
                      </label>
                      
                      {directEnroll && (
                        <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '10px', paddingRight: '10px', borderRight: '3px solid var(--primary-green)' }}>
                          <div className="form-group">
                            <label className="form-label">اختر الحلقة (المجموعة) التعليمية *</label>
                            <select
                              className="form-input"
                              required={directEnroll}
                              value={directGroupId}
                              onChange={(e) => setDirectGroupId(e.target.value)}
                            >
                              <option value="" disabled>اختر الحلقة</option>
                              {groups.map(g => {
                                const lesson = lessons.find(l => l.id === g.lesson_id);
                                return (
                                  <option key={g.id} value={g.id}>
                                    {lesson?.name} - {g.name} ({g.gender_target === 'male' ? 'ذكور' : 'إناث'})
                                  </option>
                                );
                              })}
                            </select>
                          </div>
                          
                          <div className="form-grid two-cols" style={{ marginTop: '4px' }}>
                            <div className="form-group">
                              <label className="form-label">سعر الاشتراك (بالدرهم) *</label>
                              <input
                                type="number"
                                className="form-input"
                                required={directEnroll}
                                min="0"
                                value={directPrice}
                                onChange={(e) => {
                                  const newPrice = Number(e.target.value);
                                  setDirectPrice(newPrice);
                                  if (directPaymentStatus === 'paid') {
                                    setDirectPaidAmount(newPrice);
                                  }
                                }}
                              />
                            </div>
                            
                            <div className="form-group">
                              <label className="form-label">تاريخ بدء الاشتراك *</label>
                              <input
                                type="date"
                                className="form-input"
                                required={directEnroll}
                                value={directStartDate}
                                onChange={(e) => setDirectStartDate(e.target.value)}
                              />
                            </div>
                          </div>

                          <div className="form-grid two-cols" style={{ marginTop: '10px' }}>
                            <div className="form-group">
                              <label className="form-label">حالة الدفع *</label>
                              <select
                                className="form-input"
                                required={directEnroll}
                                value={directPaymentStatus}
                                onChange={(e) => {
                                  const status = e.target.value as 'paid' | 'partial' | 'unpaid';
                                  setDirectPaymentStatus(status);
                                  if (status === 'paid') {
                                    setDirectPaidAmount(directPrice);
                                  } else if (status === 'unpaid') {
                                    setDirectPaidAmount(0);
                                  }
                                }}
                              >
                                <option value="paid">مدفوع بالكامل</option>
                                <option value="partial">دفع جزئي</option>
                                <option value="unpaid">متأخر / غير مدفوع</option>
                              </select>
                            </div>

                            {directPaymentStatus === 'partial' && (
                              <div className="form-group">
                                <label className="form-label">المبلغ المدفوع (بالدرهم) *</label>
                                <input
                                  type="number"
                                  className="form-input"
                                  required={directEnroll}
                                  min="0"
                                  max={directPrice}
                                  value={directPaidAmount}
                                  onChange={(e) => setDirectPaidAmount(Number(e.target.value))}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={handleCloseStudentModal}>
                  إلغاء
                </button>
                <button type="submit" className="btn btn-primary">
                  حفظ البيانات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* نافذة تسجيل الاشتراك بالدروس */}
      {isEnrollModalOpen && enrollStudentId && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">
                {editingEnrollmentId ? 'تعديل بيانات الاشتراك' : 'تسجيل الطالب في حلقة / درس'}
              </h3>
              <button className="modal-close-btn" onClick={handleCloseEnrollModal}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitEnrollment}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">اختر الحلقة (المجموعة) التعليمية *</label>
                    <select
                      className="form-input"
                      required
                      value={enrollGroupId}
                      onChange={(e) => setEnrollGroupId(e.target.value)}
                    >
                      <option value="" disabled>اختر الحلقة</option>
                      {groups.map(g => {
                        const lesson = lessons.find(l => l.id === g.lesson_id);
                        return (
                          <option key={g.id} value={g.id}>
                            {lesson?.name} - {g.name} ({g.gender_target === 'male' ? 'ذكور' : 'إناث'})
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div className="form-grid two-cols">
                    <div className="form-group">
                      <label className="form-label">سعر الاشتراك (بالدرهم) *</label>
                      <input
                        type="number"
                        className="form-input"
                        required
                        min="0"
                        value={enrollPrice}
                        onChange={(e) => {
                          const newPrice = Number(e.target.value);
                          setEnrollPrice(newPrice);
                          if (paymentStatus === 'paid') {
                            setPaidAmount(newPrice);
                          }
                        }}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">تاريخ بدء الاشتراك *</label>
                      <input
                        type="date"
                        className="form-input"
                        required
                        value={enrollStartDate}
                        onChange={(e) => setEnrollStartDate(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="form-grid two-cols" style={{ marginTop: '10px' }}>
                    <div className="form-group">
                      <label className="form-label">حالة الدفع *</label>
                      <select
                        className="form-input"
                        required
                        value={paymentStatus}
                        onChange={(e) => {
                          const status = e.target.value as 'paid' | 'partial' | 'unpaid';
                          setPaymentStatus(status);
                          if (status === 'paid') {
                            setPaidAmount(enrollPrice);
                          } else if (status === 'unpaid') {
                            setPaidAmount(0);
                          }
                        }}
                      >
                        <option value="paid">مدفوع بالكامل</option>
                        <option value="partial">دفع جزئي</option>
                        <option value="unpaid">متأخر / غير مدفوع</option>
                      </select>
                    </div>

                    {paymentStatus === 'partial' && (
                      <div className="form-group">
                        <label className="form-label">المبلغ المدفوع (بالدرهم) *</label>
                        <input
                          type="number"
                          className="form-input"
                          required
                          min="0"
                          max={enrollPrice}
                          value={paidAmount}
                          onChange={(e) => setPaidAmount(Number(e.target.value))}
                        />
                      </div>
                    )}
                  </div>

                  {/* حساب التواريخ الأوتوماتيكي المعروض */}
                  <div style={{ 
                    backgroundColor: 'var(--primary-green-subtle)', 
                    padding: '16px', 
                    borderRadius: '12px', 
                    border: '1px solid var(--primary-green-light)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    marginTop: '8px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary-green-dark)', fontWeight: 'bold', fontSize: '0.85rem' }}>
                      <Sparkles size={16} />
                      <span>توليد اشتراك تلقائي لمدة شهر</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-main)', marginTop: '4px' }}>
                      <span>تاريخ الانتهاء التلقائي:</span>
                      <span style={{ fontWeight: '800', color: 'var(--primary-blue-dark)' }}>{enrollEndDate}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={handleCloseEnrollModal}>
                  إلغاء
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingEnrollmentId ? 'حفظ التعديلات' : 'تسجيل الاشتراك'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

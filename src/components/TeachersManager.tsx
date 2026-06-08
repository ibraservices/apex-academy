import { useState, type FormEvent } from 'react';
import { Plus, Search, Edit2, Trash2, X, GraduationCap, Phone, Users, DollarSign, Printer, Layers } from 'lucide-react';
import { type Teacher, type Group, type Enrollment, type Student, countTeacherStudents, calculateTeacherSalary } from '../lib/db';

interface TeachersManagerProps {
  teachers: Teacher[];
  groups: Group[];
  enrollments: Enrollment[];
  students: Student[];
  onSave: (teacher: Omit<Teacher, 'id'> & { id?: string }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export const TeachersManager = ({
  teachers,
  groups,
  enrollments,
  students,
  onSave,
  onDelete
}: TeachersManagerProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [genderFilter, setGenderFilter] = useState<string>('all');
  const [salaryTypeFilter, setSalaryTypeFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentTeacher, setCurrentTeacher] = useState<Partial<Teacher> | null>(null);
  const [printTeacherId, setPrintTeacherId] = useState<string | null>(null);
  const [showPrintDetails, setShowPrintDetails] = useState<boolean>(true);

  // تصفية المدرسين
  const filteredTeachers = teachers.filter(teacher => {
    const matchesSearch = teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (teacher.phone && teacher.phone.includes(searchTerm));
    const matchesGender = genderFilter === 'all' || teacher.gender === genderFilter;
    const matchesSalaryType = salaryTypeFilter === 'all' || teacher.salary_type === salaryTypeFilter;

    return matchesSearch && matchesGender && matchesSalaryType;
  });

  const handleOpenAddModal = () => {
    setCurrentTeacher({ name: '', gender: 'female', salary_type: 'ratio', salary_value: 50, phone: '' });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (teacher: Teacher) => {
    setCurrentTeacher(teacher);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentTeacher(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentTeacher?.name?.trim() || !currentTeacher?.gender || !currentTeacher?.salary_type) return;

    await onSave(currentTeacher as Teacher);
    handleCloseModal();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا المدرس؟ سيؤدي ذلك لحذف مجموعاته والاشتراكات التابعة لها.')) {
      await onDelete(id);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <h2>إدارة المدرسين والمدرسات</h2>
          <p>إدارة الطاقم التعليمي، الحصص، واحتساب الأجور الشهرية</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenAddModal}>
          <Plus size={18} />
          إضافة مدرس جديد
        </button>
      </div>

      {/* شريط الفلاتر والبحث */}
      <div className="filters-container">
        <div className="filter-group" style={{ flexGrow: 2 }}>
          <label className="filter-label">البحث عن مدرس</label>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              className="filter-input"
              placeholder="ابحث بالاسم أو الهاتف..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', paddingRight: '40px' }}
            />
            <Search size={18} style={{ position: 'absolute', right: '14px', top: '12px', color: 'var(--text-light)' }} />
          </div>
        </div>

        <div className="filter-group">
          <label className="filter-label">الجنس</label>
          <select 
            className="filter-input" 
            value={genderFilter}
            onChange={(e) => setGenderFilter(e.target.value)}
          >
            <option value="all">الكل</option>
            <option value="male">ذكور (المدرسين)</option>
            <option value="female">إناث (المدرسات)</option>
          </select>
        </div>

        <div className="filter-group">
          <label className="filter-label">طريقة احتساب الأجر</label>
          <select 
            className="filter-input" 
            value={salaryTypeFilter}
            onChange={(e) => setSalaryTypeFilter(e.target.value)}
          >
            <option value="all">الكل</option>
            <option value="fixed">راتب قار</option>
            <option value="ratio">نسبة من الاشتراكات</option>
          </select>
        </div>
      </div>

      {/* عرض المدرسين */}
      {filteredTeachers.length > 0 ? (
        <div className="cards-grid">
          {filteredTeachers.map(teacher => {
            const teacherGroups = groups.filter(g => g.teacher_id === teacher.id);
            const studentCount = countTeacherStudents(teacher, enrollments, groups);
            const calculatedSalary = calculateTeacherSalary(teacher, enrollments, groups);

            return (
              <div key={teacher.id} className="card">
                <div className="card-header">
                  <div>
                    <h3 className="card-title">{teacher.name}</h3>
                    <span 
                      className={`badge ${teacher.gender === 'male' ? 'badge-blue' : 'badge-green'}`} 
                      style={{ marginTop: '6px' }}
                    >
                      {teacher.gender === 'male' ? 'أستاذ (ذكر)' : 'أستاذة (أنثى)'}
                    </span>
                  </div>
                  <GraduationCap size={24} style={{ color: 'var(--primary-green)' }} />
                </div>

                <div className="card-body">
                  <div className="card-info-list">
                    <div className="card-info-item">
                      <Phone size={16} className="card-info-icon" />
                      <span className="card-info-label">الهاتف:</span>
                      <span className="card-info-value">{teacher.phone || 'غير مسجل'}</span>
                    </div>

                    <div className="card-info-item">
                      <Users size={16} className="card-info-icon" />
                      <span className="card-info-label">عدد الطلاب:</span>
                      <span className="card-info-value" style={{ color: 'var(--primary-green)', fontWeight: 'bold' }}>
                        {studentCount} طلاب
                      </span>
                    </div>

                    <div className="card-info-item" style={{ alignItems: 'flex-start' }}>
                      <Layers size={16} className="card-info-icon" style={{ marginTop: '4px' }} />
                      <div>
                        <span className="card-info-label">المجموعات الحالية:</span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '6px' }}>
                          {teacherGroups.map(g => (
                            <span key={g.id} className="badge badge-blue" style={{ fontSize: '0.75rem', padding: '2px 8px' }}>
                              {g.name}
                            </span>
                          ))}
                          {teacherGroups.length === 0 && (
                            <span className="card-info-value" style={{ color: 'var(--text-light)', fontSize: '0.85rem' }}>لا توجد مجموعات</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="card-info-item" style={{ backgroundColor: 'var(--bg-main)', padding: '10px', borderRadius: '8px', marginTop: '10px' }}>
                      <DollarSign size={16} className="card-info-icon" />
                      <div>
                        <span className="card-info-label" style={{ display: 'block', fontSize: '0.8rem' }}>الحساب المالي (الراتب الحالي):</span>
                        <span className="card-info-value" style={{ color: 'var(--primary-blue-dark)', fontSize: '1.05rem', fontWeight: 800 }}>
                          {calculatedSalary} د.م. 
                          <span style={{ fontSize: '0.75rem', fontWeight: 'normal', color: 'var(--text-muted)', marginRight: '6px' }}>
                            ({teacher.salary_type === 'fixed' ? 'راتب قار ثنائي' : `نسبة ${teacher.salary_value}%`})
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card-footer">
                  <div style={{ display: 'flex', gap: '8px', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                    <button 
                      className="btn btn-outline"
                      style={{ fontSize: '0.8rem', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                      onClick={() => setPrintTeacherId(teacher.id)}
                    >
                      <Printer size={14} />
                      كشف الأجر
                    </button>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        className="btn-icon-only" 
                        title="تعديل" 
                        onClick={() => handleOpenEditModal(teacher)}
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        className="btn-icon-only danger" 
                        title="حذف" 
                        onClick={() => handleDelete(teacher.id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="no-data-card">
          <GraduationCap className="no-data-icon" size={48} />
          <h4 className="no-data-text">لم يتم العثور على أي مدرسين</h4>
          <p>جرب تعديل خيارات البحث أو أضف مدرساً جديداً للجمعية.</p>
        </div>
      )}

      {/* نافذة الإضافة والتعديل */}
      {isModalOpen && currentTeacher && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">
                {currentTeacher.id ? 'تعديل بيانات المدرس' : 'إضافة مدرس جديد'}
              </h3>
              <button className="modal-close-btn" onClick={handleCloseModal}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">الاسم الكامل *</label>
                    <input
                      type="text"
                      className="form-input"
                      required
                      placeholder="اسم المدرس الثلاثي"
                      value={currentTeacher.name || ''}
                      onChange={(e) => setCurrentTeacher({ ...currentTeacher, name: e.target.value })}
                    />
                  </div>

                  <div className="form-grid two-cols">
                    <div className="form-group">
                      <label className="form-label">الجنس *</label>
                      <select
                        className="form-input"
                        required
                        value={currentTeacher.gender || 'male'}
                        onChange={(e) => setCurrentTeacher({ ...currentTeacher, gender: e.target.value as 'male' | 'female' })}
                      >
                        <option value="male">ذكر (مدرس)</option>
                        <option value="female">أنثى (مدرسة)</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">رقم الهاتف</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="مثال: 0612345678"
                        value={currentTeacher.phone || ''}
                        onChange={(e) => setCurrentTeacher({ ...currentTeacher, phone: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="form-grid two-cols" style={{ backgroundColor: 'var(--primary-green-subtle)', padding: '16px', borderRadius: '12px', marginTop: '8px' }}>
                    <div className="form-group">
                      <label className="form-label">طريقة احتساب الأجر *</label>
                      <select
                        className="form-input"
                        required
                        value={currentTeacher.salary_type || 'fixed'}
                        onChange={(e) => setCurrentTeacher({ ...currentTeacher, salary_type: e.target.value as 'fixed' | 'ratio' })}
                      >
                        <option value="fixed">راتب شهري قار</option>
                        <option value="ratio">نسبة مئوية من الاشتراكات</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">
                        {currentTeacher.salary_type === 'fixed' ? 'قيمة الراتب (بالدرهم) *' : 'النسبة المئوية (%) *'}
                      </label>
                      <input
                        type="number"
                        className="form-input"
                        required
                        min="0"
                        max={currentTeacher.salary_type === 'ratio' ? '100' : undefined}
                        placeholder={currentTeacher.salary_type === 'fixed' ? 'مثال: 2000' : 'مثال: 50'}
                        value={currentTeacher.salary_value !== undefined ? currentTeacher.salary_value : ''}
                        onChange={(e) => setCurrentTeacher({ ...currentTeacher, salary_value: Number(e.target.value) })}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={handleCloseModal}>
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
      {/* نافذة معاينة وكشف الأجر للطباعة */}
      {printTeacherId && (
        (() => {
          const teacher = teachers.find(t => t.id === printTeacherId);
          if (!teacher) return null;

          const teacherGroups = groups.filter(g => g.teacher_id === teacher.id);
          const teacherGroupIds = teacherGroups.map(g => g.id);
          const teacherEnrollments = enrollments.filter(e => teacherGroupIds.includes(e.group_id));
          const calculatedSalary = calculateTeacherSalary(teacher, enrollments, groups);
          const totalStudents = countTeacherStudents(teacher, enrollments, groups);

          return (
            <div className="modal-overlay printable-invoice-wrapper">
              <div className="modal-content" style={{ maxWidth: '750px', width: '90%' }}>
                <div className="modal-header">
                  <h3 className="modal-title">كشف حساب أجر المدرس</h3>
                  <button className="modal-close-btn" onClick={() => setPrintTeacherId(null)}>
                    <X size={20} />
                  </button>
                </div>
                
                <div className="modal-body">
                  {/* خيار التحكم بالطباعة - يخفى أثناء الطباعة بـ no-print */}
                  <div className="no-print" style={{ 
                    marginBottom: '20px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px', 
                    backgroundColor: 'var(--bg-main)', 
                    padding: '12px 16px', 
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)'
                  }}>
                    <input
                      type="checkbox"
                      id="toggle-print-details"
                      checked={showPrintDetails}
                      onChange={(e) => setShowPrintDetails(e.target.checked)}
                      style={{ accentColor: 'var(--primary-green)', cursor: 'pointer', width: '16px', height: '16px' }}
                    />
                    <label htmlFor="toggle-print-details" style={{ fontSize: '0.85rem', fontWeight: 'bold', cursor: 'pointer', color: 'var(--text-dark)' }}>
                      إظهار تفاصيل وأسماء الطلاب في كشف الحساب المطبوع
                    </label>
                  </div>

                  <div className="printable-invoice">
                    <div className="invoice-header">
                      <div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-green-dark)' }}>جمعية الهداية التعليمية</h2>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>لتحفيظ القرآن الكريم وتدريس العلوم الشرعية</p>
                      </div>
                      <div style={{ textAlign: 'left' }}>
                        <span className="badge badge-green" style={{ fontSize: '0.9rem', padding: '6px 12px' }}>كشف حساب الأجر</span>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px' }}>التاريخ: {new Date().toLocaleDateString('ar-EG')}</p>
                      </div>
                    </div>

                    <div className="invoice-details">
                      <div className="invoice-detail-item">
                        <strong>اسم المدرس(ة):</strong> {teacher.name}
                      </div>
                      <div className="invoice-detail-item">
                        <strong>رقم الهاتف:</strong> {teacher.phone || 'غير مسجل'}
                      </div>
                      <div className="invoice-detail-item">
                        <strong>نوع الحساب المالي:</strong> {teacher.salary_type === 'fixed' ? 'راتب قار' : `نسبة مئوية من الاشتراكات (${teacher.salary_value}%)`}
                      </div>
                      <div className="invoice-detail-item">
                        <strong>عدد الطلاب الفعلي:</strong> {totalStudents} طالب/ـة
                      </div>
                    </div>

                    {showPrintDetails && (
                      <>
                        <h4 style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: '10px', color: 'var(--text-dark)', borderRight: '3px solid var(--primary-green)', paddingRight: '8px' }}>
                          تفاصيل الطلاب والاشتراكات المؤداة
                        </h4>
                        
                        <table className="invoice-table">
                          <thead>
                            <tr>
                              <th>#</th>
                              <th>اسم التلميذ(ة)</th>
                              <th>الحلقة / المجموعة</th>
                              <th>تاريخ بدء الاشتراك</th>
                              <th>ثمن الاشتراك المؤدى</th>
                            </tr>
                          </thead>
                          <tbody>
                            {teacherEnrollments.map((e, index) => {
                              const group = groups.find(g => g.id === e.group_id);
                              const student = students.find(s => s.id === e.student_id);
                              return (
                                <tr key={e.id}>
                                  <td>{index + 1}</td>
                                  <td style={{ fontWeight: 'bold' }}>{student?.name || 'طالب محذوف'}</td>
                                  <td>{group?.name || 'مجموعة محذوفة'}</td>
                                  <td>{e.start_date}</td>
                                  <td>{e.price} د.م.</td>
                                </tr>
                              );
                            })}
                            {teacherEnrollments.length === 0 && (
                              <tr>
                                <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>
                                  لا يوجد طلاب مسجلون باشتراكات نشطة حالياً مع هذا المدرس.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </>
                    )}

                    {/* تفصيل الحساب المالي الإجمالي */}
                    <div className="invoice-total" style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-start' }}>
                      {teacher.salary_type === 'ratio' && (
                        <>
                          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', fontSize: '0.9rem', fontWeight: 'normal', color: 'var(--text-main)', borderBottom: '1px dashed #e2e8f0', paddingBottom: '6px' }}>
                            <span>إجمالي مبالغ اشتراكات طلاب المعلم:</span>
                            <strong style={{ color: 'var(--primary-blue-dark)' }}>{teacherEnrollments.reduce((sum, e) => sum + Number(e.price), 0)} د.م.</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', fontSize: '0.9rem', fontWeight: 'normal', color: 'var(--text-main)', borderBottom: '1px dashed #e2e8f0', paddingBottom: '6px' }}>
                            <span>نسبة المدرس المسجلة:</span>
                            <strong>{teacher.salary_value}%</strong>
                          </div>
                        </>
                      )}
                      {teacher.salary_type === 'fixed' && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', fontSize: '0.9rem', fontWeight: 'normal', color: 'var(--text-main)', borderBottom: '1px dashed #e2e8f0', paddingBottom: '6px' }}>
                          <span>قيمة الراتب القار الشهري:</span>
                          <strong>{teacher.salary_value} د.م.</strong>
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', fontSize: '1.2rem', fontWeight: '800', color: 'var(--primary-green-dark)', paddingTop: '6px' }}>
                        <span>الأجر الإجمالي الصافي المستحق:</span>
                        <span>{calculatedSalary} د.م.</span>
                      </div>
                    </div>

                    <div className="invoice-signatures">
                      <div className="invoice-signature-box">
                        توقيع إدارة الجمعية
                      </div>
                      <div className="invoice-signature-box">
                        توقيع المدرس(ة)
                      </div>
                    </div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-outline" onClick={() => setPrintTeacherId(null)}>
                    إغلاق
                  </button>
                  <button type="button" className="btn btn-primary" onClick={() => window.print()}>
                    <Printer size={16} style={{ marginLeft: '4px' }} />
                    طباعة كشف الأجر
                  </button>
                </div>
              </div>
            </div>
          );
        })()
      )}
    </div>
  );
};

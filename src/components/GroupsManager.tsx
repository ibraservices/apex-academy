import { useState, type FormEvent } from 'react';
import { Plus, Search, Edit2, Trash2, X, Layers, Calendar, BookOpen, UserCheck, AlertTriangle, Printer } from 'lucide-react';
import { type Group, type Teacher, type Lesson, type Enrollment, type Student, type AcademicLevel } from '../lib/db';

interface GroupsManagerProps {
  groups: Group[];
  teachers: Teacher[];
  lessons: Lesson[];
  enrollments: Enrollment[];
  students: Student[];
  academicLevels: AcademicLevel[];
  onSave: (group: Omit<Group, 'id'> & { id?: string }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export const GroupsManager = ({
  groups,
  teachers,
  lessons,
  enrollments,
  students,
  academicLevels,
  onSave,
  onDelete
}: GroupsManagerProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [lessonFilter, setLessonFilter] = useState<string>('all');
  const [teacherFilter, setTeacherFilter] = useState<string>('all');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentGroup, setCurrentGroup] = useState<Partial<Group> | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [printGroupId, setPrintGroupId] = useState<string | null>(null);
  const [emptyRowsCount, setEmptyRowsCount] = useState<number>(10);
  const [sessionPrintCount, setSessionPrintCount] = useState<number>(8);
  const [isPrintScheduleModalOpen, setIsPrintScheduleModalOpen] = useState(false);
  const [schedulePrintTeacherId, setSchedulePrintTeacherId] = useState<string>('all');
  const [schedulePrintLevelId, setSchedulePrintLevelId] = useState<string>('all');

  // حالة لتسجيل الجدول المهيكل (يوم مع توقيته الخاص)
  interface DaySchedule {
    day: string;
    startTime: string;
    endTime: string;
  }
  const [daySchedules, setDaySchedules] = useState<DaySchedule[]>([]);

  const allDays = ['الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت', 'الأحد'];

  // تصفية الأفواج
  const filteredGroups = groups.filter(group => {
    const matchesSearch = group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (group.schedule && group.schedule.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesLesson = lessonFilter === 'all' || group.lesson_id === lessonFilter;
    const matchesTeacher = teacherFilter === 'all' || group.teacher_id === teacherFilter;
    const matchesLevel = levelFilter === 'all' || group.level_id === levelFilter;

    return matchesSearch && matchesLesson && matchesTeacher && matchesLevel;
  });

  const handleOpenAddModal = () => {
    if (teachers.length === 0 || lessons.length === 0) {
      alert('يرجى إضافة أستاذ واحد ومادة دراسية واحدة على الأقل قبل إنشاء فوج جديد.');
      return;
    }
    setValidationError(null);
    setDaySchedules([]);
    setCurrentGroup({
      name: '',
      teacher_id: teachers[0]?.id || '',
      lesson_id: lessons[0]?.id || '',
      schedule: '',
      gender_target: 'all',
      level_id: academicLevels[0]?.id || '',
      specialization: academicLevels[0]?.specializations[0] || 'عام'
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (group: Group) => {
    setValidationError(null);
    setCurrentGroup({
      ...group,
      level_id: group.level_id || academicLevels[0]?.id || '',
      specialization: group.specialization || 'عام'
    });

    // محاولة تفكيك حقل الجدول النصي
    const scheduleStr = group.schedule || '';
    let parsed: DaySchedule[] = [];

    if (scheduleStr.includes('|')) {
      // التنسيق السابق: "السبت، الاثنين | 08:00 - 10:00"
      const parts = scheduleStr.split('|');
      const daysPart = parts[0].trim();
      const timePart = parts[1].trim();

      const days = daysPart.split('،').map(d => d.trim());
      let start = '19:00';
      let end = '20:30';
      if (timePart.includes('-')) {
        const times = timePart.split('-');
        start = times[0].trim();
        end = times[1].trim();
      }

      days.forEach(day => {
        if (allDays.includes(day)) {
          parsed.push({ day, startTime: start, endTime: end });
        }
      });
    } else if (scheduleStr.includes('(')) {
      // التنسيق الجديد: "السبت (08:00 - 10:00)، الاثنين (16:00 - 18:00)"
      const parts = scheduleStr.split(/[،,]/);
      parts.forEach(part => {
        const trimmed = part.trim();
        if (!trimmed) return;

        const day = allDays.find(d => trimmed.includes(d));
        if (!day) return;

        const timeRegex = /\b\d{2}:\d{2}\b/g;
        const foundTimes = trimmed.match(timeRegex);
        if (foundTimes && foundTimes.length >= 2) {
          parsed.push({
            day,
            startTime: foundTimes[0],
            endTime: foundTimes[1]
          });
        } else {
          parsed.push({
            day,
            startTime: '19:00',
            endTime: '20:30'
          });
        }
      });
    } else {
      // تنسيق نصي عشوائي كإجراء بديل
      const days = allDays.filter(d => scheduleStr.includes(d));
      const timeRegex = /\b\d{2}:\d{2}\b/g;
      const foundTimes = scheduleStr.match(timeRegex);
      const start = foundTimes && foundTimes[0] ? foundTimes[0] : '19:00';
      const end = foundTimes && foundTimes[1] ? foundTimes[1] : '20:30';

      days.forEach(day => {
        parsed.push({ day, startTime: start, endTime: end });
      });
    }

    setDaySchedules(parsed);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentGroup(null);
    setValidationError(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const { name, teacher_id, lesson_id, gender_target, level_id, specialization } = currentGroup || {};

    if (!name?.trim() || !teacher_id || !lesson_id || !gender_target || !level_id || !specialization) {
      setValidationError('يرجى ملء جميع الحقول المطلوبة.');
      return;
    }

    if (daySchedules.length === 0) {
      setValidationError('يرجى تحديد يوم واحد على الأقل وتوقيته للحصص.');
      return;
    }

    // بناء النص للجدول مرتباً بأيام الأسبوع
    const dayOrder = ['الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت', 'الأحد'];
    const sortedSchedules = [...daySchedules].sort((a, b) => dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day));
    const scheduleString = sortedSchedules.map(ds => `${ds.day} (${ds.startTime} - ${ds.endTime})`).join('، ');

    const groupToSave = {
      ...currentGroup,
      schedule: scheduleString
    } as Group;

    // التحقق من توافق جنس الأستاذ مع جنس الفوج المستهدف (فقط إذا لم يكن مختلطاً)
    const teacher = teachers.find(t => t.id === teacher_id);
    if (teacher && gender_target !== 'all') {
      if (gender_target === 'female' && teacher.gender !== 'female') {
        setValidationError('خطأ في المطابقة: الفوج المخصص للإناث يجب أن تقوم بتدريسه معلمة (أنثى).');
        return;
      }
      if (gender_target === 'male' && teacher.gender !== 'male') {
        setValidationError('خطأ في المطابقة: الفوج المخصص للذكور يجب أن يقوم بتدريسه معلم (ذكر).');
        return;
      }
    }

    await onSave(groupToSave);
    handleCloseModal();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذه المجموعة؟ سيؤدي ذلك لإلغاء جميع تسجيلات واشتراكات الطلاب المسجلين بها.')) {
      await onDelete(id);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <h2>إدارة الأفواج الدراسية</h2>
          <p>تنظيم الأفواج وتعيين الأساتذة ومواعيد الحصص الأسبوعية</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-outline" onClick={() => setIsPrintScheduleModalOpen(true)}>
            <Printer size={18} style={{ marginLeft: '6px' }} />
            طباعة جدول الحصص
          </button>
          <button className="btn btn-primary" onClick={handleOpenAddModal}>
            <Plus size={18} />
            إضافة فوج جديد
          </button>
        </div>
      </div>

      {/* شريط الفلاتر والبحث */}
      <div className="filters-container">
        <div className="filter-group" style={{ flexGrow: 2 }}>
          <label className="filter-label">البحث عن فوج</label>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              className="filter-input"
              placeholder="ابحث باسم الفوج أو المواعيد..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', paddingRight: '40px' }}
            />
            <Search size={18} style={{ position: 'absolute', right: '14px', top: '12px', color: 'var(--text-light)' }} />
          </div>
        </div>

        <div className="filter-group">
          <label className="filter-label">حسب المادة</label>
          <select 
            className="filter-input" 
            value={lessonFilter}
            onChange={(e) => setLessonFilter(e.target.value)}
          >
            <option value="all">كل المواد</option>
            {lessons.map(l => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label className="filter-label">حسب الأستاذ</label>
          <select 
            className="filter-input" 
            value={teacherFilter}
            onChange={(e) => setTeacherFilter(e.target.value)}
          >
            <option value="all">كل الأساتذة</option>
            {teachers.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label className="filter-label">حسب المستوى الدراسي</label>
          <select 
            className="filter-input" 
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
          >
            <option value="all">كل المستويات</option>
            {academicLevels.map(lvl => (
              <option key={lvl.id} value={lvl.id}>{lvl.name}</option>
            ))}
          </select>
        </div>


      </div>

      {/* عرض الأفواج */}
      {filteredGroups.length > 0 ? (
        <div className="cards-grid">
          {filteredGroups.map(group => {
            const teacher = teachers.find(t => t.id === group.teacher_id);
            const lesson = lessons.find(l => l.id === group.lesson_id);
            const activeStudents = enrollments.filter(e => e.group_id === group.id).length;
            const lvl = academicLevels.find(l => l.id === group.level_id);

            return (
              <div key={group.id} className="card">
                <div className="card-header">
                  <div>
                    <h3 className="card-title">{group.name}</h3>
                  </div>
                  <Layers size={24} style={{ color: 'var(--primary-blue)' }} />
                </div>

                <div className="card-body">
                  <div className="card-info-list">
                    <div className="card-info-item">
                      <BookOpen size={16} className="card-info-icon" />
                      <span className="card-info-label">المادة:</span>
                      <span className="card-info-value">{lesson?.name || 'مادة محذوفة'}</span>
                    </div>

                    <div className="card-info-item">
                      <Layers size={16} className="card-info-icon" />
                      <span className="card-info-label">المستوى والتخصص:</span>
                      <span className="card-info-value">
                        {lvl ? `${lvl.name} - ${group.specialization || 'عام'}` : 'عام / غير محدد'}
                      </span>
                    </div>

                    <div className="card-info-item">
                      <UserCheck size={16} className="card-info-icon" />
                      <span className="card-info-label">الأستاذ المسؤول:</span>
                      <span className="card-info-value">{teacher?.name || 'أستاذ محذوف'}</span>
                    </div>

                    <div className="card-info-item">
                      <Calendar size={16} className="card-info-icon" />
                      <span className="card-info-label">مواعيد الحصص:</span>
                      <span className="card-info-value">{group.schedule}</span>
                    </div>

                    <div className="card-info-item" style={{ backgroundColor: 'var(--bg-main)', padding: '10px', borderRadius: '8px', marginTop: '10px' }}>
                      <span className="card-info-label">عدد التلاميذ المسجلين بالاشتراك:</span>
                      <span className="card-info-value" style={{ color: 'var(--primary-green)', fontWeight: '800' }}>
                        {activeStudents} تلميذ/ة
                      </span>
                    </div>
                  </div>
                </div>

                <div className="card-footer">
                  <div style={{ display: 'flex', gap: '8px', width: '100%', justifyContent: 'flex-end' }}>
                    <button 
                      className="btn-icon-only" 
                      title="طباعة ورقة الحضور والغياب" 
                      onClick={() => {
                        const daysInWeek = allDays.filter(day => group.schedule.includes(day)).length;
                        setSessionPrintCount((daysInWeek || 2) * 4);
                        setPrintGroupId(group.id);
                      }}
                      style={{ color: 'var(--primary-green)' }}
                    >
                      <Printer size={16} />
                    </button>
                    <button 
                      className="btn-icon-only" 
                      title="تعديل" 
                      onClick={() => handleOpenEditModal(group)}
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      className="btn-icon-only danger" 
                      title="حذف" 
                      onClick={() => handleDelete(group.id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="no-data-card">
          <Layers className="no-data-icon" size={48} />
          <h4 className="no-data-text">لم يتم العثور على أي أفواج دراسية</h4>
          <p>يرجى تعديل فلاتر البحث أو التأكد من إدخال الأساتذة والمواد الدراسية أولاً ثم إضافة فوج.</p>
        </div>
      )}

      {/* نافذة الإضافة والتعديل */}
      {isModalOpen && currentGroup && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">
                {currentGroup.id ? 'تعديل بيانات الفوج' : 'إنشاء فوج جديد'}
              </h3>
              <button className="modal-close-btn" onClick={handleCloseModal}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {validationError && (
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px', 
                    padding: '12px', 
                    backgroundColor: '#fee2e2', 
                    border: '1px solid #fca5a5', 
                    color: '#b91c1c', 
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    marginBottom: '16px' 
                  }}>
                    <AlertTriangle size={18} style={{ flexShrink: 0 }} />
                    <span>{validationError}</span>
                  </div>
                )}

                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">اسم الفوج الدراسي *</label>
                    <input
                      type="text"
                      className="form-input"
                      required
                      placeholder="مثال: فوج الإنجليزية المبتدئ"
                      value={currentGroup.name || ''}
                      onChange={(e) => setCurrentGroup({ ...currentGroup, name: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">المادة الدراسية *</label>
                    <select
                      className="form-input"
                      required
                      value={currentGroup.lesson_id || ''}
                      onChange={(e) => setCurrentGroup({ ...currentGroup, lesson_id: e.target.value })}
                    >
                      <option value="" disabled>اختر المادة</option>
                      {lessons.map(l => (
                        <option key={l.id} value={l.id}>{l.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-grid two-cols">
                    <div className="form-group">
                      <label className="form-label">المستوى الدراسي للفوج *</label>
                      <select
                        className="form-input"
                        required
                        value={currentGroup.level_id || ''}
                        onChange={(e) => {
                          const lvlId = e.target.value;
                          const lvl = academicLevels.find(l => l.id === lvlId);
                          setCurrentGroup({ 
                            ...currentGroup, 
                            level_id: lvlId,
                            specialization: lvl && lvl.specializations ? lvl.specializations[0] : 'عام'
                          });
                        }}
                      >
                        <option value="" disabled>اختر المستوى</option>
                        {(() => {
                          const stageOrder = { high: 1, middle: 2, primary: 3, university: 4, other: 5 } as any;
                          return [...academicLevels].sort((a, b) => {
                            const orderA = stageOrder[a.stage] || 99;
                            const orderB = stageOrder[b.stage] || 99;
                            return orderA - orderB;
                          }).map(lvl => (
                            <option key={lvl.id} value={lvl.id}>{lvl.name}</option>
                          ));
                        })()}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">التخصص الدراسي للفوج *</label>
                      <select
                        className="form-input"
                        required
                        value={currentGroup.specialization || 'عام'}
                        onChange={(e) => setCurrentGroup({ ...currentGroup, specialization: e.target.value })}
                        disabled={!currentGroup.level_id}
                      >
                        {(() => {
                          const selectedLvl = academicLevels.find(l => l.id === currentGroup.level_id);
                          const specs = selectedLvl?.specializations || ['عام'];
                          return specs.map(spec => (
                            <option key={spec} value={spec}>{spec}</option>
                          ));
                        })()}
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">الأستاذ المسؤول *</label>
                    <select
                      className="form-input"
                      required
                      value={currentGroup.teacher_id || ''}
                      onChange={(e) => setCurrentGroup({ ...currentGroup, teacher_id: e.target.value })}
                    >
                      <option value="" disabled>اختر الأستاذ</option>
                      {teachers.map(t => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.gender === 'male' ? 'أستاذ' : 'أستاذة'})
                        </option>
                      ))}
                    </select>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      ملاحظة: الأستاذ يجب أن يطابق الجنس المختار للفوج (في حال لم يكن الفوج مختلطاً).
                    </p>
                  </div>

                  <div className="form-group">
                    <label className="form-label">جدول الحصص الأسبوعية (اختر الأيام وحدد تواقيتها) *</label>
                    <div style={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      gap: '12px', 
                      marginTop: '6px',
                      backgroundColor: 'var(--bg-main)',
                      padding: '16px',
                      borderRadius: '12px',
                      border: '1px solid var(--border-color)'
                    }}>
                      {allDays.map(day => {
                        const scheduleForDay = daySchedules.find(ds => ds.day === day);
                        const isChecked = !!scheduleForDay;
                        const currentStart = scheduleForDay?.startTime || '19:00';
                        const currentEnd = scheduleForDay?.endTime || '20:30';

                        return (
                          <div key={day} style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'space-between', 
                            gap: '16px', 
                            borderBottom: '1px solid #e2e8f0', 
                            paddingBottom: '8px',
                            marginBottom: '4px'
                          }}>
                            <label style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '8px', 
                              cursor: 'pointer', 
                              fontWeight: isChecked ? 'bold' : 'normal', 
                              color: isChecked ? 'var(--primary-green-dark)' : 'var(--text-main)',
                              width: '120px'
                            }}>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setDaySchedules([...daySchedules, { day, startTime: '19:00', endTime: '20:30' }]);
                                  } else {
                                    setDaySchedules(daySchedules.filter(ds => ds.day !== day));
                                  }
                                }}
                                style={{ accentColor: 'var(--primary-green)' }}
                              />
                              <span>{day}</span>
                            </label>

                            <div style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '8px', 
                              opacity: isChecked ? 1 : 0.4, 
                              pointerEvents: isChecked ? 'auto' : 'none' 
                            }}>
                              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>من:</span>
                              <input
                                type="time"
                                className="form-input"
                                style={{ padding: '4px 8px', fontSize: '0.85rem' }}
                                value={currentStart}
                                onChange={(e) => {
                                  setDaySchedules(daySchedules.map(ds => ds.day === day ? { ...ds, startTime: e.target.value } : ds));
                                }}
                              />
                              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>إلى:</span>
                              <input
                                type="time"
                                className="form-input"
                                style={{ padding: '4px 8px', fontSize: '0.85rem' }}
                                value={currentEnd}
                                onChange={(e) => {
                                  setDaySchedules(daySchedules.map(ds => ds.day === day ? { ...ds, endTime: e.target.value } : ds));
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
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

      {/* نافذة معاينة وطباعة ورقة الحضور والغياب */}
      {printGroupId && (
        (() => {
          const group = groups.find(g => g.id === printGroupId);
          if (!group) return null;

          const teacher = teachers.find(t => t.id === group.teacher_id);
          const lesson = lessons.find(l => l.id === group.lesson_id);
          
          const groupEnrollments = enrollments.filter(e => e.group_id === group.id);
          const groupStudents = students
            .filter(s => groupEnrollments.some(e => e.student_id === s.id))
            .sort((a, b) => a.name.localeCompare(b.name, 'ar'));

          const sessionCount = sessionPrintCount;

          return (
            <div className="modal-overlay printable-attendance-wrapper">
              <div className="modal-content" style={{ maxWidth: '950px', width: '95%' }}>
                <div className="modal-header">
                  <div className="modal-title"></div>
                  <button className="modal-close-btn" onClick={() => setPrintGroupId(null)}>
                    <X size={20} />
                  </button>
                </div>
                
                <div className="modal-body">
                  {/* أداة التحكم بعدد الأسطر والحصص المضافة للجدول - تخفى أثناء الطباعة */}
                  <div className="no-print" style={{ 
                    marginBottom: '20px', 
                    display: 'flex', 
                    flexWrap: 'wrap',
                    alignItems: 'center', 
                    gap: '24px', 
                    backgroundColor: 'var(--bg-main)', 
                    padding: '12px 16px', 
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <label htmlFor="empty-rows-input" style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-dark)' }}>
                        عدد الأسطر الفارغة الإضافية:
                      </label>
                      <input
                        id="empty-rows-input"
                        type="number"
                        min="0"
                        max="50"
                        value={emptyRowsCount}
                        onChange={(e) => setEmptyRowsCount(Math.max(0, parseInt(e.target.value) || 0))}
                        className="form-input"
                        style={{ width: '80px', padding: '6px 12px', fontSize: '0.85rem' }}
                      />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <label htmlFor="session-count-input" style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-dark)' }}>
                        عدد حصص ورقة الحضور (الأعمدة):
                      </label>
                      <input
                        id="session-count-input"
                        type="number"
                        min="1"
                        max="31"
                        value={sessionPrintCount}
                        onChange={(e) => setSessionPrintCount(Math.max(1, parseInt(e.target.value) || 1))}
                        className="form-input"
                        style={{ width: '80px', padding: '6px 12px', fontSize: '0.85rem' }}
                      />
                    </div>
                  </div>

                  <div className="printable-attendance">
                    <div className="attendance-print-header" style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid var(--primary-green)', paddingBottom: '16px', marginBottom: '24px' }}>
                      <div>
                        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary-green-dark)' }}>مركز أيبكس للدعم الدراسي</h2>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>للدعم الدراسي وتعليم اللغات</p>
                      </div>
                      <div style={{ textAlign: 'left' }}>
                        <span className="badge badge-green" style={{ fontSize: '0.95rem', padding: '6px 12px' }}>ورقة الحضور والغياب الشهرية</span>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '6px' }}>تاريخ الطباعة: {new Date().toLocaleDateString('ar-EG')}</p>
                      </div>
                    </div>

                    <div className="attendance-print-info" style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '12px', 
                      marginBottom: '15px', 
                      backgroundColor: '#f8fafc', 
                      padding: '10px 15px', 
                      borderRadius: '6px', 
                      border: '1px solid var(--border-color)',
                      fontSize: '0.85rem'
                    }}>
                      <div className="attendance-info-item">
                        <strong>الشهر:</strong> <span style={{ borderBottom: '1px dotted #000', width: '80px', display: 'inline-block', marginRight: '4px' }}></span>
                      </div>
                      <div className="attendance-info-item">
                        <strong>الأستاذ:</strong> {teacher?.name || 'غير محدد'}
                      </div>
                      <div className="attendance-info-item">
                        <strong>مستوى وتخصص:</strong> {(() => {
                          const lvl = academicLevels.find(l => l.id === group.level_id);
                          return lvl ? `${lvl.name} - ${group.specialization || 'عام'}` : 'عام / غير محدد';
                        })()}
                      </div>
                      <div className="attendance-info-item">
                        <strong>الفوج:</strong> {group.name} {lesson ? `(${lesson.name})` : ''}
                      </div>
                    </div>

                    <div className="attendance-table-container" style={{ overflowX: 'auto', marginTop: '20px' }}>
                      <table className="attendance-print-table" style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
                        <thead>
                          <tr>
                            <th style={{ minWidth: '160px', textAlign: 'right', border: '1px solid #cbd5e1', padding: '8px', backgroundColor: '#f8fafc', fontWeight: 'bold' }}>اسم الطالب(ة)</th>
                            <th style={{ minWidth: '100px', textAlign: 'center', border: '1px solid #cbd5e1', padding: '8px', backgroundColor: '#f8fafc', fontWeight: 'bold' }}>بداية الاشتراك</th>
                            {Array.from({ length: sessionCount }).map((_, i) => (
                              <th key={i} style={{ width: '45px', textAlign: 'center', verticalAlign: 'middle', border: '1px solid #cbd5e1', padding: '8px', backgroundColor: '#f8fafc' }}>
                                <div style={{ fontSize: '0.65rem', fontWeight: 'bold', marginBottom: '4px', color: 'var(--text-dark)' }}>حصة {i + 1}</div>
                                <div className="date-input-box" style={{ border: '1px dashed #94a3b8', height: '20px', width: '100%', maxWidth: '40px', margin: '0 auto', borderRadius: '4px', backgroundColor: '#fff' }}></div>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {groupStudents.map((student) => {
                            const enrollment = groupEnrollments.find(e => e.student_id === student.id);
                            return (
                              <tr key={student.id}>
                                <td style={{ fontWeight: 'bold', textAlign: 'right', border: '1px solid #cbd5e1', padding: '8px' }}>{student.name}</td>
                                <td style={{ textAlign: 'center', fontSize: '0.8rem', border: '1px solid #cbd5e1', padding: '8px' }}>{enrollment?.start_date || 'غير محدد'}</td>
                                {Array.from({ length: sessionCount }).map((_, i) => (
                                  <td key={i} style={{ textAlign: 'center', verticalAlign: 'middle', border: '1px solid #cbd5e1', padding: '8px', height: '40px' }}>
                                    <div className="attendance-checkbox-box" style={{ width: '18px', height: '18px', border: '1px solid #94a3b8', borderRadius: '4px', margin: '0 auto', backgroundColor: '#fff' }}></div>
                                  </td>
                                ))}
                              </tr>
                            );
                          })}

                          {/* أسطر فارغة إضافية يحدد المدير عددها */}
                          {Array.from({ length: emptyRowsCount }).map((_, rIndex) => (
                            <tr key={`empty-${rIndex}`}>
                              <td style={{ border: '1px solid #cbd5e1', padding: '8px', height: '40px' }}>&nbsp;</td>
                              <td style={{ border: '1px solid #cbd5e1', padding: '8px' }}>&nbsp;</td>
                              {Array.from({ length: sessionCount }).map((_, i) => (
                                <td key={i} style={{ textAlign: 'center', verticalAlign: 'middle', border: '1px solid #cbd5e1', padding: '8px' }}>
                                  <div className="attendance-checkbox-box" style={{ width: '18px', height: '18px', border: '1px solid #94a3b8', borderRadius: '4px', margin: '0 auto', backgroundColor: '#fff' }}></div>
                                </td>
                              ))}
                            </tr>
                          ))}

                          {groupStudents.length === 0 && emptyRowsCount === 0 && (
                            <tr>
                              <td colSpan={2 + sessionCount} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '30px', border: '1px solid #cbd5e1' }}>
                                لا يوجد طلاب مسجلون في هذه المجموعة حالياً ولم يتم اختيار أسطر فارغة.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    <div className="attendance-print-notes" style={{ marginTop: '30px', fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>* يرجى كتابة تاريخ الحصة باليوم والشهر في المربع العلوي لكل حصة (مثال: 15/06).</div>
                      <div>توقيع الأستاذ(ة): ............................</div>
                    </div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-outline" onClick={() => setPrintGroupId(null)}>
                    إغلاق
                  </button>
                  <button type="button" className="btn btn-primary" onClick={() => window.print()}>
                    <Printer size={16} style={{ marginLeft: '4px' }} />
                    طباعة ورقة الحضور
                  </button>
                </div>
              </div>
            </div>
          );
        })()
      )}

      {/* نافذة معاينة وطباعة جدول الحصص الأسبوعي */}
      {isPrintScheduleModalOpen && (
        <div className="modal-overlay printable-schedule-wrapper">
          <div className="modal-content" style={{ maxWidth: '800px', width: '90%' }}>
            <div className="modal-header">
              <div className="modal-title"></div>
              <button className="modal-close-btn no-print" onClick={() => {
                setIsPrintScheduleModalOpen(false);
                setSchedulePrintTeacherId('all');
              }}>
                <X size={20} />
              </button>
            </div>
            
            <div className="modal-body">
              {/* خيارات التصفية قبل الطباعة */}
              <div className="no-print" style={{ 
                marginBottom: '20px', 
                backgroundColor: 'var(--bg-main)', 
                padding: '16px', 
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                flexWrap: 'wrap'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-dark)', whiteSpace: 'nowrap' }}>
                    عرض الحصص حسب الأستاذ:
                  </label>
                  <select
                    value={schedulePrintTeacherId}
                    onChange={(e) => setSchedulePrintTeacherId(e.target.value)}
                    className="form-input"
                    style={{ width: '200px', padding: '6px 12px', fontSize: '0.85rem' }}
                  >
                    <option value="all">جميع الأفواج والأساتذة</option>
                    {teachers.map(t => (
                      <option key={t.id} value={t.id}>
                        أفواج {t.name} ({t.gender === 'male' ? 'أستاذ' : 'أستاذة'})
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-dark)', whiteSpace: 'nowrap' }}>
                    حسب المستوى الدراسي:
                  </label>
                  <select
                    value={schedulePrintLevelId}
                    onChange={(e) => setSchedulePrintLevelId(e.target.value)}
                    className="form-input"
                    style={{ width: '200px', padding: '6px 12px', fontSize: '0.85rem' }}
                  >
                    <option value="all">جميع المستويات</option>
                    {academicLevels.map(lvl => (
                      <option key={lvl.id} value={lvl.id}>{lvl.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="printable-schedule">
                <div className="attendance-print-header" style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid var(--primary-green)', paddingBottom: '16px', marginBottom: '24px' }}>
                  <div>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary-green-dark)' }}>مركز أيبكس للدعم الدراسي</h2>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>للدعم الدراسي وتعليم اللغات</p>
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <span className="badge badge-green" style={{ fontSize: '0.95rem', padding: '6px 12px' }}>جدول مواعيد الحصص الأسبوعية</span>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '6px' }}>التاريخ: {new Date().toLocaleDateString('ar-EG')}</p>
                  </div>
                </div>

                {schedulePrintTeacherId !== 'all' && (
                  <div style={{ marginBottom: '15px', fontSize: '0.95rem', fontWeight: 'bold', color: 'var(--text-dark)', borderRight: '3px solid var(--primary-green)', paddingRight: '8px' }}>
                    جدول الحصص الخاص بـ: {teachers.find(t => t.id === schedulePrintTeacherId)?.name}
                  </div>
                )}

                <table className="attendance-print-table" style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                  <thead>
                    <tr>
                      <th style={{ border: '1px solid #cbd5e1', padding: '10px', backgroundColor: '#f8fafc', fontWeight: 'bold', textAlign: 'right' }}>الفوج</th>
                      <th style={{ border: '1px solid #cbd5e1', padding: '10px', backgroundColor: '#f8fafc', fontWeight: 'bold', textAlign: 'right' }}>المستوى والتخصص</th>
                      <th style={{ border: '1px solid #cbd5e1', padding: '10px', backgroundColor: '#f8fafc', fontWeight: 'bold', textAlign: 'right' }}>المادة</th>
                      {schedulePrintTeacherId === 'all' && (
                        <th style={{ border: '1px solid #cbd5e1', padding: '10px', backgroundColor: '#f8fafc', fontWeight: 'bold', textAlign: 'right' }}>الأستاذ</th>
                      )}
                      <th style={{ border: '1px solid #cbd5e1', padding: '10px', backgroundColor: '#f8fafc', fontWeight: 'bold', textAlign: 'right' }}>المواعيد وحصص الأسبوع</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groups
                      .filter(g => schedulePrintTeacherId === 'all' || g.teacher_id === schedulePrintTeacherId)
                      .filter(g => schedulePrintLevelId === 'all' || g.level_id === schedulePrintLevelId)
                      .sort((a, b) => a.name.localeCompare(b.name, 'ar'))
                      .map(group => {
                        const teacher = teachers.find(t => t.id === group.teacher_id);
                        const lesson = lessons.find(l => l.id === group.lesson_id);
                        const lvl = academicLevels.find(l => l.id === group.level_id);
                        return (
                          <tr key={group.id}>
                            <td style={{ border: '1px solid #cbd5e1', padding: '10px', fontWeight: 'bold' }}>{group.name}</td>
                            <td style={{ border: '1px solid #cbd5e1', padding: '10px' }}>
                              {lvl ? `${lvl.name} - ${group.specialization || 'عام'}` : 'عام / غير محدد'}
                            </td>
                            <td style={{ border: '1px solid #cbd5e1', padding: '10px' }}>{lesson?.name || 'مادة محذوفة'}</td>
                            {schedulePrintTeacherId === 'all' && (
                              <td style={{ border: '1px solid #cbd5e1', padding: '10px' }}>{teacher?.name || 'أستاذ محذوف'}</td>
                            )}
                            <td style={{ border: '1px solid #cbd5e1', padding: '10px', fontWeight: 500, color: 'var(--primary-green-dark)' }}>{group.schedule}</td>
                          </tr>
                        );
                      })}
                    {groups.filter(g => (schedulePrintTeacherId === 'all' || g.teacher_id === schedulePrintTeacherId) && (schedulePrintLevelId === 'all' || g.level_id === schedulePrintLevelId)).length === 0 && (
                      <tr>
                        <td colSpan={schedulePrintTeacherId === 'all' ? 5 : 4} style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', border: '1px solid #cbd5e1' }}>
                          لا توجد أفواج مطابقة لمعايير التصفية حالياً.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="modal-footer no-print">
              <button type="button" className="btn btn-outline" onClick={() => {
                setIsPrintScheduleModalOpen(false);
                setSchedulePrintTeacherId('all');
                setSchedulePrintLevelId('all');
              }}>
                إغلاق
              </button>
              <button type="button" className="btn btn-primary" onClick={() => window.print()}>
                <Printer size={16} style={{ marginLeft: '4px' }} />
                طباعة الجدول
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

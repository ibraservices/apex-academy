import { useState, type FormEvent } from 'react';
import { Plus, Search, Edit2, Trash2, X, Users, User, Phone, Sparkles, AlertTriangle, Printer, MessageCircle, Wallet, FileText, DollarSign } from 'lucide-react';
import { type Student, type Group, type Lesson, type Enrollment, type Invoice, type InvoiceItem, type AcademicLevel, type Teacher } from '../lib/db';

interface StudentsManagerProps {
  students: Student[];
  groups: Group[];
  lessons: Lesson[];
  enrollments: Enrollment[];
  invoices: Invoice[];
  invoiceItems: InvoiceItem[];
  academicLevels: AcademicLevel[];
  teachers: Teacher[];
  onSaveStudent: (student: Omit<Student, 'id'> & { id?: string }) => Promise<Student>;
  onDeleteStudent: (id: string) => Promise<void>;
  onSaveEnrollment: (enrollment: Omit<Enrollment, 'id'> & { id?: string }) => Promise<Enrollment>;
  onDeleteEnrollment: (id: string) => Promise<void>;
  onSaveInvoice: (invoice: Omit<Invoice, 'id'> & { id?: string }) => Promise<Invoice>;
  onDeleteInvoice: (id: string) => Promise<void>;
  onSaveInvoiceItem: (item: Omit<InvoiceItem, 'id'> & { id?: string }) => Promise<InvoiceItem>;
}

export const StudentsManager = ({
  students,
  groups,
  lessons,
  enrollments,
  invoices,
  invoiceItems,
  academicLevels,
  teachers,
  onSaveStudent,
  onDeleteStudent,
  onSaveEnrollment,
  onDeleteEnrollment,
  onSaveInvoice,
  onDeleteInvoice,
  onSaveInvoiceItem
}: StudentsManagerProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [lessonFilter, setLessonFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [validityFilter, setValidityFilter] = useState<string>('all');

  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [currentStudent, setCurrentStudent] = useState<Partial<Student> | null>(null);

  // حالات التسجيل المباشر داخل نموذج إضافة تلميذ جديد
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
  const [enrollNotes, setEnrollNotes] = useState<string>(''); // حقل ملاحظات تقييمية حرة لكل مادة

  // حالات وتدابير الفواتير والمدفوعات
  const [activeTab, setActiveTab] = useState<'students' | 'invoices'>('students');
  const [invoiceSearchTerm, setInvoiceSearchTerm] = useState('');
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState<string>('all');
  const [invoiceStudentFilter, setInvoiceStudentFilter] = useState<string>('all');
  
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [manualInvoiceStudentId, setManualInvoiceStudentId] = useState('');
  const [manualInvoiceDate, setManualInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [manualInvoiceDueDate, setManualInvoiceDueDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return d.toISOString().split('T')[0];
  });
  const [manualInvoiceItems, setManualInvoiceItems] = useState<Array<{ description: string; amount: number }>>([
    { description: '', amount: 0 }
  ]);

  // حالات الدفع وسند القبض
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [activePaymentInvoice, setActivePaymentInvoice] = useState<Invoice | null>(null);
  const [paymentAmountInput, setPaymentAmountInput] = useState<number>(0);
  const [activeReceiptInvoice, setActiveReceiptInvoice] = useState<Invoice | null>(null);

  // حالات وتدابير سندات القبض القديمة (متوافقة)
  const [activeReceiptEnrollment, setActiveReceiptEnrollment] = useState<Enrollment | null>(null);
  const [activeReceiptStudent, setActiveReceiptStudent] = useState<Student | null>(null);

  // دالة إرسال تذكير سداد بالواتساب
  const handleSendWhatsAppReminder = (student: Student, enrollment: Enrollment) => {
    const lesson = lessons.find(l => l.id === enrollment.lesson_id);
    const group = groups.find(g => g.id === enrollment.group_id);
    const pAmount = enrollment.paid_amount !== undefined ? enrollment.paid_amount : enrollment.price;
    const unpaid = enrollment.price - pAmount;
    
    const message = `السلام عليكم ورحمة الله وبركاته.\n\n` +
      `نود تذكيركم بوجوب سداد اشتراك التلميذ(ة) *"${student.name}"* في فوج *"${lesson?.name || ''} - ${group?.name || ''}"*.\n` +
      `المبلغ المتبقي للسداد: *${unpaid} د.م.* من إجمالي *${enrollment.price} د.م.*\n\n` +
      `مع متمنياتنا بالتوفيق والسداد.`;
      
    const cleanPhone = student.parent_phone.replace(/\s+/g, '').replace(/[^0-9+]/g, '');
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  // دالة إرسال تهنئة بالواتساب
  const handleSendWhatsAppCongratulate = (student: Student, enrollment: Enrollment) => {
    const lesson = lessons.find(l => l.id === enrollment.lesson_id);
    
    const message = `السلام عليكم ورحمة الله وبركاته.\n\n` +
      `نهنئكم ونبارك لكم التميز والحرص الأخلاقي والدراسي لابنكم/ابنتكم *"${student.name}"* في مادة *"${lesson?.name || ''}"* في أكاديمية أيبكس.\n\n` +
      `بارك الله في مساره الدراسي وجعله قرة عين لكم ومزيداً من التوفيق والنجاح 🌹`;
      
    const cleanPhone = student.parent_phone.replace(/\s+/g, '').replace(/[^0-9+]/g, '');
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

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

  // تصفية التلاميذ وترتيبهم (الأحدث أولاً لسهولة الوصول)
  const filteredStudents = students
    .filter(student => {
      const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            student.parent_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            student.parent_phone.includes(searchTerm);
      const matchesLevel = levelFilter === 'all' || student.academic_level === levelFilter;

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

      // تصفية حسب صلاحية الاشتراك
      let matchesValidity = true;
      if (validityFilter !== 'all') {
        matchesValidity = studentEnrollments.some(e => {
          const status = getEnrollmentStatus(e.end_date);
          if (validityFilter === 'expiring') {
            if (status !== 'active') return false;
            const days = getDaysRemaining(e.end_date);
            return days >= 0 && days <= 5;
          }
          if (validityFilter === 'expired') {
            return status === 'expired';
          }
          if (validityFilter === 'expired_unpaid') {
            if (status !== 'expired') return false;
            const payStatus = e.payment_status || 'paid';
            return payStatus === 'unpaid' || payStatus === 'partial';
          }
          return true;
        });

        if (studentEnrollments.length === 0) {
          matchesValidity = false;
        }
      }

      return matchesSearch && matchesLevel && matchesLesson && matchesStatus && matchesPayment && matchesValidity;
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
    setCurrentStudent({
      name: '',
      parent_name: '',
      parent_phone: '',
      academic_level: academicLevels[0]?.id || '',
      specialization: academicLevels[0]?.specializations[0] || 'عام',
      registration_date: new Date().toISOString().split('T')[0],
      gender: 'female'
    });
    setDirectEnroll(false);
    const matchingGroups = groups.filter(g => g.level_id === (academicLevels[0]?.id || '') && g.specialization === (academicLevels[0]?.specializations[0] || 'عام'));
    setDirectGroupId(matchingGroups[0]?.id || '');
    setDirectPrice(150);
    setDirectStartDate(new Date().toISOString().split('T')[0]);
    setDirectPaymentStatus('paid');
    setDirectPaidAmount(150);
    setIsStudentModalOpen(true);
  };

  const handleOpenEditStudentModal = (student: Student) => {
    setCurrentStudent({
      ...student,
      academic_level: student.academic_level || academicLevels[0]?.id || '',
      specialization: student.specialization || 'عام',
      registration_date: student.registration_date || (student.created_at ? student.created_at.split('T')[0] : new Date().toISOString().split('T')[0])
    });
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
    setEnrollNotes('');
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
    setEnrollNotes(enrollment.notes || '');
    setIsEnrollModalOpen(true);
  };

  const handleCloseEnrollModal = () => {
    setIsEnrollModalOpen(false);
    setEnrollStudentId(null);
    setEnrollGroupId('');
    setEditingEnrollmentId(null);
    setEnrollNotes('');
  };

  // دوال الفواتير والمدفوعات المضافة
  const handleOpenInvoiceModal = () => {
    setManualInvoiceStudentId(students[0]?.id || '');
    setManualInvoiceDate(new Date().toISOString().split('T')[0]);
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    setManualInvoiceDueDate(d.toISOString().split('T')[0]);
    setManualInvoiceItems([{ description: '', amount: 0 }]);
    setIsInvoiceModalOpen(true);
  };

  const handleCloseInvoiceModal = () => {
    setIsInvoiceModalOpen(false);
    setManualInvoiceStudentId('');
    setManualInvoiceItems([{ description: '', amount: 0 }]);
  };

  const handleAddManualInvoiceItem = () => {
    setManualInvoiceItems([...manualInvoiceItems, { description: '', amount: 0 }]);
  };

  const handleRemoveManualInvoiceItem = (index: number) => {
    if (manualInvoiceItems.length <= 1) return;
    setManualInvoiceItems(manualInvoiceItems.filter((_, i) => i !== index));
  };

  const handleManualInvoiceItemChange = (index: number, field: 'description' | 'amount', value: any) => {
    const updated = manualInvoiceItems.map((item, i) => {
      if (i === index) {
        return {
          ...item,
          [field]: field === 'amount' ? Number(value) : value
        };
      }
      return item;
    });
    setManualInvoiceItems(updated);
  };

  const handleOpenPaymentModal = (invoice: Invoice) => {
    setActivePaymentInvoice(invoice);
    const remaining = invoice.total_amount - invoice.paid_amount;
    setPaymentAmountInput(remaining > 0 ? remaining : 0);
    setIsPaymentModalOpen(true);
  };

  const handleClosePaymentModal = () => {
    setIsPaymentModalOpen(false);
    setActivePaymentInvoice(null);
    setPaymentAmountInput(0);
  };

  const handleSubmitStudent = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentStudent?.name?.trim() || !currentStudent?.parent_name?.trim()) return;

    if (directEnroll && !currentStudent.id) {
      if (!directGroupId) {
        alert('يرجى اختيار الفوج المراد تسجيل التلميذ به.');
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

    // التحقق من تكرار تسجيل التلميذ في نفس المجموعة (فقط في حالة التسجيل الجديد أو تغيير المجموعة)
    const existingEnrollment = editingEnrollmentId ? enrollments.find(e => e.id === editingEnrollmentId) : null;
    if (!editingEnrollmentId || (existingEnrollment && existingEnrollment.group_id !== enrollGroupId)) {
      const isAlreadyEnrolled = enrollments.some(
        e => e.student_id === enrollStudentId && e.group_id === enrollGroupId && e.id !== editingEnrollmentId
      );
      if (isAlreadyEnrolled) {
        alert('خطأ: هذا التلميذ مسجل بالفعل في هذا الفوج ولا يمكن تكرار التسجيل.');
        return;
      }
    }

    const group = groups.find(g => g.id === enrollGroupId);
    if (!group) return;

    // التحقق الاختياري: هل جنس التلميذ متطابق مع فئة الفوج؟ (فقط في حالة التسجيل الجديد أو تغيير المجموعة)
    if (!existingEnrollment || existingEnrollment.group_id !== enrollGroupId) {
      const student = students.find(s => s.id === enrollStudentId);
      if (student && student.gender && group.gender_target !== 'all' && group.gender_target !== student.gender) {
        if (!window.confirm(`تنبيه: جنس التلميذ (${student.gender === 'male' ? 'ذكر' : 'أنثى'}) لا يطابق الفئة المخصصة للفوج (${group.gender_target === 'male' ? 'ذكور' : 'إناث'}). هل تريد المتابعة على أي حال؟`)) {
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
      paid_amount: paymentStatus === 'paid' ? Number(enrollPrice) : (paymentStatus === 'unpaid' ? 0 : Number(paidAmount)),
      notes: enrollNotes
    };

    await onSaveEnrollment(enrollmentToSave);
    handleCloseEnrollModal();
  };

  const handleSubmitInvoice = async (e: FormEvent) => {
    e.preventDefault();
    if (!manualInvoiceStudentId || manualInvoiceItems.length === 0) {
      alert('يرجى اختيار التلميذ وإدخال بنود الفاتورة.');
      return;
    }

    const totalAmount = manualInvoiceItems.reduce((sum, item) => sum + Number(item.amount), 0);

    const savedInvoice = await onSaveInvoice({
      student_id: manualInvoiceStudentId,
      total_amount: totalAmount,
      paid_amount: 0,
      payment_status: 'unpaid',
      invoice_date: manualInvoiceDate,
      due_date: manualInvoiceDueDate
    });

    if (savedInvoice) {
      for (const item of manualInvoiceItems) {
        if (item.description.trim()) {
          await onSaveInvoiceItem({
            invoice_id: savedInvoice.id,
            description: item.description,
            amount: Number(item.amount)
          });
        }
      }
    }

    handleCloseInvoiceModal();
  };

  const handleSubmitPayment = async (e: FormEvent) => {
    e.preventDefault();
    if (!activePaymentInvoice || paymentAmountInput < 0) return;

    const newPaidAmount = activePaymentInvoice.paid_amount + Number(paymentAmountInput);
    let newStatus: 'paid' | 'partial' | 'unpaid' = 'unpaid';
    if (newPaidAmount >= activePaymentInvoice.total_amount) {
      newStatus = 'paid';
    } else if (newPaidAmount > 0) {
      newStatus = 'partial';
    }

    await onSaveInvoice({
      ...activePaymentInvoice,
      paid_amount: newPaidAmount,
      payment_status: newStatus
    });

    handleClosePaymentModal();
  };

  const handleDeleteStudent = async (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا التلميذ نهائياً؟ سيتم إلغاء جميع اشتراكاته وفواتيره.')) {
      await onDeleteStudent(id);
    }
  };

  const handleDeleteEnrollment = async (id: string) => {
    if (window.confirm('هل أنت متأكد من إلغاء هذا الاشتراك المحدد؟')) {
      await onDeleteEnrollment(id);
    }
  };

  const handlePrintEnrollmentReceipt = (enrollment: Enrollment, student: Student) => {
    const item = invoiceItems.find(ii => ii.enrollment_id === enrollment.id);
    if (item) {
      const invoice = invoices.find(i => i.id === item.invoice_id);
      if (invoice) {
        setActiveReceiptInvoice(invoice);
        return;
      }
    }
    // التراجع للوصل القديم في حال عدم وجود فاتورة مرتبطة
    setActiveReceiptEnrollment(enrollment);
    setActiveReceiptStudent(student);
  };

  const filteredInvoices = invoices.filter(invoice => {
    const student = students.find(s => s.id === invoice.student_id);
    const studentName = student ? student.name.toLowerCase() : '';
    const matchesSearch = studentName.includes(invoiceSearchTerm.toLowerCase()) || 
                          invoice.id.toLowerCase().includes(invoiceSearchTerm.toLowerCase());
    
    const matchesStatus = invoiceStatusFilter === 'all' || invoice.payment_status === invoiceStatusFilter;
    const matchesStudent = invoiceStudentFilter === 'all' || invoice.student_id === invoiceStudentFilter;
    
    return matchesSearch && matchesStatus && matchesStudent;
  });

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          {activeTab === 'students' ? (
            <>
              <h2>إدارة التلاميذ والاشتراكات</h2>
              <p>تسجيل التلاميذ الجدد، وتنسيق اشتراكاتهم بالمواد والتحقق من صلاحيتها</p>
            </>
          ) : (
            <>
              <h2>إدارة الفواتير والمدفوعات</h2>
              <p>استعراض فواتير التلاميذ، وتوثيق مقبوضات الدفعات وطباعة سندات القبض المجمعة</p>
            </>
          )}
        </div>
        {activeTab === 'students' ? (
          <button className="btn btn-primary" onClick={handleOpenAddStudentModal}>
            <Plus size={18} />
            تسجيل تلميذ جديد
          </button>
        ) : (
          <button className="btn btn-primary" onClick={handleOpenInvoiceModal}>
            <Plus size={18} />
            إنشاء فاتورة يدوية
          </button>
        )}
      </div>

      {/* أزرار التبويبات */}
      <div className="tabs-container no-print" style={{ display: 'flex', gap: '12px', borderBottom: '1px solid var(--border-color)', marginBottom: '20px', paddingBottom: '8px' }}>
        <button 
          className={`btn ${activeTab === 'students' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => {
            setActiveTab('students');
            setInvoiceStudentFilter('all');
          }}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Users size={18} />
          <span>قائمة التلاميذ والاشتراكات</span>
        </button>
        <button 
          className={`btn ${activeTab === 'invoices' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveTab('invoices')}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Wallet size={18} />
          <span>الفواتير والمدفوعات</span>
        </button>
      </div>

      {/* محتوى التبويبات */}
      {activeTab === 'students' ? (
        <>
          {/* شريط الفلاتر للتلاميذ */}
          <div className="filters-container">
            <div className="filter-group" style={{ flexGrow: 2 }}>
              <label className="filter-label">البحث عن تلميذ</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  className="filter-input"
                  placeholder="ابحث باسم التلميذ، ولي الأمر، أو الهاتف..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ width: '100%', paddingRight: '40px' }}
                />
                <Search size={18} style={{ position: 'absolute', right: '14px', top: '12px', color: 'var(--text-light)' }} />
              </div>
            </div>

            <div className="filter-group">
              <label className="filter-label">المستوى الدراسي</label>
              <select className="filter-input" value={levelFilter} onChange={(e) => setLevelFilter(e.target.value)}>
                <option value="all">الكل</option>
                {academicLevels.map(lvl => (
                  <option key={lvl.id} value={lvl.id}>{lvl.name}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label className="filter-label">المشتركين بمادة</label>
              <select className="filter-input" value={lessonFilter} onChange={(e) => setLessonFilter(e.target.value)}>
                <option value="all">كل المواد</option>
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
                <option value="none">غير مسجل بأي مادة</option>
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
              <select 
                className="filter-input" 
                value={validityFilter} 
                onChange={(e) => setValidityFilter(e.target.value)}
              >
                <option value="all">كل الاشتراكات</option>
                <option value="expiring">ينتهي خلال 5 أيام أو أقل</option>
                <option value="expired">منتهية الصلاحية</option>
                <option value="expired_unpaid">منتهية وبها مستحقات معلقة</option>
              </select>
            </div>
          </div>

          {/* جدول التلاميذ الفعلي */}
          {filteredStudents.length > 0 ? (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>اسم التلميذ</th>
                    <th>تاريخ التسجيل</th>
                    <th>المستوى الدراسي</th>
                    <th>ولي الأمر والهاتف</th>
                    <th>المواد والاشتراكات المسجلة</th>
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
                              backgroundColor: 'var(--primary-green-subtle)',
                              color: 'var(--primary-green-dark)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              <User size={16} />
                            </div>
                            <span>{student.name}</span>
                          </div>
                        </td>

                        {/* تاريخ التسجيل */}
                        <td>
                          {student.registration_date || 'تاريخ غير محدد'}
                        </td>

                        {/* المستوى الدراسي والتخصص */}
                        <td>
                          {(() => {
                            const lvl = academicLevels.find(l => l.id === student.academic_level);
                            const specLabel = student.specialization && student.specialization !== 'عام' ? ` - ${student.specialization}` : '';
                            return (
                              <span className="badge badge-blue">
                                {lvl ? `${lvl.name}${specLabel}` : (student.academic_level || 'غير محدد')}
                              </span>
                            );
                          })()}
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
                                    {/* عرض الملاحظات التقييمية لكل مادة */}
                                    {e.notes && (
                                      <div style={{ 
                                        fontSize: '0.8rem', 
                                        color: 'var(--text-muted)', 
                                        backgroundColor: 'var(--bg-main)', 
                                        padding: '6px 10px', 
                                        borderRadius: '6px', 
                                        borderRight: '3px solid var(--primary-blue)', 
                                        marginTop: '6px',
                                        whiteSpace: 'pre-wrap'
                                      }}>
                                        <strong>ملاحظات تقييمية:</strong> {e.notes}
                                      </div>
                                    )}
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
                                      title="تعديل الاشتراك والملاحظات" 
                                      onClick={() => handleOpenEditEnrollment(e)}
                                    >
                                      <Edit2 size={12} />
                                    </button>
                                    <button 
                                      className="btn-icon-only" 
                                      style={{ padding: '3px', color: 'var(--primary-green)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }} 
                                      title="طباعة سند القبض" 
                                      onClick={() => handlePrintEnrollmentReceipt(e, student)}
                                    >
                                      <Printer size={12} />
                                    </button>
                                    {e.payment_status !== 'paid' && (
                                      <button 
                                        className="btn-icon-only" 
                                        style={{ padding: '3px', color: '#25d366', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }} 
                                        title="إرسال تذكير سداد بالواتساب" 
                                        onClick={() => handleSendWhatsAppReminder(student, e)}
                                      >
                                        <MessageCircle size={12} />
                                      </button>
                                    )}
                                    <button 
                                      className="btn-icon-only" 
                                      style={{ padding: '3px', color: '#eab308', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }} 
                                      title="إرسال تشجيع بالواتساب" 
                                      onClick={() => handleSendWhatsAppCongratulate(student, e)}
                                    >
                                      <Sparkles size={12} />
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
                              تسجيل في مادة جديدة
                            </button>
                          </div>
                        </td>

                        {/* العمليات */}
                        <td>
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                            <button 
                              className="btn btn-outline" 
                              style={{ padding: '4px 8px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                              title="عرض الفواتير" 
                              onClick={() => {
                                setActiveTab('invoices');
                                setInvoiceStudentFilter(student.id);
                              }}
                            >
                              <Wallet size={12} />
                              <span>الفواتير</span>
                            </button>
                            <button 
                              className="btn-icon-only" 
                              title="تعديل بيانات التلميذ" 
                              onClick={() => handleOpenEditStudentModal(student)}
                            >
                              <Edit2 size={14} />
                            </button>
                            <button 
                              className="btn-icon-only danger" 
                              title="حذف التلميذ نهائياً" 
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
              <h4 className="no-data-text">لم يتم العثور على أي تلاميذ</h4>
              <p>يرجى إضافة تلاميذ وتنسيق اشتراكاتهم بالمواد.</p>
            </div>
          )}
        </>
      ) : (
        <>
          {/* واجهة الفواتير والمدفوعات */}
          {/* شريط الفلاتر للفواتير */}
          <div className="filters-container">
            <div className="filter-group" style={{ flexGrow: 2 }}>
              <label className="filter-label">البحث في الفواتير</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  className="filter-input"
                  placeholder="ابحث باسم التلميذ أو رقم الفاتورة..."
                  value={invoiceSearchTerm}
                  onChange={(e) => setInvoiceSearchTerm(e.target.value)}
                  style={{ width: '100%', paddingRight: '40px' }}
                />
                <Search size={18} style={{ position: 'absolute', right: '14px', top: '12px', color: 'var(--text-light)' }} />
              </div>
            </div>

            <div className="filter-group">
              <label className="filter-label">حالة دفع الفاتورة</label>
              <select className="filter-input" value={invoiceStatusFilter} onChange={(e) => setInvoiceStatusFilter(e.target.value)}>
                <option value="all">كل الفواتير</option>
                <option value="paid">مدفوعة بالكامل</option>
                <option value="partial">مدفوعة جزئياً</option>
                <option value="unpaid">غير مدفوعة</option>
              </select>
            </div>

            <div className="filter-group">
              <label className="filter-label">التلميذ</label>
              <select className="filter-input" value={invoiceStudentFilter} onChange={(e) => setInvoiceStudentFilter(e.target.value)}>
                <option value="all">كل التلاميذ</option>
                {students.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* تنبيه فلترة التلميذ المحدد */}
          {invoiceStudentFilter !== 'all' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', backgroundColor: 'var(--primary-blue-subtle)', padding: '10px 16px', borderRadius: '8px', border: '1px solid var(--primary-blue-light)' }}>
              <span style={{ fontSize: '0.88rem', fontWeight: 'bold', color: 'var(--primary-blue-dark)' }}>
                تصفية الفواتير للتلميذ: {students.find(s => s.id === invoiceStudentFilter)?.name}
              </span>
              <button 
                className="btn btn-outline" 
                style={{ padding: '2px 8px', fontSize: '0.75rem', minHeight: 'auto' }}
                onClick={() => setInvoiceStudentFilter('all')}
              >
                إلغاء التصفية
              </button>
            </div>
          )}

          {/* جدول الفواتير الفعلي */}
          {filteredInvoices.length > 0 ? (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>رقم الفاتورة</th>
                    <th>التلميذ</th>
                    <th>تاريخ الفاتورة</th>
                    <th>تاريخ الاستحقاق</th>
                    <th>المبلغ الإجمالي</th>
                    <th>المبلغ المدفوع</th>
                    <th>المتبقي</th>
                    <th>الحالة</th>
                    <th>الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.map(invoice => {
                    const student = students.find(s => s.id === invoice.student_id);
                    const remaining = invoice.total_amount - invoice.paid_amount;
                    
                    return (
                      <tr key={invoice.id}>
                        <td style={{ fontWeight: 'bold', color: 'var(--text-dark)' }}>
                          INV-{invoice.id.substring(0, 8).toUpperCase()}
                        </td>
                        <td>{student ? student.name : 'تلميذ محذوف'}</td>
                        <td>{invoice.invoice_date}</td>
                        <td>{invoice.due_date}</td>
                        <td style={{ fontWeight: 'bold' }}>{invoice.total_amount} د.م.</td>
                        <td style={{ color: 'var(--color-success)', fontWeight: 'bold' }}>{invoice.paid_amount} د.م.</td>
                        <td style={{ color: remaining > 0 ? 'var(--color-danger)' : 'var(--color-success)', fontWeight: 'bold' }}>
                          {remaining} د.م.
                        </td>
                        <td>
                          <span className={`badge ${
                            invoice.payment_status === 'paid' 
                              ? 'badge-success' 
                              : (invoice.payment_status === 'partial' ? 'badge-warning' : 'badge-danger')
                          }`}>
                            {invoice.payment_status === 'paid' && 'مدفوعة'}
                            {invoice.payment_status === 'partial' && 'جزئي'}
                            {invoice.payment_status === 'unpaid' && 'غير مدفوعة'}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            {remaining > 0 && (
                              <button 
                                className="btn btn-outline" 
                                style={{ padding: '4px 8px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                onClick={() => handleOpenPaymentModal(invoice)}
                              >
                                <DollarSign size={12} />
                                <span>سداد دفعة</span>
                              </button>
                            )}
                            <button 
                              className="btn btn-primary" 
                              style={{ padding: '4px 8px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                              onClick={() => setActiveReceiptInvoice(invoice)}
                            >
                              <Printer size={12} />
                              <span>سند قبض مجمع</span>
                            </button>
                            <button 
                              className="btn-icon-only danger" 
                              style={{ padding: '6px' }}
                              title="حذف الفاتورة" 
                              onClick={async () => {
                                if (window.confirm('هل أنت متأكد من حذف هذه الفاتورة؟ سيتم حذف كافة البنود المرتبطة بها.')) {
                                  await onDeleteInvoice(invoice.id);
                                }
                              }}
                            >
                              <Trash2 size={12} />
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
              <FileText className="no-data-icon" size={48} />
              <h4 className="no-data-text">لا توجد فواتير مطابقة</h4>
              <p>لم يتم العثور على فواتير مسجلة في النظام.</p>
            </div>
          )}
        </>
      )}

      {/* نافذة إضافة وتعديل التلميذ */}
      {isStudentModalOpen && currentStudent && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">
                {currentStudent.id ? 'تعديل بيانات التلميذ' : 'تسجيل تلميذ جديد'}
              </h3>
              <button className="modal-close-btn" onClick={handleCloseStudentModal}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitStudent}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">الاسم الكامل للتلميذ *</label>
                    <input
                      type="text"
                      className="form-input"
                      required
                      placeholder="اسم التلميذ الكامل"
                      value={currentStudent.name || ''}
                      onChange={(e) => setCurrentStudent({ ...currentStudent, name: e.target.value })}
                    />
                  </div>

                  <div className="form-grid two-cols">
                    <div className="form-group">
                      <label className="form-label">المستوى الدراسي *</label>
                      <select
                        className="form-input"
                        required
                        value={currentStudent.academic_level || ''}
                        onChange={(e) => {
                          const lvlId = e.target.value;
                          const lvl = academicLevels.find(l => l.id === lvlId);
                          setCurrentStudent({
                            ...currentStudent,
                            academic_level: lvlId,
                            specialization: lvl && lvl.specializations ? lvl.specializations[0] : 'عام'
                          });
                          
                          const matchingGroups = groups.filter(g => g.level_id === lvlId && g.specialization === (lvl && lvl.specializations ? lvl.specializations[0] : 'عام'));
                          setDirectGroupId(matchingGroups[0]?.id || '');
                        }}
                      >
                        <option value="" disabled>اختر المستوى</option>
                        {academicLevels.map(lvl => (
                          <option key={lvl.id} value={lvl.id}>{lvl.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">التخصص / الشعبة *</label>
                      <select
                        className="form-input"
                        required
                        value={currentStudent.specialization || 'عام'}
                        onChange={(e) => {
                          const spec = e.target.value;
                          setCurrentStudent({ ...currentStudent, specialization: spec });
                          
                          const matchingGroups = groups.filter(g => g.level_id === currentStudent.academic_level && g.specialization === spec);
                          setDirectGroupId(matchingGroups[0]?.id || '');
                        }}
                        disabled={!currentStudent.academic_level}
                      >
                        {(() => {
                          const selectedLvl = academicLevels.find(l => l.id === currentStudent.academic_level);
                          const specs = selectedLvl?.specializations || ['عام'];
                          return specs.map(spec => (
                            <option key={spec} value={spec}>{spec}</option>
                          ));
                        })()}
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">تاريخ التسجيل *</label>
                    <input
                      type="date"
                      className="form-input"
                      required
                      value={currentStudent.registration_date || ''}
                      onChange={(e) => setCurrentStudent({ ...currentStudent, registration_date: e.target.value })}
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
                        <span>تسجيل التلميذ في فوج دراسي مباشرة عند الحفظ</span>
                      </label>
                      
                      {directEnroll && (
                        <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '10px', paddingRight: '10px', borderRight: '3px solid var(--primary-green)' }}>
                          <div className="form-group">
                            <label className="form-label">اختر الفوج (المجموعة) التعليمية *</label>
                            <select
                              className="form-input"
                              required={directEnroll}
                              value={directGroupId}
                              onChange={(e) => setDirectGroupId(e.target.value)}
                            >
                              {(() => {
                                const filteredDirectGroups = groups.filter(
                                  g => g.level_id === currentStudent.academic_level && g.specialization === (currentStudent.specialization || 'عام')
                                );
                                if (filteredDirectGroups.length === 0) {
                                  return (
                                    <>
                                      <option value="" disabled>لا توجد أفواج مطابقة لمستوى وتخصص هذا التلميذ</option>
                                    </>
                                  );
                                }
                                return (
                                  <>
                                    <option value="" disabled>اختر الفوج</option>
                                    {filteredDirectGroups.map(g => {
                                      const lesson = lessons.find(l => l.id === g.lesson_id);
                                      return (
                                        <option key={g.id} value={g.id}>
                                          {lesson?.name} - {g.name} ({g.gender_target === 'male' ? 'ذكور' : (g.gender_target === 'female' ? 'إناث' : 'مختلط')})
                                        </option>
                                      );
                                    })}
                                  </>
                                );
                              })()}
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
                {editingEnrollmentId ? 'تعديل بيانات الاشتراك' : 'تسجيل التلميذ في فوج / مادة'}
              </h3>
              <button className="modal-close-btn" onClick={handleCloseEnrollModal}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitEnrollment}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">اختر الفوج (المجموعة) التعليمية *</label>
                    <select
                      className="form-input"
                      required
                      value={enrollGroupId}
                      onChange={(e) => setEnrollGroupId(e.target.value)}
                    >
                      {(() => {
                        const student = students.find(s => s.id === enrollStudentId);
                        const studentLevel = student?.academic_level;
                        const studentSpec = student?.specialization || 'عام';
                        
                        const filteredGroupsForStudent = groups.filter(g => g.level_id === studentLevel && g.specialization === studentSpec);
                        
                        if (filteredGroupsForStudent.length === 0) {
                          return (
                            <option value="" disabled>لا توجد أفواج مطابقة لمستوى وتخصص هذا التلميذ</option>
                          );
                        }
                        
                        return (
                          <>
                            <option value="" disabled>اختر الفوج</option>
                            {filteredGroupsForStudent.map(g => {
                              const lesson = lessons.find(l => l.id === g.lesson_id);
                              return (
                                <option key={g.id} value={g.id}>
                                  {lesson?.name} - {g.name} ({g.gender_target === 'male' ? 'ذكور' : (g.gender_target === 'female' ? 'إناث' : 'مختلط')})
                                </option>
                              );
                            })}
                          </>
                        );
                      })()}
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

                  <div className="form-group" style={{ marginTop: '10px' }}>
                    <label className="form-label">ملاحظات تقييمية (حقل نصي حر للتقييم)</label>
                    <textarea
                      className="form-input"
                      style={{ minHeight: '80px', resize: 'vertical' }}
                      placeholder="اكتب ملاحظات حول أداء التلميذ، الصعوبات، أو التقييم العام في هذه المادة..."
                      value={enrollNotes}
                      onChange={(e) => setEnrollNotes(e.target.value)}
                    />
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
      {/* نافذة استعراض وطباعة سند القبض المجمع للفاتورة */}
      {activeReceiptInvoice && (() => {
        const student = students.find(s => s.id === activeReceiptInvoice.student_id);
        const items = invoiceItems.filter(ii => ii.invoice_id === activeReceiptInvoice.id);
        const remaining = activeReceiptInvoice.total_amount - activeReceiptInvoice.paid_amount;
        
        const handlePrint = () => {
          document.body.classList.add('printing-mode');
          setTimeout(() => {
            window.print();
            document.body.classList.remove('printing-mode');
          }, 150);
        };

        return (
          <>
            <div className="receipt-modal-overlay no-print" onClick={() => setActiveReceiptInvoice(null)}>
              <div className="receipt-modal-content" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
                <button 
                  style={{ position: 'absolute', top: '20px', left: '20px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }} 
                  onClick={() => setActiveReceiptInvoice(null)}
                >
                  <X size={20} />
                </button>

                <h3 style={{ margin: '0 0 20px 0', fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--text-dark)' }}>سند قبض مالي مجمع</h3>
                
                <div className="receipt-container">
                  <div className="receipt-header">
                    <div className="receipt-title">
                      <h3>أكاديمية أيبكس</h3>
                      <p>سند قبض وفاتورة مجمعة</p>
                    </div>
                    <div className="receipt-meta">
                      <div><strong>رقم الفاتورة:</strong> INV-{activeReceiptInvoice.id.substring(0, 8).toUpperCase()}</div>
                      <div><strong>التاريخ:</strong> {activeReceiptInvoice.invoice_date}</div>
                    </div>
                  </div>

                  <div className="receipt-body">
                    <div className="receipt-row">
                      <span className="receipt-label">وصلنا من التلميذ(ة):</span>
                      <span className="receipt-value" style={{ fontWeight: 'bold' }}>{student?.name || 'تلميذ محذوف'}</span>
                    </div>
                    <div className="receipt-row">
                      <span className="receipt-label">المستوى والتخصص:</span>
                      <span className="receipt-value">
                        {(() => {
                          if (!student) return 'غير محدد';
                          const lvl = academicLevels.find(l => l.id === student.academic_level);
                          const specLabel = student.specialization && student.specialization !== 'عام' ? ` - ${student.specialization}` : '';
                          return lvl ? `${lvl.name}${specLabel}` : (student.academic_level || 'غير محدد');
                        })()}
                      </span>
                    </div>

                    <div style={{ marginTop: '16px', marginBottom: '16px' }}>
                      <span className="receipt-label" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>تفاصيل البنود والخدمات:</span>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                        <thead>
                          <tr style={{ backgroundColor: 'var(--bg-main)', borderBottom: '1px solid var(--border-color)' }}>
                            <th style={{ textAlign: 'right', padding: '8px' }}>الوصف / البيان</th>
                            <th style={{ textAlign: 'right', padding: '8px' }}>الأستاذ</th>
                            <th style={{ textAlign: 'right', padding: '8px' }}>التوقيت</th>
                            <th style={{ textAlign: 'left', padding: '8px', width: '100px' }}>المبلغ</th>
                          </tr>
                        </thead>
                        <tbody>
                          {items.map(item => {
                            const enrollment = item.enrollment_id ? enrollments.find(e => e.id === item.enrollment_id) : null;
                            const group = enrollment ? groups.find(g => g.id === enrollment.group_id) : null;
                            const teacher = group ? teachers.find(t => t.id === group.teacher_id) : null;
                            return (
                              <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                <td style={{ padding: '8px' }}>{item.description}</td>
                                <td style={{ padding: '8px' }}>{teacher?.name || '—'}</td>
                                <td style={{ padding: '8px' }}>{group?.schedule || '—'}</td>
                                <td style={{ padding: '8px', textAlign: 'left', fontWeight: 'bold' }}>{item.amount} د.م.</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    <div className="receipt-row">
                      <span className="receipt-label">حالة الدفع للفاتورة:</span>
                      <span className="receipt-value" style={{ fontWeight: 'bold' }}>
                        {activeReceiptInvoice.payment_status === 'paid' && 'مدفوعة بالكامل'}
                        {activeReceiptInvoice.payment_status === 'partial' && `دفعة جزئية (متبقي: ${remaining} د.م.)`}
                        {activeReceiptInvoice.payment_status === 'unpaid' && 'غير مدفوعة'}
                      </span>
                    </div>

                    <div className="receipt-amount-box" style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'stretch' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                        <span>المبلغ الإجمالي:</span>
                        <span>{activeReceiptInvoice.total_amount} د.م.</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', borderTop: '1px solid #fff', paddingTop: '4px' }}>
                        <span>المبلغ المدفوع (المحصل):</span>
                        <span>{activeReceiptInvoice.paid_amount} د.م.</span>
                      </div>
                    </div>
                  </div>

                  <div className="receipt-signatures-box">
                    <div>
                      <div className="receipt-signature-line">توقيع المستلم / المحصل</div>
                    </div>
                    <div>
                      <div className="receipt-signature-line">خاتم وتوقيع الإدارة</div>
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '24px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                  <button className="btn btn-outline" onClick={() => setActiveReceiptInvoice(null)}>إغلاق</button>
                  <button className="btn btn-primary" onClick={handlePrint} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Printer size={16} />
                    <span>طباعة سند القبض</span>
                  </button>
                </div>
              </div>
            </div>

            {/* نسخة الطباعة للفاتورة المجمعة */}
            <div className="print-only receipt-print-window" style={{ direction: 'rtl', padding: '40px', fontFamily: 'Cairo, sans-serif' }}>
              <div className="receipt-container" style={{ border: '2px solid #000', padding: '30px', borderRadius: '8px' }}>
                <div className="receipt-header" style={{ borderBottom: '2px solid #000', paddingBottom: '16px', marginBottom: '24px' }}>
                  <div className="receipt-title">
                    <h3 style={{ fontSize: '1.6rem', fontWeight: '800' }}>أكاديمية أيبكس</h3>
                    <p style={{ fontSize: '0.9rem' }}>سند قبض وفاتورة مجمعة</p>
                  </div>
                  <div className="receipt-meta" style={{ fontSize: '1rem' }}>
                    <div><strong>رقم الفاتورة:</strong> INV-{activeReceiptInvoice.id.substring(0, 8).toUpperCase()}</div>
                    <div><strong>التاريخ:</strong> {activeReceiptInvoice.invoice_date}</div>
                  </div>
                </div>

                <div className="receipt-body" style={{ gap: '20px', fontSize: '1.1rem' }}>
                  <div className="receipt-row" style={{ borderBottom: '1px dashed #000', paddingBottom: '12px' }}>
                    <span className="receipt-label" style={{ width: '180px', fontWeight: 'bold' }}>وصلنا من التلميذ(ة):</span>
                    <span className="receipt-value" style={{ fontWeight: 'bold' }}>{student?.name || 'تلميذ محذوف'}</span>
                  </div>
                  <div className="receipt-row" style={{ borderBottom: '1px dashed #000', paddingBottom: '12px' }}>
                    <span className="receipt-label" style={{ width: '180px', fontWeight: 'bold' }}>المستوى والتخصص:</span>
                    <span className="receipt-value" style={{ fontWeight: 'bold' }}>
                      {(() => {
                        if (!student) return 'غير محدد';
                        const lvl = academicLevels.find(l => l.id === student.academic_level);
                        const specLabel = student.specialization && student.specialization !== 'عام' ? ` - ${student.specialization}` : '';
                        return lvl ? `${lvl.name}${specLabel}` : (student.academic_level || 'غير محدد');
                      })()}
                    </span>
                  </div>

                  <div style={{ marginTop: '16px', marginBottom: '16px' }}>
                    <span className="receipt-label" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>تفاصيل البنود والخدمات:</span>
                    <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f2f2f2', borderBottom: '2px solid #000' }}>
                          <th style={{ textAlign: 'right', padding: '8px', borderLeft: '1px solid #000' }}>الوصف / البيان</th>
                          <th style={{ textAlign: 'right', padding: '8px', borderLeft: '1px solid #000' }}>الأستاذ</th>
                          <th style={{ textAlign: 'right', padding: '8px', borderLeft: '1px solid #000' }}>التوقيت</th>
                          <th style={{ textAlign: 'left', padding: '8px', width: '120px' }}>المبلغ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map(item => {
                          const enrollment = item.enrollment_id ? enrollments.find(e => e.id === item.enrollment_id) : null;
                          const group = enrollment ? groups.find(g => g.id === enrollment.group_id) : null;
                          const teacher = group ? teachers.find(t => t.id === group.teacher_id) : null;
                          return (
                            <tr key={item.id} style={{ borderBottom: '1px solid #000' }}>
                              <td style={{ padding: '8px', borderLeft: '1px solid #000' }}>{item.description}</td>
                              <td style={{ padding: '8px', borderLeft: '1px solid #000' }}>{teacher?.name || '—'}</td>
                              <td style={{ padding: '8px', borderLeft: '1px solid #000' }}>{group?.schedule || '—'}</td>
                              <td style={{ padding: '8px', textAlign: 'left', fontWeight: 'bold' }}>{item.amount} د.م.</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="receipt-row" style={{ borderBottom: '1px dashed #000', paddingBottom: '12px' }}>
                    <span className="receipt-label" style={{ width: '180px', fontWeight: 'bold' }}>حالة الدفع:</span>
                    <span className="receipt-value" style={{ fontWeight: 'bold' }}>
                      {activeReceiptInvoice.payment_status === 'paid' && 'مدفوعة بالكامل'}
                      {activeReceiptInvoice.payment_status === 'partial' && `دفعة جزئية (متبقي: ${remaining} د.م.)`}
                      {activeReceiptInvoice.payment_status === 'unpaid' && 'غير مدفوعة'}
                    </span>
                  </div>

                  <div className="receipt-amount-box" style={{ border: '2px solid #000', padding: '16px', marginTop: '20px', fontSize: '1.2rem', backgroundColor: '#f8fafc' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <strong>المبلغ الإجمالي للفاتورة:</strong>
                      <strong>{activeReceiptInvoice.total_amount} د.م.</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #000', paddingTop: '6px' }}>
                      <strong>المبلغ المدفوع (المحصل):</strong>
                      <strong>{activeReceiptInvoice.paid_amount} د.م.</strong>
                    </div>
                  </div>
                </div>

                <div className="receipt-signatures-box" style={{ marginTop: '60px', borderTop: '1px solid #000', paddingTop: '24px' }}>
                  <div>
                    <div className="receipt-signature-line" style={{ borderTop: 'none', fontSize: '0.95rem' }}>توقيع المستلم / المحصل</div>
                  </div>
                  <div>
                    <div className="receipt-signature-line" style={{ borderTop: 'none', fontSize: '0.95rem' }}>خاتم وتوقيع الإدارة</div>
                  </div>
                </div>
              </div>
            </div>
          </>
        );
      })()}

      {/* نافذة استعراض وطباعة سند القبض الفردي التقليدي (متوافق مع الاشتراكات القديمة) */}
      {activeReceiptEnrollment && activeReceiptStudent && (() => {
        const lesson = lessons.find(l => l.id === activeReceiptEnrollment.lesson_id);
        const group = groups.find(g => g.id === activeReceiptEnrollment.group_id);
        const pAmount = activeReceiptEnrollment.paid_amount !== undefined ? activeReceiptEnrollment.paid_amount : activeReceiptEnrollment.price;
        const unpaid = activeReceiptEnrollment.price - pAmount;
        const pStatus = activeReceiptEnrollment.payment_status || 'paid';
        
        const handlePrint = () => {
          document.body.classList.add('printing-mode');
          setTimeout(() => {
            window.print();
            document.body.classList.remove('printing-mode');
          }, 150);
        };

        return (
          <>
            <div className="receipt-modal-overlay no-print" onClick={() => {
              setActiveReceiptEnrollment(null);
              setActiveReceiptStudent(null);
            }}>
              <div className="receipt-modal-content" onClick={(e) => e.stopPropagation()}>
                <button 
                  style={{ position: 'absolute', top: '20px', left: '20px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }} 
                  onClick={() => {
                    setActiveReceiptEnrollment(null);
                    setActiveReceiptStudent(null);
                  }}
                >
                  <X size={20} />
                </button>

                <h3 style={{ margin: '0 0 20px 0', fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--text-dark)' }}>سند قبض مالي فردي</h3>
                
                <div className="receipt-container">
                  <div className="receipt-header">
                    <div className="receipt-title">
                      <h3>أكاديمية أيبكس</h3>
                      <p>وصل استلام اشتراك تلميذ</p>
                    </div>
                    <div className="receipt-meta">
                      <div><strong>رقم الوصل:</strong> REC-{activeReceiptEnrollment.id.substring(0, 8).toUpperCase()}</div>
                      <div><strong>التاريخ:</strong> {activeReceiptEnrollment.start_date}</div>
                    </div>
                  </div>

                  <div className="receipt-body">
                    <div className="receipt-row">
                      <span className="receipt-label">وصلنا من التلميذ(ة):</span>
                      <span className="receipt-value" style={{ fontWeight: 'bold' }}>{activeReceiptStudent.name}</span>
                    </div>
                    <div className="receipt-row">
                      <span className="receipt-label">المستوى والتخصص:</span>
                      <span className="receipt-value">
                        {(() => {
                          const lvl = academicLevels.find(l => l.id === activeReceiptStudent.academic_level);
                          const specLabel = activeReceiptStudent.specialization && activeReceiptStudent.specialization !== 'عام' ? ` - ${activeReceiptStudent.specialization}` : '';
                          return lvl ? `${lvl.name}${specLabel}` : (activeReceiptStudent.academic_level || 'غير محدد');
                        })()}
                      </span>
                    </div>
                    <div className="receipt-row">
                      <span className="receipt-label">المادة والفوج:</span>
                      <span className="receipt-value">{lesson?.name} - {group?.name}</span>
                    </div>
                    <div className="receipt-row">
                      <span className="receipt-label">الأستاذ(ة):</span>
                      <span className="receipt-value">
                        {(() => {
                          const teacher = group ? teachers.find(t => t.id === group.teacher_id) : null;
                          return teacher ? teacher.name : 'غير محدد';
                        })()}
                      </span>
                    </div>
                    <div className="receipt-row">
                      <span className="receipt-label">توقيت الفوج:</span>
                      <span className="receipt-value">{group?.schedule || 'غير محدد'}</span>
                    </div>
                    <div className="receipt-row">
                      <span className="receipt-label">فترة الصلاحية:</span>
                      <span className="receipt-value">من {activeReceiptEnrollment.start_date} إلى {activeReceiptEnrollment.end_date}</span>
                    </div>
                    <div className="receipt-row">
                      <span className="receipt-label">حالة الدفع:</span>
                      <span className="receipt-value">
                        {pStatus === 'paid' && 'مدفوع بالكامل'}
                        {pStatus === 'partial' && `دفع جزئي (باقي بذمته: ${unpaid} د.م.)`}
                        {pStatus === 'unpaid' && 'متأخر / غير مدفوع'}
                      </span>
                    </div>

                    <div className="receipt-amount-box">
                      <span>المبلغ المستلم:</span>
                      <span>{pAmount} د.م.</span>
                    </div>
                  </div>

                  <div className="receipt-signatures-box">
                    <div>
                      <div className="receipt-signature-line">توقيع المستلم / المحصل</div>
                    </div>
                    <div>
                      <div className="receipt-signature-line">خاتم وتوقيع الإدارة</div>
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '24px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                  <button className="btn btn-outline" onClick={() => {
                    setActiveReceiptEnrollment(null);
                    setActiveReceiptStudent(null);
                  }}>إغلاق</button>
                  <button className="btn btn-primary" onClick={handlePrint} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Printer size={16} />
                    <span>طباعة الوصل</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="print-only receipt-print-window" style={{ direction: 'rtl', padding: '40px', fontFamily: 'Cairo, sans-serif' }}>
              <div className="receipt-container" style={{ border: '2px solid #000', padding: '30px', borderRadius: '8px' }}>
                <div className="receipt-header" style={{ borderBottom: '2px solid #000', paddingBottom: '16px', marginBottom: '24px' }}>
                  <div className="receipt-title">
                    <h3 style={{ fontSize: '1.6rem', fontWeight: '800' }}>أكاديمية أيبكس</h3>
                    <p style={{ fontSize: '0.9rem' }}>وصل استلام اشتراك تلميذ</p>
                  </div>
                  <div className="receipt-meta" style={{ fontSize: '1rem' }}>
                    <div><strong>رقم الوصل:</strong> REC-{activeReceiptEnrollment.id.substring(0, 8).toUpperCase()}</div>
                    <div><strong>التاريخ:</strong> {activeReceiptEnrollment.start_date}</div>
                  </div>
                </div>

                <div className="receipt-body" style={{ gap: '20px', fontSize: '1.1rem' }}>
                  <div className="receipt-row" style={{ borderBottom: '1px dashed #000', paddingBottom: '12px' }}>
                    <span className="receipt-label" style={{ width: '180px', fontWeight: 'bold' }}>وصلنا من التلميذ(ة):</span>
                    <span className="receipt-value" style={{ fontWeight: 'bold' }}>{activeReceiptStudent.name}</span>
                  </div>
                  <div className="receipt-row" style={{ borderBottom: '1px dashed #000', paddingBottom: '12px' }}>
                    <span className="receipt-label" style={{ width: '180px', fontWeight: 'bold' }}>المستوى والتخصص:</span>
                    <span className="receipt-value" style={{ fontWeight: 'bold' }}>
                      {(() => {
                        const lvl = academicLevels.find(l => l.id === activeReceiptStudent.academic_level);
                        const specLabel = activeReceiptStudent.specialization && activeReceiptStudent.specialization !== 'عام' ? ` - ${activeReceiptStudent.specialization}` : '';
                        return lvl ? `${lvl.name}${specLabel}` : (activeReceiptStudent.academic_level || 'غير محدد');
                      })()}
                    </span>
                  </div>
                  <div className="receipt-row" style={{ borderBottom: '1px dashed #000', paddingBottom: '12px' }}>
                    <span className="receipt-label" style={{ width: '180px', fontWeight: 'bold' }}>المادة والفوج:</span>
                    <span className="receipt-value">{lesson?.name} - {group?.name}</span>
                  </div>
                  <div className="receipt-row" style={{ borderBottom: '1px dashed #000', paddingBottom: '12px' }}>
                    <span className="receipt-label" style={{ width: '180px', fontWeight: 'bold' }}>الأستاذ(ة):</span>
                    <span className="receipt-value" style={{ fontWeight: 'bold' }}>
                      {(() => {
                        const teacher = group ? teachers.find(t => t.id === group.teacher_id) : null;
                        return teacher ? teacher.name : 'غير محدد';
                      })()}
                    </span>
                  </div>
                  <div className="receipt-row" style={{ borderBottom: '1px dashed #000', paddingBottom: '12px' }}>
                    <span className="receipt-label" style={{ width: '180px', fontWeight: 'bold' }}>توقيت الفوج:</span>
                    <span className="receipt-value" style={{ fontWeight: 'bold' }}>{group?.schedule || 'غير محدد'}</span>
                  </div>
                  <div className="receipt-row" style={{ borderBottom: '1px dashed #000', paddingBottom: '12px' }}>
                    <span className="receipt-label" style={{ width: '180px', fontWeight: 'bold' }}>فترة الصلاحية:</span>
                    <span className="receipt-value">من {activeReceiptEnrollment.start_date} إلى {activeReceiptEnrollment.end_date}</span>
                  </div>
                  <div className="receipt-row" style={{ borderBottom: '1px dashed #000', paddingBottom: '12px' }}>
                    <span className="receipt-label" style={{ width: '180px', fontWeight: 'bold' }}>حالة الدفع:</span>
                    <span className="receipt-value" style={{ fontWeight: 'bold' }}>
                      {pStatus === 'paid' && 'مدفوع بالكامل'}
                      {pStatus === 'partial' && `دفع جزئي (باقي بذمته: ${unpaid} د.م.)`}
                      {pStatus === 'unpaid' && 'متأخر / غير مدفوع'}
                    </span>
                  </div>

                  <div className="receipt-amount-box" style={{ border: '2px solid #000', padding: '16px', marginTop: '20px', fontSize: '1.3rem', backgroundColor: '#f8fafc' }}>
                    <strong>المبلغ المستلم:</strong>
                    <strong>{pAmount} د.م.</strong>
                  </div>
                </div>

                <div className="receipt-signatures-box" style={{ marginTop: '60px', borderTop: '1px solid #000', paddingTop: '24px' }}>
                  <div>
                    <div className="receipt-signature-line" style={{ borderTop: 'none', fontSize: '0.95rem' }}>توقيع المستلم / المحصل</div>
                  </div>
                  <div>
                    <div className="receipt-signature-line" style={{ borderTop: 'none', fontSize: '0.95rem' }}>خاتم وتوقيع الإدارة</div>
                  </div>
                </div>
              </div>
            </div>
          </>
        );
      })()}

      {/* نافذة إنشاء فاتورة يدوية جديدة */}
      {isInvoiceModalOpen && (
        <div className="modal-overlay no-print">
          <div className="modal-content" style={{ maxWidth: '650px' }}>
            <div className="modal-header">
              <h3 className="modal-title">إنشاء فاتورة يدوية جديدة</h3>
              <button className="modal-close-btn" onClick={handleCloseInvoiceModal}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitInvoice}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">اختر التلميذ *</label>
                    <select
                      className="form-input"
                      required
                      value={manualInvoiceStudentId}
                      onChange={(e) => setManualInvoiceStudentId(e.target.value)}
                    >
                      <option value="" disabled>اختر التلميذ</option>
                      {students.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-grid two-cols">
                    <div className="form-group">
                      <label className="form-label">تاريخ الفاتورة *</label>
                      <input
                        type="date"
                        className="form-input"
                        required
                        value={manualInvoiceDate}
                        onChange={(e) => setManualInvoiceDate(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">تاريخ الاستحقاق *</label>
                      <input
                        type="date"
                        className="form-input"
                        required
                        value={manualInvoiceDueDate}
                        onChange={(e) => setManualInvoiceDueDate(e.target.value)}
                      />
                    </div>
                  </div>

                  <div style={{ marginTop: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <span style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>بنود الفاتورة:</span>
                      <button 
                        type="button" 
                        className="btn btn-outline" 
                        style={{ padding: '4px 12px', fontSize: '0.75rem' }} 
                        onClick={handleAddManualInvoiceItem}
                      >
                        <Plus size={12} />
                        إضافة بند
                      </button>
                    </div>

                    {manualInvoiceItems.map((item, index) => (
                      <div key={index} style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '8px' }}>
                        <div className="form-group" style={{ flexGrow: 1, marginBottom: 0 }}>
                          <input
                            type="text"
                            className="form-input"
                            required
                            placeholder="وصف البند (مثال: رسوم التسجيل، رسوم كتاب...)"
                            value={item.description}
                            onChange={(e) => handleManualInvoiceItemChange(index, 'description', e.target.value)}
                          />
                        </div>
                        <div className="form-group" style={{ width: '120px', marginBottom: 0 }}>
                          <input
                            type="number"
                            className="form-input"
                            required
                            min="0"
                            placeholder="المبلغ"
                            value={item.amount || ''}
                            onChange={(e) => handleManualInvoiceItemChange(index, 'amount', e.target.value)}
                          />
                        </div>
                        {manualInvoiceItems.length > 1 && (
                          <button 
                            type="button" 
                            className="btn-icon-only danger" 
                            style={{ padding: '10px' }}
                            onClick={() => handleRemoveManualInvoiceItem(index)}
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <div style={{ 
                    marginTop: '16px', 
                    padding: '12px 16px', 
                    backgroundColor: 'var(--primary-blue-subtle)', 
                    borderRadius: '8px', 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    fontWeight: 'bold', 
                    color: 'var(--primary-blue-dark)',
                    fontSize: '0.95rem'
                  }}>
                    <span>المبلغ الكلي التقديري:</span>
                    <span>{manualInvoiceItems.reduce((sum, item) => sum + Number(item.amount || 0), 0)} د.م.</span>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={handleCloseInvoiceModal}>إلغاء</button>
                <button type="submit" className="btn btn-primary">حفظ الفاتورة</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* نافذة سداد دفعة فاتورة */}
      {isPaymentModalOpen && activePaymentInvoice && (() => {
        const student = students.find(s => s.id === activePaymentInvoice.student_id);
        const remaining = activePaymentInvoice.total_amount - activePaymentInvoice.paid_amount;
        
        return (
          <div className="modal-overlay no-print">
            <div className="modal-content">
              <div className="modal-header">
                <h3 className="modal-title">تسجيل دفعة سداد مالية</h3>
                <button className="modal-close-btn" onClick={handleClosePaymentModal}>
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmitPayment}>
                <div className="modal-body">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px', backgroundColor: 'var(--bg-main)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                    <div><strong>الفاتورة:</strong> INV-{activePaymentInvoice.id.substring(0, 8).toUpperCase()}</div>
                    <div><strong>التلميذ:</strong> {student?.name}</div>
                    <div><strong>المبلغ الكلي للفاتورة:</strong> {activePaymentInvoice.total_amount} د.م.</div>
                    <div><strong>المبلغ المدفوع سابقاً:</strong> {activePaymentInvoice.paid_amount} د.م.</div>
                    <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '8px', fontWeight: 'bold', color: 'var(--color-danger)' }}>
                      <strong>المبلغ المتبقي غير المسدد:</strong> {remaining} د.م.
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">مبلغ الدفعة الحالية (بالدرهم) *</label>
                    <input
                      type="number"
                      className="form-input"
                      required
                      min="1"
                      max={remaining}
                      value={paymentAmountInput}
                      onChange={(e) => setPaymentAmountInput(Number(e.target.value))}
                    />
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-outline" onClick={handleClosePaymentModal}>إلغاء</button>
                  <button type="submit" className="btn btn-primary">تأكيد سداد الدفعة</button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  UserPlus, 
  Activity, 
  ShieldAlert, 
  Power, 
  Plus, 
  Mail, 
  Lock, 
  User,
  LogOut,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Edit,
  Trash2
} from 'lucide-react';
import { 
  supabase, 
  isSupabaseConfigured, 
  getAssociations, 
  saveAssociation, 
  deleteAssociation,
  adminCreateUser, 
  adminUpdateUser,
  mockLogout,
  type Association,
  type Profile 
} from '../lib/db';

interface SuperAdminPanelProps {
  currentProfile: Profile;
  onLogout: () => void;
}

export function SuperAdminPanel({ currentProfile, onLogout }: SuperAdminPanelProps) {
  const [associations, setAssociations] = useState<Association[]>([]);
  const [managers, setManagers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [students, setStudents] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);

  // حقول إضافة وتعديل المراكز
  const [editingAssoc, setEditingAssoc] = useState<Association | null>(null);
  const [assocName, setAssocName] = useState('');
  const [managerName, setManagerName] = useState('');
  const [managerEmail, setManagerEmail] = useState('');
  const [managerPassword, setManagerPassword] = useState('');
  const [accountType, setAccountType] = useState<'unlimited' | 'trial'>('unlimited');
  const [trialDays, setTrialDays] = useState('30');

  const loadData = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const fetchedAssocs = await getAssociations();
      setAssociations(fetchedAssocs);

      // جلب المدراء
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('role', 'association_admin');
        if (error) throw error;
        setManagers(data || []);

        // جلب الإحصائيات سحابياً لكل الجداول لجمع الإحصائيات
        const [studentsRes, teachersRes, groupsRes, enrollmentsRes] = await Promise.all([
          supabase.from('students').select('association_id'),
          supabase.from('teachers').select('association_id'),
          supabase.from('groups').select('association_id'),
          supabase.from('enrollments').select('association_id, paid_amount')
        ]);
        setStudents(studentsRes.data || []);
        setTeachers(teachersRes.data || []);
        setGroups(groupsRes.data || []);
        setEnrollments(enrollmentsRes.data || []);
      } else {
        const localProfiles = localStorage.getItem('quran_profiles');
        setManagers(localProfiles ? JSON.parse(localProfiles) : []);

        // جلب الإحصائيات محلياً
        setStudents(JSON.parse(localStorage.getItem('quran_students') || '[]'));
        setTeachers(JSON.parse(localStorage.getItem('quran_teachers') || '[]'));
        setGroups(JSON.parse(localStorage.getItem('quran_groups') || '[]'));
        setEnrollments(JSON.parse(localStorage.getItem('quran_enrollments') || '[]'));
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg('حدث خطأ أثناء تحميل البيانات من الخادم.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (editingAssoc) {
      // وضع التعديل (Update Mode)
      if (!assocName || !managerName || !managerEmail) {
        setErrorMsg('يرجى ملء جميع الحقول المطلوبة لتحديث البيانات.');
        return;
      }

      setSubmitting(true);
      try {
        let trialEndsAt: string | null = null;
        if (accountType === 'trial') {
          const end = new Date();
          end.setDate(end.getDate() + parseInt(trialDays || '30'));
          trialEndsAt = end.toISOString();
        }

        // 1. تحديث بيانات المركز والاشتراك التجريبي
        await saveAssociation({
          ...editingAssoc,
          name: assocName.trim(),
          trial_ends_at: trialEndsAt
        });

        // 2. تحديث حساب المدير
        const manager = managers.find(m => m.association_id === editingAssoc.id);
        if (manager) {
          await adminUpdateUser(
            manager.id,
            managerEmail.trim(),
            managerPassword ? managerPassword : undefined,
            managerName.trim()
          );
        } else {
          // حساب المدير غير متوفر، ننشئ حساباً جديداً
          await adminCreateUser(
            managerEmail.trim(),
            managerPassword || '123456',
            managerName.trim(),
            editingAssoc.id
          );
        }

        setSuccessMsg(`تم تحديث بيانات مركز "${assocName}" والحساب المرتبط بها بنجاح.`);
        handleCancelEdit();
        await loadData();
      } catch (err: any) {
        console.error(err);
        setErrorMsg(err.message || 'فشل تحديث البيانات. يرجى التحقق من المدخلات.');
      } finally {
        setSubmitting(false);
      }
    } else {
      // وضع الإضافة الجديد (Create Mode)
      if (!assocName || !managerName || !managerEmail || !managerPassword) {
        setErrorMsg('يرجى ملء جميع الحقول المطلوبة لإنشاء المركز والمسؤول.');
        return;
      }
      if (managerPassword.length < 6) {
        setErrorMsg('يجب أن تكون كلمة المرور 6 أحرف على الأعل.');
        return;
      }

      setSubmitting(true);
      try {
        let trialEndsAt: string | null = null;
        if (accountType === 'trial') {
          const end = new Date();
          end.setDate(end.getDate() + parseInt(trialDays || '30'));
          trialEndsAt = end.toISOString();
        }

        // 1. إنشاء المركز أولاً
        const newAssoc = await saveAssociation({
          name: assocName.trim(),
          status: 'active',
          trial_ends_at: trialEndsAt
        });

        // 2. إنشاء المستخدم وربطه بالمركز
        await adminCreateUser(
          managerEmail.trim(),
          managerPassword,
          managerName.trim(),
          newAssoc.id
        );

        setSuccessMsg(`تم إنشاء مركز "${assocName}" بنجاح، وتم إنشاء حساب المدير الخاص بها.`);
        
        // تفريغ الحقول
        setAssocName('');
        setManagerName('');
        setManagerEmail('');
        setManagerPassword('');
        setAccountType('unlimited');
        setTrialDays('30');
        
        // إعادة تحميل البيانات
        await loadData();
      } catch (err: any) {
        console.error(err);
        setErrorMsg(err.message || 'فشل إنشاء المركز أو حساب المدير. يرجى التحقق من المدخلات.');
      } finally {
        setSubmitting(false);
      }
    }
  };

  const handleStartEdit = (assoc: Association) => {
    setEditingAssoc(assoc);
    setAssocName(assoc.name);
    
    // إدخال تفاصيل الاشتراك
    if (assoc.trial_ends_at) {
      setAccountType('trial');
      const endDate = new Date(assoc.trial_ends_at);
      const now = new Date();
      const diffTime = endDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setTrialDays(diffDays > 0 ? diffDays.toString() : '30');
    } else {
      setAccountType('unlimited');
      setTrialDays('30');
    }

    const manager = managers.find(m => m.association_id === assoc.id);
    if (manager) {
      setManagerName(manager.name);
      setManagerEmail(manager.email);
    } else {
      setManagerName('');
      setManagerEmail('');
    }
    setManagerPassword(''); // نترك الرقم السري فارغاً حتى يكتب رقماً جديداً إن أراد التعديل
  };

  const handleCancelEdit = () => {
    setEditingAssoc(null);
    setAssocName('');
    setManagerName('');
    setManagerEmail('');
    setManagerPassword('');
    setAccountType('unlimited');
    setTrialDays('30');
  };

  const handleToggleStatus = async (assoc: Association) => {
    const newStatus = assoc.status === 'active' ? 'suspended' : 'active';
    const confirmMsg = assoc.status === 'active' 
      ? `هل أنت متأكد من تعليق (تعطيل) حساب مركز "${assoc.name}"؟ لن يتمكن مديروها من الدخول.`
      : `هل تريد تنشيط حساب مركز "${assoc.name}" مجدداً؟`;

    if (!window.confirm(confirmMsg)) return;

    try {
      await saveAssociation({
        ...assoc,
        status: newStatus
      });
      await loadData();
    } catch (err: any) {
      console.error(err);
      alert('فشل تغيير حالة المركز.');
    }
  };

  const handleDeleteAssociation = async (assoc: Association) => {
    const confirmMsg = `⚠️ هل أنت متأكد تماماً من حذف مركز "${assoc.name}" بشكل نهائي؟\n\n` +
      `سيؤدي هذا الإجراء إلى حذف كافة بيانات الأفواج، التلاميذ، الأساتذة، المصاريف، والاشتراكات التابعة لها، بالإضافة إلى حذف حساب المدير المسؤول عنها تماماً.\n\n` +
      `لا يمكن التراجع عن هذا الإجراء!`;

    if (!window.confirm(confirmMsg)) return;

    // تأكيد أمني بكتابة الاسم للتحقق
    const nameInput = window.prompt(`لتأكيد الحذف النهائي، يرجى كتابة اسم المركز بالضبط ("${assoc.name}"):`);
    if (nameInput !== assoc.name) {
      alert('الاسم غير متطابق. تم إلغاء عملية الحذف.');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg(null);
      setSuccessMsg(null);
      await deleteAssociation(assoc.id);
      setSuccessMsg(`تم حذف مركز "${assoc.name}" وكافة بياناتها وحساباتها بنجاح.`);
      if (editingAssoc?.id === assoc.id) {
        handleCancelEdit();
      }
      await loadData();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'فشل حذف المركز. يرجى مراجعة إعدادات قاعدة البيانات.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoutClick = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    } else {
      mockLogout();
    }
    onLogout();
  };

  const renderTrialStatus = (trialEndsAt?: string | null) => {
    if (!trialEndsAt) {
      return <span style={{ ...styles.trialBadge, backgroundColor: '#e0f2fe', color: '#0369a1' }}>حساب مفتوح</span>;
    }
    const endDate = new Date(trialEndsAt);
    const now = new Date();
    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 0) {
      return <span style={{ ...styles.trialBadge, backgroundColor: '#ffedd5', color: '#ea580c' }}>تجريبي (باقي {diffDays} يوم)</span>;
    } else {
      return <span style={{ ...styles.trialBadge, backgroundColor: '#fee2e2', color: '#dc2626' }}>منتهية التجربة ({Math.abs(diffDays)} يوم مضت)</span>;
    }
  };

  const activeCount = associations.filter(a => a.status === 'active').length;
  const suspendedCount = associations.filter(a => a.status === 'suspended').length;

  return (
    <div style={styles.container}>
      {/* الشريط العلوي */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.userBadge}>
            <span style={styles.userRole}>المطور (Super Admin)</span>
            <span style={styles.userName}>{currentProfile.name}</span>
          </div>
          <button onClick={handleLogoutClick} style={styles.logoutBtn}>
            <LogOut size={16} />
            <span>تسجيل الخروج</span>
          </button>
        </div>
        <div style={styles.headerRight}>
          <h1 style={styles.headerTitle}>لوحة إدارة المنصة والمراكز</h1>
          <p style={styles.headerSubtitle}>إضافة المراكز وتعديل بياناتها والتحكم في صلاحيات وفترات التجربة</p>
        </div>
      </header>

      {/* لوحة المؤشرات الإحصائية العامة */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={{ ...styles.statIconWrapper, backgroundColor: '#f0fdfa', color: '#0d9488' }}>
            <Building2 size={24} />
          </div>
          <div>
            <div style={styles.statLabel}>إجمالي المراكز</div>
            <div style={styles.statValue}>{associations.length}</div>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={{ ...styles.statIconWrapper, backgroundColor: '#f0fdf4', color: '#16a34a' }}>
            <Activity size={24} />
          </div>
          <div>
            <div style={styles.statLabel}>المراكز النشطة</div>
            <div style={styles.statValue}>{activeCount}</div>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={{ ...styles.statIconWrapper, backgroundColor: '#fef2f2', color: '#dc2626' }}>
            <ShieldAlert size={24} />
          </div>
          <div>
            <div style={styles.statLabel}>المراكز المعطلة</div>
            <div style={styles.statValue}>{suspendedCount}</div>
          </div>
        </div>
      </div>

      <div style={styles.mainGrid}>
        {/* قسم إضافة أو تعديل مركز جديدة */}
        <section style={styles.formSection}>
          <div style={styles.sectionHeader}>
            <UserPlus size={20} style={{ color: '#0d9488' }} />
            <h2 style={styles.sectionTitle}>
              {editingAssoc ? `تعديل بيانات: ${editingAssoc.name}` : 'تسجيل مركز ومدير جديد'}
            </h2>
          </div>

          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>اسم المركز</label>
              <input
                type="text"
                placeholder="مثال: أكاديمية أيبكس للدعم الدراسي"
                value={assocName}
                onChange={(e) => setAssocName(e.target.value)}
                style={styles.input}
                required
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>نوع الاشتراك</label>
              <select
                value={accountType}
                onChange={(e) => setAccountType(e.target.value as 'unlimited' | 'trial')}
                style={styles.input}
              >
                <option value="unlimited">غير محدود (حساب مفتوح)</option>
                <option value="trial">تجريبي (مؤقت بالأيام)</option>
              </select>
            </div>

            {accountType === 'trial' && (
              <div style={styles.inputGroup}>
                <label style={styles.label}>
                  {editingAssoc ? 'أيام التجربة المتبقية' : 'عدد أيام التجربة'}
                </label>
                <input
                  type="number"
                  min="1"
                  placeholder="30"
                  value={trialDays}
                  onChange={(e) => setTrialDays(e.target.value)}
                  style={styles.input}
                  required
                />
              </div>
            )}

            <div style={styles.divider}>بيانات حساب المدير (المسؤول)</div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>اسم المدير الكامل</label>
              <div style={styles.inputWrapper}>
                <User size={16} style={styles.inputIcon} />
                <input
                  type="text"
                  placeholder="الاسم الثلاثي للمدير"
                  value={managerName}
                  onChange={(e) => setManagerName(e.target.value)}
                  style={styles.inputWithIcon}
                  required
                />
              </div>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>البريد الإلكتروني للدخول</label>
              <div style={styles.inputWrapper}>
                <Mail size={16} style={styles.inputIcon} />
                <input
                  type="email"
                  placeholder="manager@association.com"
                  value={managerEmail}
                  onChange={(e) => setManagerEmail(e.target.value)}
                  style={styles.inputWithIcon}
                  required
                />
              </div>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>
                {editingAssoc ? 'كلمة المرور الجديدة (اختياري)' : 'كلمة المرور الافتراضية'}
              </label>
              <div style={styles.inputWrapper}>
                <Lock size={16} style={styles.inputIcon} />
                <input
                  type="password"
                  placeholder={editingAssoc ? 'اتركها فارغة لعدم التعديل' : 'كلمة المرور (6 أحرف فأكثر)'}
                  value={managerPassword}
                  onChange={(e) => setManagerPassword(e.target.value)}
                  style={styles.inputWithIcon}
                  required={!editingAssoc}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
              <button type="submit" disabled={submitting} style={{ ...styles.submitBtn, flex: 1, marginTop: 0 }}>
                {submitting ? (
                  <>
                    <RefreshCw size={16} className="spin-animation" style={{ animation: 'spin 1s linear infinite' }} />
                    <span>جاري الحفظ...</span>
                  </>
                ) : (
                  <>
                    {editingAssoc ? <CheckCircle2 size={18} /> : <Plus size={18} />}
                    <span>{editingAssoc ? 'حفظ التحديثات' : 'تأكيد وتسجيل المركز'}</span>
                  </>
                )}
              </button>
              
              {editingAssoc && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  style={{
                    ...styles.actionBtn,
                    backgroundColor: '#f1f5f9',
                    color: '#475569',
                    padding: '12px 20px',
                    borderRadius: '8px',
                    fontSize: '0.95rem',
                    fontWeight: '700',
                  }}
                >
                  إلغاء
                </button>
              )}
            </div>
          </form>
        </section>

        {/* قسم استعراض وإدارة المراكز */}
        <section style={styles.tableSection}>
          <div style={styles.sectionHeader}>
            <Building2 size={20} style={{ color: '#0d9488' }} />
            <h2 style={styles.sectionTitle}>قائمة المراكز المسجلة بالمنصة</h2>
          </div>

          {successMsg && (
            <div style={styles.successBanner}>
              <CheckCircle2 size={18} />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div style={styles.errorBanner}>
              <AlertCircle size={18} />
              <span>{errorMsg}</span>
            </div>
          )}

          {loading ? (
            <div style={styles.tableLoader}>
              <RefreshCw size={30} className="spin-animation" style={{ color: '#0d9488', animation: 'spin 1s linear infinite' }} />
              <p>جاري تحميل قائمة المراكز الحالية...</p>
            </div>
          ) : associations.length === 0 ? (
            <div style={styles.emptyState}>
              <p>لا توجد مراكز مسجلة حالياً بالمنصة. يرجى تسجيل أول مركز.</p>
            </div>
          ) : (
            <div style={styles.cardsGrid}>
              {associations.map((assoc) => {
                const manager = managers.find(m => m.association_id === assoc.id);
                const isCurrentEditing = editingAssoc?.id === assoc.id;
                
                // حساب الإحصائيات الحالية لهذه المركز
                const studentCount = students.filter(s => s.association_id === assoc.id).length;
                const teacherCount = teachers.filter(t => t.association_id === assoc.id).length;
                const groupCount = groups.filter(g => g.association_id === assoc.id).length;
                const totalIncome = enrollments
                  .filter(e => e.association_id === assoc.id)
                  .reduce((sum, e) => sum + Number(e.paid_amount || 0), 0);

                return (
                  <div 
                    key={assoc.id} 
                    className="super-admin-assoc-card"
                    style={{
                      ...styles.assocCard,
                      border: isCurrentEditing ? '2px solid var(--primary-green)' : '1px solid var(--border-color)',
                      boxShadow: isCurrentEditing ? 'var(--shadow-lg)' : 'var(--shadow-sm)'
                    }}
                  >
                    {/* رأس الكرت */}
                    <div style={styles.cardHeader}>
                      <div style={styles.cardTitleSection}>
                        <Building2 size={20} style={{ color: 'var(--primary-green)' }} />
                        <h3 style={styles.cardTitle}>{assoc.name}</h3>
                      </div>
                      <span
                        style={{
                          ...styles.statusBadge,
                          backgroundColor: assoc.status === 'active' ? '#dcfce7' : '#fee2e2',
                          color: assoc.status === 'active' ? '#16a34a' : '#dc2626',
                        }}
                      >
                        {assoc.status === 'active' ? 'نشط' : 'معطل'}
                      </span>
                    </div>

                    {/* تفاصيل الاشتراك */}
                    <div style={styles.cardSubscription}>
                      {renderTrialStatus(assoc.trial_ends_at)}
                    </div>

                    {/* بيانات المدير المسؤول */}
                    <div style={styles.cardManagerSection}>
                      <span style={styles.sectionLabel}>المدير المسؤول:</span>
                      {manager ? (
                        <div style={styles.managerInfo}>
                          <div style={styles.managerName}>{manager.name}</div>
                          <div style={styles.managerEmail}>
                            <Mail size={12} style={{ marginLeft: '4px', verticalAlign: 'middle' }} />
                            <span>{manager.email}</span>
                          </div>
                        </div>
                      ) : (
                        <div style={styles.noManager}>
                          <ShieldAlert size={14} style={{ marginLeft: '4px' }} />
                          <span>معلق (بدون حساب فعال)</span>
                        </div>
                      )}
                    </div>

                    {/* الإحصائيات الخاصة بالمركز */}
                    <div style={styles.cardStatsSection}>
                      <div style={styles.statItem}>
                        <span style={styles.cardStatLabel}>تلاميذ</span>
                        <span style={styles.cardStatValue}>{studentCount}</span>
                      </div>
                      <div style={styles.statItem}>
                        <span style={styles.cardStatLabel}>أساتذة</span>
                        <span style={styles.cardStatValue}>{teacherCount}</span>
                      </div>
                      <div style={styles.statItem}>
                        <span style={styles.cardStatLabel}>أفواج</span>
                        <span style={styles.cardStatValue}>{groupCount}</span>
                      </div>
                      <div style={styles.statItem}>
                        <span style={styles.cardStatLabel}>مداخيل</span>
                        <span style={styles.cardStatValue}>{totalIncome} <span style={{ fontSize: '0.65rem' }}>د.م</span></span>
                      </div>
                    </div>

                    {/* أزرار التحكم */}
                    <div style={styles.cardActions}>
                      <button
                        onClick={() => handleStartEdit(assoc)}
                        style={{
                          ...styles.cardActionBtn,
                          backgroundColor: '#f1f5f9',
                          color: '#475569',
                        }}
                        title="تعديل اسم المركز وحساب المدير والاشتراك"
                      >
                        <Edit size={12} />
                        <span>تعديل</span>
                      </button>

                      <button
                        onClick={() => handleToggleStatus(assoc)}
                        style={{
                          ...styles.cardActionBtn,
                          backgroundColor: assoc.status === 'active' ? '#fee2e2' : '#dcfce7',
                          color: assoc.status === 'active' ? '#dc2626' : '#16a34a',
                        }}
                        title={assoc.status === 'active' ? 'تعطيل الحساب' : 'تفعيل الحساب'}
                      >
                        <Power size={12} />
                        <span>{assoc.status === 'active' ? 'تعطيل' : 'تنشيط'}</span>
                      </button>

                      <button
                        onClick={() => handleDeleteAssociation(assoc)}
                        style={{
                          ...styles.cardActionBtn,
                          backgroundColor: '#fef2f2',
                          color: '#dc2626',
                          marginRight: 'auto'
                        }}
                        title="حذف المركز نهائياً مع كافة حساباتها وبياناتها"
                      >
                        <Trash2 size={12} />
                        <span>حذف</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .spin-animation {
          display: inline-block;
        }
        .super-admin-table-row:hover {
          background-color: #f8fafc !important;
        }
      `}</style>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    padding: '32px',
    maxWidth: '1280px',
    margin: '0 auto',
    direction: 'rtl',
    fontFamily: 'Cairo, sans-serif',
    display: 'flex',
    flexDirection: 'column',
    gap: '32px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: '24px',
    borderBottom: '1px solid #e2e8f0',
    flexWrap: 'wrap',
    gap: '16px',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  userBadge: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    backgroundColor: '#ffffff',
    padding: '8px 16px',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
  },
  userRole: {
    fontSize: '0.7rem',
    color: '#0d9488',
    fontWeight: 'bold',
  },
  userName: {
    fontSize: '0.9rem',
    fontWeight: '700',
    color: '#0f172a',
  },
  logoutBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#f1f5f9',
    color: '#475569',
    border: 'none',
    padding: '10px 16px',
    borderRadius: '8px',
    fontSize: '0.88rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  headerRight: {
    textAlign: 'right',
  },
  headerTitle: {
    fontSize: '1.6rem',
    fontWeight: '800',
    color: '#0f766e',
    margin: 0,
  },
  headerSubtitle: {
    fontSize: '0.88rem',
    color: '#64748b',
    margin: '4px 0 0 0',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '24px',
  },
  statCard: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '24px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 1px 3px 0 rgba(0,0,0,0.05)',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  statIconWrapper: {
    width: '48px',
    height: '48px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statLabel: {
    fontSize: '0.85rem',
    color: '#64748b',
    fontWeight: '600',
  },
  statValue: {
    fontSize: '1.8rem',
    fontWeight: '800',
    color: '#0f172a',
    marginTop: '4px',
  },
  mainGrid: {
    display: 'grid',
    gridTemplateColumns: '380px 1fr',
    gap: '32px',
  },
  formSection: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '24px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 1px 3px 0 rgba(0,0,0,0.05)',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    height: 'fit-content',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    borderBottom: '2px solid #f0fdfa',
    paddingBottom: '12px',
  },
  sectionTitle: {
    fontSize: '1.05rem',
    fontWeight: '700',
    color: '#0f172a',
    margin: 0,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  divider: {
    fontSize: '0.78rem',
    fontWeight: 'bold',
    color: '#0d9488',
    backgroundColor: '#f0fdfa',
    padding: '6px 12px',
    borderRadius: '4px',
    marginTop: '8px',
    textAlign: 'center',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '0.85rem',
    fontWeight: '600',
    color: '#334155',
  },
  input: {
    width: '100%',
    padding: '10px 14px',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    fontSize: '0.9rem',
    color: '#0f172a',
    backgroundColor: '#ffffff',
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    right: '12px',
    color: '#94a3b8',
  },
  inputWithIcon: {
    width: '100%',
    padding: '10px 36px 10px 12px',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    fontSize: '0.9rem',
    color: '#0f172a',
  },
  submitBtn: {
    marginTop: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '12px',
    backgroundColor: '#0d9488',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '0.95rem',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  tableSection: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '24px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 1px 3px 0 rgba(0,0,0,0.05)',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  successBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    backgroundColor: '#f0fdf4',
    color: '#16a34a',
    padding: '12px 16px',
    borderRadius: '8px',
    border: '1px solid #bbf7d0',
    fontSize: '0.85rem',
    fontWeight: '600',
  },
  errorBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    backgroundColor: '#fef2f2',
    color: '#dc2626',
    padding: '12px 16px',
    borderRadius: '8px',
    border: '1px solid #fecaca',
    fontSize: '0.85rem',
    fontWeight: '600',
  },
  tableLoader: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 0',
    gap: '16px',
    color: '#64748b',
    fontSize: '0.9rem',
  },
  emptyState: {
    padding: '60px 0',
    textAlign: 'center',
    color: '#64748b',
    fontSize: '0.9rem',
  },
  tableContainer: {
    overflowX: 'auto',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'right',
  },
  tableRowHead: {
    backgroundColor: '#f8fafc',
    borderBottom: '1px solid #e2e8f0',
  },
  tableTh: {
    padding: '12px 16px',
    fontSize: '0.8rem',
    color: '#64748b',
    fontWeight: '700',
  },
  tableRow: {
    borderBottom: '1px solid #f1f5f9',
    transition: 'background-color 0.2s',
  },
  tableTd: {
    padding: '16px',
    fontSize: '0.88rem',
    color: '#334155',
    verticalAlign: 'middle',
  },
  assocNameWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  assocNameText: {
    fontWeight: '700',
    color: '#0f172a',
  },
  statusBadge: {
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '0.75rem',
    fontWeight: '700',
    display: 'inline-block',
  },
  trialBadge: {
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '0.7rem',
    fontWeight: '700',
    display: 'inline-block',
  },
  actionBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '0.75rem',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  cardsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '24px',
    marginTop: '16px',
  },
  assocCard: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    transition: 'all 0.3s ease',
    position: 'relative',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
    borderBottom: '1px solid #f1f5f9',
    paddingBottom: '12px',
  },
  cardTitleSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  cardTitle: {
    fontSize: '1.05rem',
    fontWeight: '800',
    color: '#0f172a',
    margin: 0,
  },
  cardSubscription: {
    marginTop: '-4px',
  },
  cardManagerSection: {
    backgroundColor: '#f8fafc',
    borderRadius: '8px',
    padding: '12px',
    fontSize: '0.8rem',
    border: '1px solid #f1f5f9',
  },
  sectionLabel: {
    display: 'block',
    fontSize: '0.75rem',
    fontWeight: '700',
    color: '#64748b',
    marginBottom: '6px',
  },
  managerInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  managerName: {
    fontWeight: '700',
    color: '#334155',
    fontSize: '0.85rem',
  },
  managerEmail: {
    color: '#64748b',
    fontSize: '0.75rem',
    display: 'flex',
    alignItems: 'center',
  },
  noManager: {
    color: '#ef4444',
    fontWeight: 'bold',
    fontSize: '0.8rem',
    display: 'flex',
    alignItems: 'center',
  },
  cardStatsSection: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: '8px',
    padding: '12px 16px',
    margin: '8px 0',
    border: '1px dashed #e2e8f0',
  },
  statItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2px',
    flex: 1,
  },
  cardStatValue: {
    fontSize: '0.95rem',
    fontWeight: '800',
    color: '#0f172a',
  },
  cardStatLabel: {
    fontSize: '0.75rem',
    color: '#64748b',
    fontWeight: '700',
  },
  cardActions: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
    borderTop: '1px solid #f1f5f9',
    paddingTop: '16px',
    marginTop: 'auto',
  },
  cardActionBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    border: 'none',
    padding: '6px 10px',
    borderRadius: '6px',
    fontSize: '0.7rem',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
};

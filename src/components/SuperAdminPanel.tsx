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
  AlertCircle
} from 'lucide-react';
import { 
  supabase, 
  isSupabaseConfigured, 
  getAssociations, 
  saveAssociation, 
  adminCreateUser, 
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

  // حقول إضافة جمعية جديدة
  const [assocName, setAssocName] = useState('');
  const [managerName, setManagerName] = useState('');
  const [managerEmail, setManagerEmail] = useState('');
  const [managerPassword, setManagerPassword] = useState('');

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
      } else {
        const localProfiles = localStorage.getItem('quran_profiles');
        setManagers(localProfiles ? JSON.parse(localProfiles) : []);
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

  const handleCreateAssociation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assocName || !managerName || !managerEmail || !managerPassword) {
      setErrorMsg('يرجى ملء جميع الحقول المطلوبة لإنشاء الجمعية والمسؤول.');
      return;
    }
    if (managerPassword.length < 6) {
      setErrorMsg('يجب أن تكون كلمة المرور 6 أحرف على الأقل.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      // 1. إنشاء الجمعية أولاً
      const newAssoc = await saveAssociation({
        name: assocName.trim(),
        status: 'active'
      });

      // 2. إنشاء المستخدم وربطه بالجمعية
      await adminCreateUser(
        managerEmail.trim(),
        managerPassword,
        managerName.trim(),
        newAssoc.id
      );

      setSuccessMsg(`تم إنشاء جمعية "${assocName}" بنجاح، وتم إنشاء حساب المدير الخاص بها.`);
      
      // تفريغ الحقول
      setAssocName('');
      setManagerName('');
      setManagerEmail('');
      setManagerPassword('');
      
      // إعادة تحميل البيانات
      await loadData();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'فشل إنشاء الجمعية أو حساب المدير. يرجى التحقق من المدخلات.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (assoc: Association) => {
    const newStatus = assoc.status === 'active' ? 'suspended' : 'active';
    const confirmMsg = assoc.status === 'active' 
      ? `هل أنت متأكد من تعليق (تعطيل) حساب جمعية "${assoc.name}"؟ لن يتمكن مديروها من الدخول.`
      : `هل تريد تنشيط حساب جمعية "${assoc.name}" مجدداً؟`;

    if (!window.confirm(confirmMsg)) return;

    try {
      await saveAssociation({
        ...assoc,
        status: newStatus
      });
      await loadData();
    } catch (err: any) {
      console.error(err);
      alert('فشل تغيير حالة الجمعية.');
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
          <h1 style={styles.headerTitle}>لوحة إدارة المنصة والجمعيات</h1>
          <p style={styles.headerSubtitle}>إضافة الجمعيات والتحكم في صلاحيات الوصول للأنظمة</p>
        </div>
      </header>

      {/* لوحة المؤشرات الإحصائية العامة */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={{ ...styles.statIconWrapper, backgroundColor: '#f0fdfa', color: '#0d9488' }}>
            <Building2 size={24} />
          </div>
          <div>
            <div style={styles.statLabel}>إجمالي الجمعيات</div>
            <div style={styles.statValue}>{associations.length}</div>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={{ ...styles.statIconWrapper, backgroundColor: '#f0fdf4', color: '#16a34a' }}>
            <Activity size={24} />
          </div>
          <div>
            <div style={styles.statLabel}>الجمعيات النشطة</div>
            <div style={styles.statValue}>{activeCount}</div>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={{ ...styles.statIconWrapper, backgroundColor: '#fef2f2', color: '#dc2626' }}>
            <ShieldAlert size={24} />
          </div>
          <div>
            <div style={styles.statLabel}>الجمعيات المعطلة</div>
            <div style={styles.statValue}>{suspendedCount}</div>
          </div>
        </div>
      </div>

      <div style={styles.mainGrid}>
        {/* قسم إضافة جمعية جديدة */}
        <section style={styles.formSection}>
          <div style={styles.sectionHeader}>
            <UserPlus size={20} style={{ color: '#0d9488' }} />
            <h2 style={styles.sectionTitle}>تسجيل جمعية ومدير جديد</h2>
          </div>

          <form onSubmit={handleCreateAssociation} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>اسم الجمعية</label>
              <input
                type="text"
                placeholder="مثال: جمعية الفرقان لتحفيظ القرآن"
                value={assocName}
                onChange={(e) => setAssocName(e.target.value)}
                style={styles.input}
                required
              />
            </div>

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
              <label style={styles.label}>كلمة المرور الافتراضية</label>
              <div style={styles.inputWrapper}>
                <Lock size={16} style={styles.inputIcon} />
                <input
                  type="password"
                  placeholder="كلمة المرور (6 أحرف فأكثر)"
                  value={managerPassword}
                  onChange={(e) => setManagerPassword(e.target.value)}
                  style={styles.inputWithIcon}
                  required
                />
              </div>
            </div>

            <button type="submit" disabled={submitting} style={styles.submitBtn}>
              {submitting ? (
                <>
                  <RefreshCw size={16} className="spin-animation" style={{ animation: 'spin 1s linear infinite' }} />
                  <span>جاري إنشاء الحسابات...</span>
                </>
              ) : (
                <>
                  <Plus size={18} />
                  <span>تأكيد وتسجيل الجمعية</span>
                </>
              )}
            </button>
          </form>
        </section>

        {/* قسم استعراض وإدارة الجمعيات */}
        <section style={styles.tableSection}>
          <div style={styles.sectionHeader}>
            <Building2 size={20} style={{ color: '#0d9488' }} />
            <h2 style={styles.sectionTitle}>قائمة الجمعيات المسجلة بالمنصة</h2>
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
              <p>جاري تحميل قائمة الجمعيات الحالية...</p>
            </div>
          ) : associations.length === 0 ? (
            <div style={styles.emptyState}>
              <p>لا توجد جمعيات مسجلة حالياً بالمنصة. يرجى تسجيل أول جمعية.</p>
            </div>
          ) : (
            <div style={styles.tableContainer}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.tableRowHead}>
                    <th style={styles.tableTh}>اسم الجمعية</th>
                    <th style={styles.tableTh}>المدير المسؤول</th>
                    <th style={styles.tableTh}>حالة الحساب</th>
                    <th style={styles.tableTh}>إجراءات التحكم</th>
                  </tr>
                </thead>
                <tbody>
                  {associations.map((assoc) => {
                    const manager = managers.find(m => m.association_id === assoc.id);
                    return (
                      <tr key={assoc.id} className="super-admin-table-row" style={styles.tableRow}>
                        <td style={styles.tableTd}>
                          <div style={styles.assocNameWrapper}>
                            <Building2 size={16} style={{ color: '#64748b' }} />
                            <span style={styles.assocNameText}>{assoc.name}</span>
                          </div>
                        </td>
                        <td style={styles.tableTd}>
                          {manager ? (
                            <div>
                              <div style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>{manager.name}</div>
                              <div style={{ color: '#64748b', fontSize: '0.75rem' }}>{manager.email}</div>
                            </div>
                          ) : (
                            <span style={{ color: '#ef4444', fontSize: '0.8rem', fontWeight: 'bold' }}>معلق (بدون حساب فعال)</span>
                          )}
                        </td>
                        <td style={styles.tableTd}>
                          <span
                            style={{
                              ...styles.statusBadge,
                              backgroundColor: assoc.status === 'active' ? '#dcfce7' : '#fee2e2',
                              color: assoc.status === 'active' ? '#16a34a' : '#dc2626',
                            }}
                          >
                            {assoc.status === 'active' ? 'نشط' : 'معطل'}
                          </span>
                        </td>
                        <td style={styles.tableTd}>
                          <button
                            onClick={() => handleToggleStatus(assoc)}
                            style={{
                              ...styles.actionBtn,
                              backgroundColor: assoc.status === 'active' ? '#fee2e2' : '#dcfce7',
                              color: assoc.status === 'active' ? '#dc2626' : '#16a34a',
                            }}
                            title={assoc.status === 'active' ? 'تعطيل الحساب' : 'تفعيل الحساب'}
                          >
                            <Power size={14} />
                            <span>{assoc.status === 'active' ? 'تعطيل' : 'تنشيط'}</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
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
};

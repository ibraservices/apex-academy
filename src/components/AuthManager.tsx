import React, { useState } from 'react';
import { Mail, Lock, Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { supabase, isSupabaseConfigured, mockLogin, type Profile } from '../lib/db';

interface AuthManagerProps {
  onLoginSuccess: (profile: Profile) => void;
  onBackToHome?: () => void;
}

export function AuthManager({ onLoginSuccess, onBackToHome }: AuthManagerProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage('يرجى ملء جميع الحقول المطلوبة.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      if (isSupabaseConfigured && supabase) {
        // تسجيل الدخول الحقيقي عبر Supabase Auth
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password,
        });

        if (error) {
          throw new Error('البريد الإلكتروني أو كلمة المرور غير صحيحة.');
        }

        if (data.user) {
          // جلب ملف البروفايل
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*, association:associations(name, status)')
            .eq('id', data.user.id)
            .maybeSingle();

          if (profileError) {
            await supabase.auth.signOut();
            throw profileError;
          }

          if (!profile) {
            await supabase.auth.signOut();
            throw new Error('لم يتم العثور على ملف تعريف لهذا الحساب.');
          }

          if (profile.role === 'association_admin' && profile.association && profile.association.status === 'suspended') {
            await supabase.auth.signOut();
            throw new Error('حساب الجمعية معطل حالياً. يرجى مراجعة المطور.');
          }

          onLoginSuccess(profile);
        }
      } else {
        // تسجيل الدخول الوهمي (Local Storage)
        const profile = await mockLogin(email.trim(), password);
        onLoginSuccess(profile);
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      setErrorMessage(err.message || 'حدث خطأ غير متوقع أثناء تسجيل الدخول.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper" style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.logoContainer}>
            <Sparkles size={28} style={styles.logoIcon} />
          </div>
          <h1 style={styles.title}>بوابة الدخول الموحدة</h1>
          <p style={styles.subtitle}>منصة أيبكس للدعم الدراسي وتعليم اللغات</p>
        </div>

        {errorMessage && (
          <div style={styles.alert}>
            <AlertCircle size={20} style={{ flexShrink: 0 }} />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label htmlFor="email" style={styles.label}>البريد الإلكتروني</label>
            <div style={styles.inputWrapper}>
              <Mail size={18} style={styles.inputIcon} />
              <input
                id="email"
                type="email"
                placeholder="example@alhidaya.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={styles.input}
                required
              />
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label htmlFor="password" style={styles.label}>كلمة المرور</label>
            <div style={styles.inputWrapper}>
              <Lock size={18} style={styles.inputIcon} />
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={styles.input}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.submitBtn,
              ...(loading ? styles.submitBtnDisabled : {}),
            }}
          >
            {loading ? (
              <>
                <Loader2 size={18} className="spin-animation" style={{ animation: 'spin 1s linear infinite' }} />
                <span>جاري التحقق من الحساب...</span>
              </>
            ) : (
              <span>تسجيل الدخول</span>
            )}
          </button>
        </form>

        <div style={styles.footer}>
          <p>بصفتك مديراً للمركز، احصل على بيانات دخولك من مطور المنصة.</p>
          {onBackToHome && (
            <button
              type="button"
              onClick={onBackToHome}
              style={styles.backToHomeBtn}
            >
              الرجوع للصفحة التعريفية
            </button>
          )}
          <p style={styles.devTag}>
            {!isSupabaseConfigured && '⚙️ وضع التخزين المحلي نشط للتجربة'}
          </p>
        </div>
      </div>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .spin-animation {
          display: inline-block;
        }
      `}</style>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    width: '100vw',
    position: 'fixed',
    top: 0,
    left: 0,
    backgroundColor: '#f8fafc',
    backgroundImage: 'radial-gradient(at 0% 0%, rgba(79, 70, 229, 0.05) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(14, 165, 233, 0.05) 0px, transparent 50%)',
    zIndex: 9999,
    direction: 'rtl',
    fontFamily: 'Cairo, sans-serif',
  },
  card: {
    width: '100%',
    maxWidth: '450px',
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '40px 32px',
    boxShadow: '0 10px 25px -5px rgba(79, 70, 229, 0.08), 0 8px 10px -6px rgba(14, 165, 233, 0.05)',
    border: '1px solid #e2e8f0',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  header: {
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
  },
  logoContainer: {
    width: '56px',
    height: '56px',
    background: 'linear-gradient(135deg, #4f46e5, #0ea5e9)',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#ffffff',
    boxShadow: '0 4px 10px rgba(79, 70, 229, 0.2)',
  },
  logoIcon: {
    color: '#ffffff',
  },
  title: {
    fontSize: '1.4rem',
    fontWeight: '800',
    color: '#3730a3',
    margin: 0,
  },
  subtitle: {
    fontSize: '0.85rem',
    color: '#64748b',
    margin: 0,
    lineHeight: '1.5',
  },
  alert: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    backgroundColor: '#fef2f2',
    color: '#ef4444',
    padding: '12px 16px',
    borderRadius: '8px',
    border: '1px solid #fecaca',
    fontSize: '0.85rem',
    fontWeight: '600',
    lineHeight: '1.4',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontSize: '0.88rem',
    fontWeight: '600',
    color: '#334155',
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
    pointerEvents: 'none',
  },
  input: {
    width: '100%',
    padding: '12px 42px 12px 16px',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    fontSize: '0.95rem',
    color: '#0f172a',
    backgroundColor: '#ffffff',
    transition: 'all 0.2s',
  },
  submitBtn: {
    width: '100%',
    padding: '14px',
    backgroundColor: '#4f46e5',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1rem',
    fontWeight: '700',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    boxShadow: '0 4px 6px -1px rgba(79, 70, 229, 0.1), 0 2px 4px -1px rgba(79, 70, 229, 0.06)',
    transition: 'all 0.2s',
  },
  submitBtnDisabled: {
    backgroundColor: '#94a3b8',
    cursor: 'not-allowed',
  },
  footer: {
    textAlign: 'center',
    borderTop: '1px solid #e2e8f0',
    paddingTop: '16px',
    fontSize: '0.75rem',
    color: '#64748b',
    lineHeight: '1.5',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  devTag: {
    color: '#0284c7',
    fontWeight: 'bold',
    margin: 0,
  },
  backToHomeBtn: {
    background: 'none',
    border: 'none',
    color: '#4f46e5',
    cursor: 'pointer',
    fontFamily: 'Cairo, sans-serif',
    fontSize: '0.85rem',
    fontWeight: '700',
    marginTop: '6px',
    textDecoration: 'underline',
    transition: 'color 0.2s',
  },
};

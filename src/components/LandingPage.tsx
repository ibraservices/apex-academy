import { useState } from 'react';
import { 
  Sparkles, 
  Users, 
  Layers, 
  GraduationCap, 
  Wallet, 
  Printer, 
  MessageCircle, 
  Mail,
  CheckCircle,
  Menu,
  X
} from 'lucide-react';

interface LandingPageProps {
  onOpenLogin: () => void;
}

export function LandingPage({ onOpenLogin }: LandingPageProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="landing-container" style={styles.container}>
      {/* رأس الصفحة / الناف بار */}
      <header style={styles.header}>
        <div className="landing-header-content" style={styles.headerContent}>
          <div style={styles.logo}>
            <div style={styles.logoIconWrapper}>
              <Sparkles size={22} />
            </div>
            <span style={styles.logoText}>أكاديمية أيبكس</span>
          </div>

          <nav className="landing-desktop-nav" style={styles.desktopNav}>
            <a href="#features" style={styles.navLink}>أبرز المميزات</a>
            <a href="#demo" style={styles.navLink}>معاينة تفاعلية</a>
            <a href="#pricing" style={styles.navLink}>الخطط والأسعار</a>
            <a href="#contact" style={styles.navLink}>اتصل بنا</a>
          </nav>

          <div className="landing-header-actions" style={styles.headerActions}>
            <button onClick={onOpenLogin} style={styles.loginBtn}>
              تسجيل الدخول
            </button>
            <a href="#contact" style={styles.registerBtn}>
              طلب تجربة مجانية
            </a>
          </div>

          {/* زر الموبايل */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
            className="landing-menu-toggle"
            style={styles.mobileMenuToggle}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* قائمة الموبايل المنسدلة */}
        {mobileMenuOpen && (
          <div className="landing-mobile-menu" style={styles.mobileMenu}>
            <a href="#features" onClick={() => setMobileMenuOpen(false)} style={styles.mobileLink}>أبرز المميزات</a>
            <a href="#demo" onClick={() => setMobileMenuOpen(false)} style={styles.mobileLink}>معاينة تفاعلية</a>
            <a href="#pricing" onClick={() => setMobileMenuOpen(false)} style={styles.mobileLink}>الخطط والأسعار</a>
            <a href="#contact" onClick={() => setMobileMenuOpen(false)} style={styles.mobileLink}>اتصل بنا</a>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px', padding: '0 16px' }}>
              <button 
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenLogin();
                }} 
                style={styles.mobileLoginBtn}
              >
                تسجيل الدخول
              </button>
              <a 
                href="#contact" 
                onClick={() => setMobileMenuOpen(false)} 
                style={styles.mobileRegisterBtn}
              >
                طلب تجربة مجانية
              </a>
            </div>
          </div>
        )}
      </header>

      {/* قسم الهيرو / المقدمة */}
      <section className="landing-hero-section" style={styles.heroSection}>
        <div style={styles.glowBg1}></div>
        <div style={styles.glowBg2}></div>

        <div style={styles.heroContent}>
          <div style={styles.tagLine}>
            <Sparkles size={16} style={{ color: '#4f46e5' }} />
            <span>الحل المتكامل لإدارة مراكز الدعم الدراسي وتعليم اللغات</span>
          </div>

          <h1 className="landing-hero-title" style={styles.heroTitle}>
            أَدِرْ مَرْكَزَكَ الدِّرَاسِيَّ <br />
            <span style={styles.gradientText}>بِكُلِّ سُهُولَةٍ وَاحْتِرَافِيَّةٍ</span>
          </h1>

          <p className="landing-hero-subtitle" style={styles.heroSubtitle}>
            منصة سحابية متطورة تمكنك من تنظيم الأفواج، رصد حضور وغياب التلاميذ، احتساب أجور الأساتذة، وتتبع مالية المركز بدقة ومزامنة فورية بين جميع حواسيب الإدارة.
          </p>

          <div className="landing-hero-buttons" style={styles.heroButtons}>
            <a href="#contact" style={styles.heroCtaBtn}>
              ابدأ تجربتك المجانية الآن
            </a>
            <a href="#demo" style={styles.heroSecondaryBtn}>
              مشاهدة واجهة النظام
            </a>
          </div>
        </div>
      </section>

      {/* قسم إحصائيات وهمية للمنصة لإبهار المستخدم */}
      <section style={styles.statsSection}>
        <div className="landing-stats-grid" style={styles.statsGrid}>
          <div style={styles.statCard}>
            <span className="landing-stat-number" style={styles.statNumber}>12,400+</span>
            <span style={styles.statLabel}>تلميذ وتلميذة</span>
          </div>
          <div style={styles.statCard}>
            <span className="landing-stat-number" style={styles.statNumber}>320+</span>
            <span style={styles.statLabel}>أستاذ وأستاذة</span>
          </div>
          <div style={styles.statCard}>
            <span className="landing-stat-number" style={styles.statNumber}>84+</span>
            <span style={styles.statLabel}>مركز نشط</span>
          </div>
          <div style={styles.statCard}>
            <span className="landing-stat-number" style={styles.statNumber}>100%</span>
            <span style={styles.statLabel}>حفظ آمن ومزامنة سحابية</span>
          </div>
        </div>
      </section>

      {/* قسم المميزات */}
      <section id="features" style={styles.section}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>نظام ذكي متكامل مصمم لمراكز الدعم الدراسي واللغات</h2>
          <p style={styles.sectionSubtitle}>كل ما تحتاجه لإدارة أفواج الدعم وشؤون الأساتذة والمالية في مكان واحد</p>
        </div>

        <div className="landing-features-grid" style={styles.featuresGrid}>
          {/* ميزة 1 */}
          <div className="landing-feature-card" style={styles.featureCard}>
            <div style={{ ...styles.featureIconWrapper, backgroundColor: '#f5f3ff', color: '#4f46e5' }}>
              <Layers size={24} />
            </div>
            <h3 style={styles.featureTitle}>إدارة الأفواج والجدولة</h3>
            <p style={styles.featureDesc}>
              جدولة مرنة للأفواج والمجموعات مع إمكانية تحديد توقيت منفصل ومستقل لكل يوم من أيام الأسبوع بدقة تامة.
            </p>
          </div>

          {/* ميزة 2 */}
          <div className="landing-feature-card" style={{ ...styles.featureCard, transform: 'translateY(0)' }}>
            <div style={{ ...styles.featureIconWrapper, backgroundColor: '#f0f9ff', color: '#0ea5e9' }}>
              <Users size={24} />
            </div>
            <h3 style={styles.featureTitle}>متابعة التلاميذ والاشتراكات</h3>
            <p style={styles.featureDesc}>
              تسجيل بيانات التلاميذ بدقة، وتتبع حالة دفع فواتيرهم بـ شارات ملونة (مدفوع، جزئي، غير مدفوع) وتنبيه باقتراب انتهائها.
            </p>
          </div>

          {/* ميزة 3 */}
          <div className="landing-feature-card" style={styles.featureCard}>
            <div style={{ ...styles.featureIconWrapper, backgroundColor: '#fffbeb', color: '#d97706' }}>
              <MessageCircle size={24} />
            </div>
            <h3 style={styles.featureTitle}>إشعارات واتساب تلقائية</h3>
            <p style={styles.featureDesc}>
              مراسلة الآباء مباشرة بنقرة واحدة لإشعار غياب تلاميذهم، أو إرسال تذكيرات سداد للمتأخرين، أو رسائل تهنئة عند تميز التلاميذ.
            </p>
          </div>

          {/* ميزة 4 */}
          <div className="landing-feature-card" style={styles.featureCard}>
            <div style={{ ...styles.featureIconWrapper, backgroundColor: '#fef2f2', color: '#ef4444' }}>
              <GraduationCap size={24} />
            </div>
            <h3 style={styles.featureTitle}>كشوف أجور الأساتذة</h3>
            <p style={styles.featureDesc}>
              احتساب أوتوماتيكي لأجر الأستاذ سواء براتب شهري قار أو بنسبة مئوية من اشتراكات تلاميذه مع طباعة كشف أجر تفصيلي.
            </p>
          </div>

          {/* ميزة 5 */}
          <div className="landing-feature-card" style={styles.featureCard}>
            <div style={{ ...styles.featureIconWrapper, backgroundColor: '#faf5ff', color: '#8b5cf6' }}>
              <Wallet size={24} />
            </div>
            <h3 style={styles.featureTitle}>التقارير المالية والنفقات</h3>
            <p style={styles.featureDesc}>
              تسجيل المصروفات العامة، وحساب إجمالي النفقات ورواتب الأساتذة لتقرير مالي متكامل وصافي الأرباح شهرياً وبضغطة زر.
            </p>
          </div>

          {/* ميزة 6 */}
          <div className="landing-feature-card" style={styles.featureCard}>
            <div style={{ ...styles.featureIconWrapper, backgroundColor: '#ecfdf5', color: '#10b981' }}>
              <Printer size={24} />
            </div>
            <h3 style={styles.featureTitle}>سندات طباعة رسمية</h3>
            <p style={styles.featureDesc}>
              توليد وطباعة فورية لسندات وفواتير القبض المالية للمشتركين وورق الحضور والغياب الشهري للمجموعات بتصاميم عصرية واحترافية.
            </p>
          </div>
        </div>
      </section>

      {/* قسم المعاينة التفاعلية للنظام */}
      <section id="demo" style={{ ...styles.section, backgroundColor: '#f8fafc', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>معاينة لوحة التحكم والمدير</h2>
          <p style={styles.sectionSubtitle}>واجهة عربية فخمة، بسيطة وسريعة الاستجابة تمنحك تحكماً شاملاً</p>
        </div>

        {/* محاكاة واجهة لوحة التحكم بـ CSS */}
        <div className="landing-demo-mockup" style={styles.demoMockupContainer}>
          <div style={styles.mockupHeader}>
            <div style={styles.mockupDots}>
              <span style={{ ...styles.mockupDot, backgroundColor: '#ef4444' }}></span>
              <span style={{ ...styles.mockupDot, backgroundColor: '#eab308' }}></span>
              <span style={{ ...styles.mockupDot, backgroundColor: '#22c55e' }}></span>
            </div>
            <div style={styles.mockupAddress}>https://apex-academy.com/dashboard</div>
          </div>

          <div className="landing-mockup-app" style={styles.mockupApp}>
            {/* سايدبار المحاكي */}
            <div className="landing-mockup-sidebar" style={styles.mockupSidebar}>
              <div style={styles.mockupSidebarLogo}>
                <div style={styles.mockupLogoIcon}><Sparkles size={14} /></div>
                <span>أيبكس</span>
              </div>
              <div style={styles.mockupSidebarItemActive}>لوحة التحكم</div>
              <div style={styles.mockupSidebarItem}>إدارة الأساتذة</div>
              <div style={styles.mockupSidebarItem}>إدارة التلاميذ</div>
              <div style={styles.mockupSidebarItem}>النفقات والمالية</div>
            </div>

            {/* الجزء الرئيسي المحاكي */}
            <div className="landing-mockup-main" style={styles.mockupMain}>
              <div style={styles.mockupMainHeader}>
                <div>
                  <h4 style={{ margin: 0, fontWeight: 'bold' }}>مرحباً بك في أيبكس</h4>
                  <span style={{ fontSize: '0.65rem', color: '#64748b' }}>هذه إحصائيات عامة لأفواجك اليوم</span>
                </div>
                <span style={{ fontSize: '0.7rem', backgroundColor: '#e0e7ff', color: '#3730a3', padding: '4px 8px', borderRadius: '20px', fontWeight: 'bold' }}>✨ اشتراك سحابي فعال</span>
              </div>

              {/* بطاقات المؤشرات المحاكية */}
              <div className="landing-mockup-stats-grid" style={styles.mockupStatsGrid}>
                <div className="landing-mockup-stat-card" style={{ ...styles.mockupStatCard, borderRight: '4px solid #4f46e5' }}>
                  <span style={styles.mockupStatLabel}>التلاميذ المسجلين</span>
                  <span style={styles.mockupStatVal}>184 تلميذ</span>
                </div>
                <div className="landing-mockup-stat-card" style={{ ...styles.mockupStatCard, borderRight: '4px solid #0ea5e9' }}>
                  <span style={styles.mockupStatLabel}>الأساتذة النشطين</span>
                  <span style={styles.mockupStatVal}>12 أستاذ</span>
                </div>
                <div className="landing-mockup-stat-card" style={{ ...styles.mockupStatCard, borderRight: '4px solid #f59e0b' }}>
                  <span style={styles.mockupStatLabel}>المداخيل (هذا الشهر)</span>
                  <span style={{ ...styles.mockupStatVal, color: '#047857' }}>18,400 د.م.</span>
                </div>
              </div>

              {/* جدول الحضور والتحصيل في المحاكي */}
              <div style={styles.mockupTableWrapper}>
                <h5 style={{ margin: '0 0 10px 0', fontSize: '0.8rem', fontWeight: 'bold' }}>رصد صلاحية اشتراكات التلاميذ الأخيرة</h5>
                <div style={styles.mockupRow}>
                  <span>سفيان الدكالي</span>
                  <span style={{ color: '#4f46e5', fontSize: '0.75rem' }}>فوج اللغة الإنجليزية - مستوى 1</span>
                  <span style={{ fontSize: '0.7rem', color: '#ffffff', backgroundColor: '#10b981', padding: '2px 8px', borderRadius: '4px' }}>مدفوع بالكامل</span>
                </div>
                <div style={styles.mockupRow}>
                  <span>يسرى الفيلالي</span>
                  <span style={{ color: '#4f46e5', fontSize: '0.75rem' }}>فوج الرياضيات - مستوى 2</span>
                  <span style={{ fontSize: '0.7rem', color: '#ffffff', backgroundColor: '#f59e0b', padding: '2px 8px', borderRadius: '4px' }}>دفع جزئي (باقي 50 د.م.)</span>
                </div>
                <div style={styles.mockupRow}>
                  <span>عمر بن عمر</span>
                  <span style={{ color: '#4f46e5', fontSize: '0.75rem' }}>فوج اللغة الفرنسية - مستوى 3</span>
                  <span style={{ fontSize: '0.7rem', color: '#ffffff', backgroundColor: '#ef4444', padding: '2px 8px', borderRadius: '4px' }}>⚠️ غير مدفوع</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* قسم أسعار الاشتراكات */}
      <section id="pricing" style={styles.section}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>خطط اشتراك مرنة تناسب جميع الأوضاع</h2>
          <p style={styles.sectionSubtitle}>لا وجود لمصاريف مخفية، اختر خطة تشغيل مركزك مجاناً أو افتح كامل الإمكانيات</p>
        </div>

        <div className="landing-pricing-grid" style={styles.pricingGrid}>
          {/* الخطة الأولى: التجريبية */}
          <div className="landing-pricing-card" style={styles.pricingCard}>
            <h3 style={styles.planName}>الفترة التجريبية</h3>
            <p style={styles.planDesc}>لتجربة المنصة واستكشاف جميع الميزات ومرونة الإدارة</p>
            <div style={styles.planPriceBox}>
              <span style={styles.planPrice}>مجاناً</span>
              <span style={styles.planPeriod}>/ لمدة 14 يوماً</span>
            </div>
            <ul style={styles.planFeatures}>
              <li style={styles.planFeatureItem}><CheckCircle size={16} style={styles.checkIcon} /> استكشاف كل التبويبات والمميزات</li>
              <li style={styles.planFeatureItem}><CheckCircle size={16} style={styles.checkIcon} /> إضافة عدد غير محدود من الأساتذة</li>
              <li style={styles.planFeatureItem}><CheckCircle size={16} style={styles.checkIcon} /> إضافة حتى 30 تلميذ</li>
              <li style={styles.planFeatureItem}><CheckCircle size={16} style={styles.checkIcon} /> نظام إرسال الإشعارات بالواتساب</li>
            </ul>
            <a href="#contact" style={styles.planCtaBtn}>ابدأ تجربتك الآن</a>
          </div>

          {/* الخطة الثانية: الاحترافية */}
          <div className="landing-pricing-card popular" style={{ ...styles.pricingCard, border: '2px solid #4f46e5', transform: 'scale(1.03)', boxShadow: '0 15px 30px rgba(79, 70, 229, 0.15)' }}>
            <span style={styles.popularBadge}>الأكثر طلباً ✨</span>
            <h3 style={styles.planName}>الخطة السحابية المفتوحة</h3>
            <p style={styles.planDesc}>لإدارة كاملة لمركزك الأكاديمي ببيانات معزولة ودعم فني دائم</p>
            <div style={styles.planPriceBox}>
              <span style={styles.planPrice}>تواصل معنا</span>
              <span style={styles.planPeriod}>/ اشتراك دائم أو سنوي</span>
            </div>
            <ul style={styles.planFeatures}>
              <li style={styles.planFeatureItem}><CheckCircle size={16} style={{ ...styles.checkIcon, color: '#4f46e5' }} /> إرسال إشعارات واتساب غير محدودة مجاناً</li>
              <li style={styles.planFeatureItem}><CheckCircle size={16} style={{ ...styles.checkIcon, color: '#4f46e5' }} /> عدد غير محدود من التلاميذ والأساتذة والأفواج</li>
              <li style={styles.planFeatureItem}><CheckCircle size={16} style={{ ...styles.checkIcon, color: '#4f46e5' }} /> ربط سحابي فوري بقاعدة بيانات Supabase مخصصة</li>
              <li style={styles.planFeatureItem}><CheckCircle size={16} style={{ ...styles.checkIcon, color: '#4f46e5' }} /> نسخ احتياطي يومي مجاني لبيانات مركزك</li>
              <li style={styles.planFeatureItem}><CheckCircle size={16} style={{ ...styles.checkIcon, color: '#4f46e5' }} /> دعم فني ومساعدة في نقل وتوريد بياناتك السابقة</li>
            </ul>
            <a href="#contact" style={{ ...styles.planCtaBtn, backgroundColor: '#4f46e5', color: '#ffffff' }}>تواصل معنا وتفعيل حسابك</a>
          </div>
        </div>
      </section>

      {/* قسم تواصل معنا والأسئلة الشائعة */}
      <section id="contact" style={{ ...styles.section, backgroundColor: '#f8fafc' }}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>تواصل معنا لتفعيل حسابك</h2>
          <p style={styles.sectionSubtitle}>هل أنت مستعد لأتمتة مركزك الأكاديمي؟ أرسل لنا رسالة وسنساعدك في دقيقة</p>
        </div>

        <div style={styles.contactContainer}>
          <div className="landing-contact-card" style={styles.contactCard}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '1.2rem', color: '#3730a3', fontWeight: 'bold' }}>بيانات التواصل الرسمية مع مطور المنصة</h3>
            
            <div style={styles.contactInfoList}>
              <div style={styles.contactInfoItem}>
                <div style={styles.contactInfoIcon}><Mail size={20} /></div>
                <div>
                  <span style={styles.contactInfoLabel}>البريد الإلكتروني للطلبات:</span>
                  <span style={styles.contactInfoValue}>admin@apex-academy.com</span>
                </div>
              </div>

              <div style={styles.contactInfoItem}>
                <div style={styles.contactInfoIcon}><MessageCircle size={20} /></div>
                <div>
                  <span style={styles.contactInfoLabel}>اتصال سحابي فوري:</span>
                  <span style={styles.contactInfoValue}>متاح للمراكز الحاصلة على رمز ترخيص</span>
                </div>
              </div>
            </div>

            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.6', margin: '20px 0 0 0' }}>
              💡 بمجرد التسجيل وتزويدك بالحساب من قبل المطور، ستتمكن من تسجيل الدخول مباشرة من الزر في الأعلى والبدء الفوري في أتمتة وإدارة أفواجك الدراسية.
            </p>
          </div>
        </div>
      </section>

      {/* تذييل الصفحة */}
      <footer style={styles.footer}>
        <div style={styles.footerContent}>
          <div style={styles.logo}>
            <div style={styles.logoIconWrapper}>
              <Sparkles size={18} />
            </div>
            <span style={{ ...styles.logoText, fontSize: '1.1rem' }}>أكاديمية أيبكس</span>
          </div>
          
          <p style={{ margin: '10px 0 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
            جميع الحقوق محفوظة © {new Date().getFullYear()} - منصة أيبكس لإدارة مراكز الدعم الدراسي وتعديل اللغات.
          </p>
        </div>
      </footer>

      <style>{`
        /* استعلامات الأجهزة اللوحية (Tablets) */
        @media (max-width: 1024px) {
          .landing-stats-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          .landing-features-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          .landing-pricing-grid {
            gap: 20px !important;
          }
        }

        /* استعلامات الهواتف (Mobiles) */
        @media (max-width: 768px) {
          .landing-header-content {
            padding: 12px 16px !important;
          }
          .landing-desktop-nav {
            display: none !important;
          }
          .landing-header-actions {
            display: none !important;
          }
          .landing-menu-toggle {
            display: block !important;
          }
          .landing-mobile-menu {
            display: flex !important;
            top: 70px !important;
          }
          
          .landing-hero-section {
            padding: 40px 16px 30px 16px !important;
          }
          .landing-hero-title {
            font-size: 2rem !important;
            line-height: 1.3 !important;
          }
          .landing-hero-subtitle {
            font-size: 0.95rem !important;
            line-height: 1.6 !important;
          }
          .landing-hero-buttons {
            flex-direction: column;
            width: 100%;
            gap: 12px !important;
          }
          .landing-hero-buttons a {
            width: 100%;
            text-align: center;
          }

          .landing-stats-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            padding: 20px !important;
            gap: 16px !important;
          }
          .landing-stat-number {
            font-size: 1.6rem !important;
          }

          .landing-features-grid {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
          }
          .landing-feature-card {
            padding: 24px 20px !important;
          }

          .landing-mockup-app {
            grid-template-columns: 1fr !important;
            height: auto !important;
          }
          .landing-mockup-sidebar {
            display: none !important;
          }
          .landing-mockup-main {
            padding: 16px !important;
          }
          .landing-mockup-stats-grid {
            grid-template-columns: 1fr !important;
            gap: 10px !important;
          }

          .landing-pricing-grid {
            flex-direction: column !important;
            align-items: center !important;
            gap: 24px !important;
            margin-top: 10px !important;
          }
          .landing-pricing-card {
            width: 100% !important;
            max-width: 100% !important;
            padding: 30px 20px !important;
            transform: none !important;
            box-shadow: 0 4px 6px rgba(0,0,0,0.05) !important;
          }
          .landing-pricing-card.popular {
            border: 2px solid #4f46e5 !important;
          }

          .landing-contact-card {
            padding: 24px 16px !important;
            border-radius: 12px !important;
          }
        }

        /* استعلامات الهواتف الصغيرة جداً (Small Mobiles) */
        @media (max-width: 480px) {
          .landing-stats-grid {
            grid-template-columns: 1fr !important;
          }
          .landing-hero-title {
            font-size: 1.8rem !important;
          }
        }
      `}</style>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    direction: 'rtl',
    fontFamily: 'Cairo, sans-serif',
    backgroundColor: '#ffffff',
    color: '#334155',
    minHeight: '100vh',
    overflowX: 'hidden',
  },
  header: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    backdropFilter: 'blur(10px)',
    borderBottom: '1px solid #e2e8f0',
    position: 'sticky',
    top: 0,
    zIndex: 1000,
    transition: 'all 0.3s',
  },
  headerContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '16px 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  logoIconWrapper: {
    width: '38px',
    height: '38px',
    background: 'linear-gradient(135deg, #4f46e5, #0ea5e9)',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#ffffff',
    boxShadow: '0 4px 6px rgba(79, 70, 229, 0.15)',
  },
  logoText: {
    fontWeight: '800',
    fontSize: '1.25rem',
    color: '#3730a3',
    letterSpacing: '0.5px',
  },
  desktopNav: {
    display: 'flex',
    gap: '24px',
  },
  navLink: {
    fontSize: '0.9rem',
    fontWeight: '600',
    color: '#64748b',
    textDecoration: 'none',
    transition: 'color 0.2s',
  },
  headerActions: {
    display: 'flex',
    gap: '12px',
  },
  loginBtn: {
    padding: '8px 18px',
    backgroundColor: 'transparent',
    border: '1px solid #4f46e5',
    borderRadius: '8px',
    color: '#4f46e5',
    fontWeight: '700',
    fontSize: '0.85rem',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  registerBtn: {
    padding: '8px 18px',
    backgroundColor: '#4f46e5',
    borderRadius: '8px',
    color: '#ffffff',
    fontWeight: '700',
    fontSize: '0.85rem',
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    cursor: 'pointer',
    boxShadow: '0 4px 6px -1px rgba(79, 70, 229, 0.1)',
    transition: 'all 0.2s',
  },
  mobileMenuToggle: {
    display: 'none',
    background: 'none',
    border: 'none',
    color: '#334155',
    cursor: 'pointer',
  },
  mobileMenu: {
    display: 'none',
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #e2e8f0',
    padding: '16px 0 24px 0',
    gap: '16px',
    position: 'absolute',
    top: '70px',
    left: 0,
    width: '100%',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)',
  },
  mobileLink: {
    padding: '8px 24px',
    fontSize: '0.95rem',
    fontWeight: '600',
    color: '#64748b',
    textDecoration: 'none',
    display: 'block',
  },
  mobileLoginBtn: {
    padding: '12px',
    backgroundColor: 'transparent',
    border: '1px solid #4f46e5',
    borderRadius: '8px',
    color: '#4f46e5',
    fontWeight: '700',
    fontSize: '0.95rem',
    cursor: 'pointer',
  },
  mobileRegisterBtn: {
    padding: '12px',
    backgroundColor: '#4f46e5',
    borderRadius: '8px',
    color: '#ffffff',
    fontWeight: '700',
    fontSize: '0.95rem',
    textDecoration: 'none',
    textAlign: 'center',
  },
  heroSection: {
    position: 'relative',
    maxWidth: '1000px',
    margin: '0 auto',
    padding: '80px 24px 60px 24px',
    textAlign: 'center',
  },
  glowBg1: {
    position: 'absolute',
    width: '300px',
    height: '300px',
    top: '10%',
    right: '5%',
    background: 'radial-gradient(circle, rgba(79, 70, 229, 0.08) 0%, rgba(255, 255, 255, 0) 70%)',
    zIndex: -1,
  },
  glowBg2: {
    position: 'absolute',
    width: '300px',
    height: '300px',
    bottom: '10%',
    left: '5%',
    background: 'radial-gradient(circle, rgba(14, 165, 233, 0.08) 0%, rgba(255, 255, 255, 0) 70%)',
    zIndex: -1,
  },
  heroContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '24px',
  },
  tagLine: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#f5f3ff',
    color: '#3730a3',
    padding: '8px 16px',
    borderRadius: '20px',
    fontSize: '0.82rem',
    fontWeight: '700',
    border: '1px solid #e0e7ff',
  },
  heroTitle: {
    fontSize: '3rem',
    fontWeight: '850',
    color: '#0f172a',
    margin: 0,
    lineHeight: '1.25',
    letterSpacing: '-0.5px',
  },
  gradientText: {
    background: 'linear-gradient(135deg, #4f46e5, #0ea5e9)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  heroSubtitle: {
    fontSize: '1.1rem',
    lineHeight: '1.75',
    color: '#64748b',
    maxWidth: '700px',
    margin: 0,
  },
  heroButtons: {
    display: 'flex',
    gap: '16px',
    marginTop: '8px',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  heroCtaBtn: {
    padding: '14px 28px',
    backgroundColor: '#4f46e5',
    color: '#ffffff',
    borderRadius: '8px',
    fontWeight: '700',
    fontSize: '0.95rem',
    textDecoration: 'none',
    boxShadow: '0 10px 15px -3px rgba(79, 70, 229, 0.2)',
    transition: 'all 0.2s',
  },
  heroSecondaryBtn: {
    padding: '14px 28px',
    backgroundColor: '#ffffff',
    color: '#334155',
    borderRadius: '8px',
    fontWeight: '700',
    fontSize: '0.95rem',
    textDecoration: 'none',
    border: '1px solid #cbd5e1',
    transition: 'all 0.2s',
  },
  statsSection: {
    maxWidth: '1000px',
    margin: '40px auto 80px auto',
    padding: '0 24px',
  },
  statsGrid: {
    backgroundColor: '#3730a3',
    backgroundImage: 'linear-gradient(135deg, #3730a3, #0284c7)',
    borderRadius: '16px',
    padding: '30px',
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '24px',
    color: '#ffffff',
    boxShadow: '0 10px 25px -5px rgba(55, 48, 163, 0.25)',
  },
  statCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '6px',
    textAlign: 'center',
  },
  statNumber: {
    fontSize: '2rem',
    fontWeight: '800',
  },
  statLabel: {
    fontSize: '0.8rem',
    color: '#e0e7ff',
    fontWeight: '600',
  },
  section: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '80px 24px',
  },
  sectionHeader: {
    textAlign: 'center',
    maxWidth: '700px',
    margin: '0 auto 50px auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  sectionTitle: {
    fontSize: '1.8rem',
    fontWeight: '800',
    color: '#0f172a',
    margin: 0,
  },
  sectionSubtitle: {
    fontSize: '0.95rem',
    color: '#64748b',
    margin: 0,
    lineHeight: '1.6',
  },
  featuresGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '24px',
  },
  featureCard: {
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    padding: '30px 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    transition: 'all 0.3s',
  },
  featureIconWrapper: {
    width: '48px',
    height: '48px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureTitle: {
    fontSize: '1.1rem',
    fontWeight: '700',
    color: '#1e293b',
    margin: 0,
  },
  featureDesc: {
    fontSize: '0.88rem',
    lineHeight: '1.6',
    color: '#64748b',
    margin: 0,
  },
  demoMockupContainer: {
    maxWidth: '900px',
    margin: '0 auto',
    backgroundColor: '#ffffff',
    borderRadius: '14px',
    boxShadow: '0 20px 40px -15px rgba(0,0,0,0.1)',
    border: '1px solid #cbd5e1',
    overflow: 'hidden',
  },
  mockupHeader: {
    backgroundColor: '#f1f5f9',
    borderBottom: '1px solid #e2e8f0',
    padding: '12px 18px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  mockupDots: {
    display: 'flex',
    gap: '6px',
  },
  mockupDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
  },
  mockupAddress: {
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    padding: '4px 20px',
    fontSize: '0.7rem',
    color: '#94a3b8',
    width: '300px',
    textAlign: 'center',
    margin: '0 auto',
  },
  mockupApp: {
    display: 'grid',
    gridTemplateColumns: '180px 1fr',
    height: '350px',
    fontSize: '0.8rem',
  },
  mockupSidebar: {
    backgroundColor: '#0f172a',
    color: '#94a3b8',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    borderLeft: '1px solid #1e293b',
  },
  mockupSidebarLogo: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    color: '#ffffff',
    fontWeight: 'bold',
    marginBottom: '16px',
    fontSize: '0.85rem',
  },
  mockupLogoIcon: {
    backgroundColor: '#4f46e5',
    color: '#ffffff',
    width: '22px',
    height: '22px',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mockupSidebarItem: {
    padding: '8px 10px',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  mockupSidebarItemActive: {
    padding: '8px 10px',
    borderRadius: '6px',
    backgroundColor: '#1e293b',
    color: '#ffffff',
    fontWeight: 'bold',
    style: { cursor: 'default' }
  } as React.CSSProperties,
  mockupMain: {
    padding: '20px',
    backgroundColor: '#f8fafc',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    overflow: 'hidden',
  },
  mockupMainHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #e2e8f0',
    paddingBottom: '10px',
  },
  mockupStatsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '12px',
  },
  mockupStatCard: {
    backgroundColor: '#ffffff',
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  mockupStatLabel: {
    fontSize: '0.65rem',
    color: '#64748b',
  },
  mockupStatVal: {
    fontSize: '0.95rem',
    fontWeight: '850',
    color: '#0f172a',
  },
  mockupTableWrapper: {
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '14px',
    flexGrow: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  mockupRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '6px 8px',
    backgroundColor: '#f8fafc',
    borderRadius: '4px',
    border: '1px solid #f1f5f9',
    fontSize: '0.75rem',
  },
  pricingGrid: {
    display: 'flex',
    justifyContent: 'center',
    gap: '30px',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    marginTop: '20px',
  },
  pricingCard: {
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '16px',
    padding: '40px 30px',
    width: '380px',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    position: 'relative',
    transition: 'all 0.2s',
  },
  popularBadge: {
    position: 'absolute',
    top: '-14px',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: '#4f46e5',
    color: '#ffffff',
    padding: '4px 14px',
    borderRadius: '20px',
    fontSize: '0.75rem',
    fontWeight: 'bold',
    boxShadow: '0 4px 6px rgba(79, 70, 229, 0.2)',
  },
  planName: {
    fontSize: '1.25rem',
    fontWeight: '800',
    color: '#0f172a',
    margin: 0,
  },
  planDesc: {
    fontSize: '0.85rem',
    color: '#64748b',
    margin: 0,
    lineHeight: '1.5',
  },
  planPriceBox: {
    borderTop: '1px solid #e2e8f0',
    borderBottom: '1px solid #e2e8f0',
    padding: '16px 0',
    display: 'flex',
    alignItems: 'baseline',
    gap: '8px',
  },
  planPrice: {
    fontSize: '2rem',
    fontWeight: '850',
    color: '#4f46e5',
  },
  planPeriod: {
    fontSize: '0.8rem',
    color: '#64748b',
    fontWeight: '600',
  },
  planFeatures: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  planFeatureItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '0.85rem',
    color: '#475569',
  },
  checkIcon: {
    color: '#22c55e',
    flexShrink: 0,
  },
  planCtaBtn: {
    padding: '12px',
    textAlign: 'center',
    border: '1px solid #4f46e5',
    borderRadius: '8px',
    color: '#4f46e5',
    fontWeight: '700',
    fontSize: '0.9rem',
    textDecoration: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  contactContainer: {
    display: 'flex',
    justifyContent: 'center',
    marginTop: '20px',
  },
  contactCard: {
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '16px',
    padding: '40px',
    maxWidth: '600px',
    width: '100%',
    boxShadow: 'var(--shadow-sm)',
  },
  contactInfoList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    marginTop: '20px',
  },
  contactInfoItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  contactInfoIcon: {
    width: '42px',
    height: '42px',
    backgroundColor: '#f5f3ff',
    color: '#4f46e5',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactInfoLabel: {
    display: 'block',
    fontSize: '0.75rem',
    color: '#64748b',
  },
  contactInfoValue: {
    display: 'block',
    fontSize: '1rem',
    fontWeight: 'bold',
    color: '#0f172a',
  },
  footer: {
    backgroundColor: '#0f172a',
    color: '#94a3b8',
    borderTop: '1px solid #1e293b',
  },
  footerContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '40px 24px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
  },
};

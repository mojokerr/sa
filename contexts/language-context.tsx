'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'ar';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations = {
  en: {
    // Navigation
    'nav.home': 'Home',
    'nav.dashboard': 'Dashboard',
    'nav.admin': 'Admin',
    
    // Hero Section
    'hero.badge': '🚀 AI-Powered Growth Platform',
    'hero.title': 'Smart Growth for Telegram Communities',
    'hero.subtitle': 'Advanced AI-driven platform to grow your Telegram communities with intelligent member management and analytics.',
    'hero.cta': 'Get Started',
    'hero.signup': 'Sign Up Free',
    'hero.features.1.title': 'Smart Analytics',
    'hero.features.1.desc': 'AI-powered insights and growth analytics for your communities',
    'hero.features.2.title': 'Fast Processing',
    'hero.features.2.desc': 'Lightning-fast member management with advanced algorithms',
    'hero.features.3.title': 'Secure & Safe',
    'hero.features.3.desc': 'Enterprise-grade security with full data protection',
    
    // How It Works
    'howItWorks.title': 'How It Works',
    'howItWorks.subtitle': 'Simple 4-step process to grow your community',
    'howItWorks.step1.title': 'Create Account',
    'howItWorks.step1.desc': 'Sign up and set up your profile',
    'howItWorks.step2.title': 'Submit Request',
    'howItWorks.step2.desc': 'Provide your group details and requirements',
    'howItWorks.step3.title': 'AI Processing',
    'howItWorks.step3.desc': 'Our AI analyzes and processes your request',
    'howItWorks.step4.title': 'Get Results',
    'howItWorks.step4.desc': 'Track progress and see your community grow',
    
    // CTA
    'cta.title': 'Ready to Grow Your Community?',
    'cta.subtitle': 'Join thousands of community managers who trust BoostGram AI',
    'cta.button': 'Start Growing Now',
    
    // Auth
    'auth.signin.title': 'Welcome Back',
    'auth.signin.subtitle': 'Sign in to your BoostGram AI account',
    'auth.signin.button': 'Sign In',
    'auth.signin.google': 'Continue with Google',
    'auth.signin.noAccount': "Don't have an account?",
    'auth.signup.title': 'Create Account',
    'auth.signup.subtitle': 'Join BoostGram AI today',
    'auth.signup.button': 'Create Account',
    'auth.signup.google': 'Sign up with Google',
    'auth.signup.hasAccount': 'Already have an account?',
    'auth.or': 'or',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.confirmPassword': 'Confirm Password',
    'auth.name': 'Full Name',
    
    // Dashboard
    'dashboard.welcome': 'Welcome back',
    'dashboard.subtitle': 'Manage your community growth requests',
    'dashboard.newOrder': 'New Request',
    'dashboard.createOrder': 'Create New Request',
    'dashboard.recentOrders': 'Recent Requests',
    'dashboard.noOrders': 'No requests yet',
    'dashboard.createFirst': 'Create Your First Request',
    'dashboard.notes': 'Notes (Optional)',
    'dashboard.notesPlaceholder': 'Add any special instructions or notes...',
    'dashboard.stats.total': 'Total Requests',
    'dashboard.stats.pending': 'Pending',
    'dashboard.stats.completed': 'Completed',
    'dashboard.stats.members': 'Total Members',
    
    // Admin
    'admin.title': 'Admin Dashboard',
    'admin.subtitle': 'Manage all system operations',
    'admin.orders': 'All Requests',
    'admin.noOrders': 'No requests found',
    'admin.filter.all': 'All Status',
    'admin.stats.total': 'Total',
    'admin.stats.pending': 'Pending',
    'admin.stats.processing': 'Processing',
    'admin.stats.completed': 'Completed',
    'admin.stats.cancelled': 'Cancelled',
    'admin.stats.users': 'Users',
    'admin.stats.members': 'Members',
    
    // Form
    'form.source.label': 'Source Group Link',
    'form.members.label': 'Member Count',
    
    // Status
    'status.pending': 'Pending',
    'status.processing': 'Processing',
    'status.completed': 'Completed',
    'status.cancelled': 'Cancelled',
    
    // Common
    'common.loading': 'Loading...',
    'common.success': 'Success!',
    'common.error': 'Error occurred',
    'common.cancel': 'Cancel',
    'common.save': 'Save',
    'common.edit': 'Edit',
    'common.delete': 'Delete',
    
    // Footer
    'footer.rights': 'All rights reserved.',
  },
  ar: {
    // Navigation
    'nav.home': 'الرئيسية',
    'nav.dashboard': 'لوحة التحكم',
    'nav.admin': 'الإدارة',
    
    // Hero Section
    'hero.badge': '🚀 منصة النمو الذكي',
    'hero.title': 'النمو الذكي لمجتمعات تيليجرام',
    'hero.subtitle': 'منصة متقدمة مدعومة بالذكاء الاصطناعي لتنمية مجتمعات تيليجرام مع إدارة ذكية للأعضاء والتحليلات.',
    'hero.cta': 'ابدأ الآن',
    'hero.signup': 'اشترك مجاناً',
    'hero.features.1.title': 'تحليلات ذكية',
    'hero.features.1.desc': 'رؤى مدعومة بالذكاء الاصطناعي وتحليلات النمو لمجتمعاتك',
    'hero.features.2.title': 'معالجة سريعة',
    'hero.features.2.desc': 'إدارة فائقة السرعة للأعضاء مع خوارزميات متقدمة',
    'hero.features.3.title': 'آمن ومحمي',
    'hero.features.3.desc': 'أمان على مستوى المؤسسات مع حماية كاملة للبيانات',
    
    // How It Works
    'howItWorks.title': 'كيف يعمل',
    'howItWorks.subtitle': 'عملية بسيطة من 4 خطوات لتنمية مجتمعك',
    'howItWorks.step1.title': 'إنشاء حساب',
    'howItWorks.step1.desc': 'سجل وأعد إعداد ملفك الشخصي',
    'howItWorks.step2.title': 'إرسال طلب',
    'howItWorks.step2.desc': 'قدم تفاصيل مجموعتك ومتطلباتك',
    'howItWorks.step3.title': 'معالجة الذكاء الاصطناعي',
    'howItWorks.step3.desc': 'ذكاؤنا الاصطناعي يحلل ويعالج طلبك',
    'howItWorks.step4.title': 'احصل على النتائج',
    'howItWorks.step4.desc': 'تتبع التقدم وشاهد مجتمعك ينمو',
    
    // CTA
    'cta.title': 'مستعد لتنمية مجتمعك؟',
    'cta.subtitle': 'انضم لآلاف مديري المجتمعات الذين يثقون في BoostGram AI',
    'cta.button': 'ابدأ النمو الآن',
    
    // Auth
    'auth.signin.title': 'مرحباً بعودتك',
    'auth.signin.subtitle': 'سجل دخولك إلى حساب BoostGram AI',
    'auth.signin.button': 'تسجيل الدخول',
    'auth.signin.google': 'المتابعة مع جوجل',
    'auth.signin.noAccount': 'ليس لديك حساب؟',
    'auth.signup.title': 'إنشاء حساب',
    'auth.signup.subtitle': 'انضم إلى BoostGram AI اليوم',
    'auth.signup.button': 'إنشاء حساب',
    'auth.signup.google': 'التسجيل مع جوجل',
    'auth.signup.hasAccount': 'لديك حساب بالفعل؟',
    'auth.or': 'أو',
    'auth.email': 'البريد الإلكتروني',
    'auth.password': 'كلمة المرور',
    'auth.confirmPassword': 'تأكيد كلمة المرور',
    'auth.name': 'الاسم الكامل',
    
    // Dashboard
    'dashboard.welcome': 'مرحباً بعودتك',
    'dashboard.subtitle': 'إدارة طلبات نمو مجتمعك',
    'dashboard.newOrder': 'طلب جديد',
    'dashboard.createOrder': 'إنشاء طلب جديد',
    'dashboard.recentOrders': 'الطلبات الأخيرة',
    'dashboard.noOrders': 'لا توجد طلبات بعد',
    'dashboard.createFirst': 'أنشئ طلبك الأول',
    'dashboard.notes': 'ملاحظات (اختياري)',
    'dashboard.notesPlaceholder': 'أضف أي تعليمات خاصة أو ملاحظات...',
    'dashboard.stats.total': 'إجمالي الطلبات',
    'dashboard.stats.pending': 'معلقة',
    'dashboard.stats.completed': 'مكتملة',
    'dashboard.stats.members': 'إجمالي الأعضاء',
    
    // Admin
    'admin.title': 'لوحة الإدارة',
    'admin.subtitle': 'إدارة جميع عمليات النظام',
    'admin.orders': 'جميع الطلبات',
    'admin.noOrders': 'لم يتم العثور على طلبات',
    'admin.filter.all': 'جميع الحالات',
    'admin.stats.total': 'الإجمالي',
    'admin.stats.pending': 'معلقة',
    'admin.stats.processing': 'قيد المعالجة',
    'admin.stats.completed': 'مكتملة',
    'admin.stats.cancelled': 'ملغية',
    'admin.stats.users': 'المستخدمون',
    'admin.stats.members': 'الأعضاء',
    
    // Form
    'form.source.label': 'رابط المجموعة المصدر',
    'form.members.label': 'عدد الأعضاء',
    
    // Status
    'status.pending': 'معلق',
    'status.processing': 'قيد المعالجة',
    'status.completed': 'مكتمل',
    'status.cancelled': 'ملغي',
    
    // Common
    'common.loading': 'جاري التحميل...',
    'common.success': 'نجح!',
    'common.error': 'حدث خطأ',
    'common.cancel': 'إلغاء',
    'common.save': 'حفظ',
    'common.edit': 'تعديل',
    'common.delete': 'حذف',
    
    // Footer
    'footer.rights': 'جميع الحقوق محفوظة.',
  },
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('ar');

  useEffect(() => {
    const saved = localStorage.getItem('language') as Language;
    if (saved && (saved === 'en' || saved === 'ar')) {
      setLanguage(saved);
      document.documentElement.lang = saved;
      document.documentElement.dir = saved === 'ar' ? 'rtl' : 'ltr';
    } else {
      // Default to Arabic
      document.documentElement.lang = 'ar';
      document.documentElement.dir = 'rtl';
    }
  }, []);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  };

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations['en']] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
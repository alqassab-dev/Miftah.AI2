export type Language = 'en' | 'ar';

export interface Translation {
  topbar: {
    logoSub: string;
    status: string;
  };
  sidebar: {
    mode: string;
    chat: string;
    chatDesc: string;
    wizard: string;
    wizardDesc: string;
    topics: string;
    disclaimer: string;
  };
  chat: {
    placeholder: string;
    emptyTitle: string;
    emptySub: string;
    emptyArabic: string;
    suggests: { icon: string; text: string }[];
  };
  wizard: {
    title: string;
    titleAccent: string;
    sub: string;
    idea: string;
    nationality: string;
    city: string;
    budget: string;
    sector: string;
    generate: string;
    back: string;
    roadmap: string;
  };
  nationalities: {
    saudi: string;
    gcc: string;
    expat: string;
  };
  budgets: {
    micro: string;
    small: string;
    medium: string;
    large: string;
  };
  sectors: {
    food: string;
    retail: string;
    tech: string;
    ecommerce: string;
    consulting: string;
    other: string;
  };
}

export const translations: Record<Language, Translation> = {
  en: {
    topbar: {
      logoSub: 'KSA BUSINESS LAUNCHER · مفتاح',
      status: 'AI ADVISOR ONLINE',
    },
    sidebar: {
      mode: 'Mode',
      chat: 'Open Chat',
      chatDesc: 'Ask anything about KSA business',
      wizard: 'Guided Wizard',
      wizardDesc: 'Step-by-step personalized plan',
      topics: 'Quick Topics',
      disclaimer: 'Powered by Gemini AI · Not legal advice · Verify with official KSA portals',
    },
    chat: {
      placeholder: 'Ask about registration, licenses, suppliers, costs...',
      emptyTitle: 'How can I help you today?',
      emptySub: 'Ask me anything about starting, registering, or growing a business in Saudi Arabia.',
      emptyArabic: 'مرحباً! كيف أقدر أساعدك؟',
      suggests: [
        { icon: '🏢', text: 'Register a Company' },
        { icon: '📄', text: 'Get a CR Number' },
        { icon: '🌍', text: 'MISA License' },
        { icon: '🍽️', text: 'Food Business License' },
        { icon: '🛒', text: 'E-Commerce Setup' },
        { icon: '💰', text: 'Minimum Budget' },
        { icon: '👩', text: 'Women Entrepreneurs' },
        { icon: '🇸🇦', text: 'Vision 2030 Sectors' },
      ],
    },
    wizard: {
      title: 'Build Your',
      titleAccent: 'KSA Business Roadmap',
      sub: 'Fill in your details and get a personalized step-by-step launch plan — government steps, costs, and suppliers included.',
      idea: 'Business Idea',
      nationality: 'Nationality',
      city: 'City',
      budget: 'Approximate Budget (SAR)',
      sector: 'Business Sector',
      generate: 'Generate My Business Roadmap',
      back: 'Back to Wizard',
      roadmap: 'YOUR ROADMAP',
    },
    nationalities: {
      saudi: '🇸🇦 Saudi National',
      gcc: '🌍 GCC National',
      expat: '✈️ Expat / Foreign',
    },
    budgets: {
      micro: 'Under SAR 5,000 — Just Starting',
      small: 'SAR 5,000 – 50,000',
      medium: 'SAR 50,000 – 200,000',
      large: 'Over SAR 200,000',
    },
    sectors: {
      food: 'Food & Restaurant',
      retail: 'Retail',
      tech: 'Tech & Digital',
      ecommerce: 'E-Commerce',
      consulting: 'Consulting',
      other: 'Other',
    },
  },
  ar: {
    topbar: {
      logoSub: 'مفتاح · مساعد إطلاق الأعمال في السعودية',
      status: 'المستشار الذكي متاح',
    },
    sidebar: {
      mode: 'الوضع',
      chat: 'محادثة مفتوحة',
      chatDesc: 'اسأل أي شيء عن الأعمال في السعودية',
      wizard: 'المساعد التفاعلي',
      wizardDesc: 'خطة مخصصة خطوة بخطوة',
      topics: 'مواضيع سريعة',
      disclaimer: 'مدعوم بالذكاء الاصطناعي · ليس استشارة قانونية · تحقق من البوابات الرسمية',
    },
    chat: {
      placeholder: 'اسأل عن التسجيل، التراخيص، الموردين، التكاليف...',
      emptyTitle: 'كيف أقدر أساعدك؟',
      emptySub: 'اسألني أي شيء عن تأسيس أو تسجيل أو تنمية مشروعك في المملكة العربية السعودية.',
      emptyArabic: 'مرحباً! أنا مفتاح، مستشارك الذكي للأعمال في السعودية',
      suggests: [
        { icon: '🏢', text: 'تسجيل شركة' },
        { icon: '📄', text: 'الحصول على سجل تجاري' },
        { icon: '🌍', text: 'رخصة استثمار (MISA)' },
        { icon: '🍽️', text: 'رخصة محل أغذية' },
        { icon: '🛒', text: 'تأسيس متجر إلكتروني' },
        { icon: '💰', text: 'أقل ميزانية للبدء' },
        { icon: '👩', text: 'رائدات الأعمال' },
        { icon: '🇸🇦', text: 'قطاعات رؤية 2030' },
      ],
    },
    wizard: {
      title: 'أنشئ',
      titleAccent: 'خارطة طريق أعمالك في السعودية',
      sub: 'أدخل تفاصيلك واحصل على خطة إطلاق مخصصة — خطوات حكومية وتكاليف وموردين.',
      idea: 'فكرة المشروع',
      nationality: 'الجنسية',
      city: 'المدينة',
      budget: 'الميزانية التقريبية (ريال)',
      sector: 'القطاع',
      generate: 'أنشئ خارطة طريق أعمالي',
      back: 'رجوع للمعالج',
      roadmap: 'خارطة طريقك',
    },
    nationalities: {
      saudi: '🇸🇦 مواطن سعودي',
      gcc: '🌍 مواطن خليجي',
      expat: '✈️ مقيم / أجنبي',
    },
    budgets: {
      micro: 'أقل من 5,000 ريال — بداية بسيطة',
      small: '5,000 – 50,000 ريال',
      medium: '50,000 – 200,000 ريال',
      large: 'أكثر من 200,000 ريال',
    },
    sectors: {
      food: 'مطاعم وأغذية',
      retail: 'تجزئة',
      tech: 'تقنية ورقمي',
      ecommerce: 'تجارة إلكترونية',
      consulting: 'استشارات',
      other: 'أخرى',
    },
  },
};

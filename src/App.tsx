import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, 
  Compass, 
  Send, 
  ArrowLeft, 
  Rocket, 
  Globe, 
  ShieldCheck, 
  Zap,
  LayoutDashboard,
  FileText,
  TrendingUp,
  QrCode as QrIcon
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { translations, type Language } from './lib/translations';
import { getAI, MODEL_NAME, SYSTEM_PROMPT } from './lib/gemini';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Message {
  role: 'user' | 'ai';
  content: string;
  type?: 'text' | 'roadmap' | 'bmc' | 'pitch';
}

const BMCBlock = ({ title, icon, content }: { title: string, icon: string, content?: string }) => (
  <div className="p-4 bg-surface-light border border-white/5 rounded-xl space-y-2 h-full">
    <div className="flex items-center gap-2">
      <span className="text-lg">{icon}</span>
      <h4 className="text-[10px] font-bold text-gold uppercase tracking-widest">{title}</h4>
    </div>
    <div className="text-[11px] text-muted leading-relaxed">
      {content ? (
        <div dangerouslySetInnerHTML={{ __html: content.replace(/\*\*(.*?)\*\*/g, '<strong class="text-sand">$1</strong>').split('\n').join('<br />') }} />
      ) : (
        "Analyzing data..."
      )}
    </div>
  </div>
);

export default function App() {
  const [lang, setLang] = useState<Language>('en');
  const [mode, setMode] = useState<'chat' | 'wizard' | 'resources' | 'news' | 'topics'>('chat');
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [roadmapResult, setRoadmapResult] = useState<string | null>(null);
  const [showBMC, setShowBMC] = useState(false);
  
  // Wizard state
  const [wizardData, setWizardData] = useState({
    idea: '',
    nationality: 'saudi',
    city: 'Riyadh',
    budget: 'micro',
    sector: 'food'
  });

  const chatEndRef = useRef<HTMLDivElement>(null);
  const t = translations[lang];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (text?: string) => {
    const messageText = text || input;
    if (!messageText.trim() || isLoading) return;

    const userMsg: Message = { role: 'user', content: messageText };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const ai = getAI();
      const chat = ai.chats.create({
        model: MODEL_NAME,
        config: {
          systemInstruction: SYSTEM_PROMPT,
        },
      });

      // Note: chat.sendMessage only accepts the message parameter
      const result = await chat.sendMessage({ message: messageText });
      const aiMsg: Message = { role: 'ai', content: result.text || 'Error' };
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'ai', content: '⚠️ Connection error. Please try again.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const runWizard = async () => {
    if (!wizardData.idea.trim()) return;
    
    setIsLoading(true);
    setShowResult(true);
    setRoadmapResult(null);

    const prompt = lang === 'ar' 
      ? `أريد تأسيس مشروع في السعودية. التفاصيل:
- الفكرة: ${wizardData.idea}
- الجنسية: ${wizardData.nationality}
- المدينة: ${wizardData.city}
- الميزانية: ${wizardData.budget}
- القطاع: ${wizardData.sector}

أعطني خطة عمل متكاملة تشمل:
1. قصة المشروع (Story)
2. خارطة طريق (Roadmap) بالخطوات الحكومية والتكاليف
3. نموذج العمل التجاري (Business Model Canvas)
4. الأثر والاستدامة (Impact & Sustainability)
5. نصائح للموردين والخدمات.`
      : `I want to start a business in Saudi Arabia. Details:
- Business idea: ${wizardData.idea}
- Nationality: ${wizardData.nationality}
- City: ${wizardData.city}
- Budget: ${wizardData.budget}
- Sector: ${wizardData.sector}

Provide a full business package including:
1. The Story/Narrative of this business
2. A personalized Roadmap with government steps and SAR costs
3. A Business Model Canvas (BMC)
4. Impact & Sustainability analysis
5. Recommended suppliers and services.`;

    try {
      const ai = getAI();
      const result = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          systemInstruction: SYSTEM_PROMPT,
        },
      });
      setRoadmapResult(result.text || '');
    } catch (error) {
      console.error(error);
      setRoadmapResult('⚠️ Error generating roadmap.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatContent = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-gold-light">$1</strong>')
      .replace(/^(\d+)\.\s(.+)$/gm, '<div class="my-2 p-3 bg-teal/10 border-l-2 border-teal rounded-r-lg text-sm"><strong>$1.</strong> $2</div>')
      .replace(/^[-•]\s(.+)$/gm, '<div class="my-1 pl-4 text-sm">→ $1</div>')
      .replace(/(SAR\s[\d,]+(?:\s*[-–]\s*[\d,]+)?)/g, '<span class="inline-block px-2 py-0.5 bg-green-500/10 border border-green-500/25 rounded-full text-[10px] text-green-400 font-semibold">$1</span>')
      .split('\n').join('<br />');
  };

  const extractBMC = (text: string) => {
    const bmcSection = text.split(/Business Model Canvas|نموذج العمل التجاري/i)[1];
    if (!bmcSection) return null;
    
    // Simple parsing logic for BMC blocks
    const blocks = bmcSection.split(/\d\./);
    return blocks.slice(1, 10).map(block => block.trim());
  };

  const NavItem = ({ id, icon: Icon, label }: { id: typeof mode, icon: any, label: string }) => (
    <button 
      onClick={() => { setMode(id); setShowResult(false); }}
      className={cn(
        "flex flex-col items-center justify-center gap-1 px-4 py-2 transition-all border-b-2",
        mode === id ? "border-gold text-gold" : "border-transparent text-muted hover:text-sand"
      )}
    >
      <Icon className="w-5 h-5" />
      <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
    </button>
  );

  return (
    <div className={cn("flex flex-col h-screen overflow-hidden", lang === 'ar' ? 'rtl' : 'ltr')}>
      {/* Top Bar */}
      <header className="flex items-center justify-between px-6 py-4 bg-surface border-b border-white/5 shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-gold to-teal rounded-lg flex items-center justify-center text-lg">🔑</div>
          <div>
            <div className="syne-font text-xl font-extrabold text-gold">Miftah<span className="text-sand font-semibold">.ai</span></div>
            <div className="text-[10px] text-muted font-normal tracking-wider">{t.topbar.logoSub}</div>
          </div>
        </div>
        
        <div className="flex items-center gap-5">
          <div className="hidden sm:flex items-center gap-2 text-[10px] text-muted tracking-widest uppercase">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            {t.topbar.status}
          </div>
          
          <div className="flex bg-surface-light border border-white/10 rounded-md overflow-hidden">
            <button 
              onClick={() => setLang('en')}
              className={cn("px-3 py-1 text-xs font-medium transition-colors", lang === 'en' ? 'bg-gold text-bg' : 'text-muted hover:text-sand')}
            >EN</button>
            <button 
              onClick={() => setLang('ar')}
              className={cn("px-3 py-1 text-xs font-medium transition-colors arabic-font", lang === 'ar' ? 'bg-gold text-bg' : 'text-muted hover:text-sand')}
            >عر</button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="flex items-center justify-center bg-surface border-b border-white/5 shrink-0 z-10 overflow-x-auto no-scrollbar">
        <NavItem id="chat" icon={MessageSquare} label={t.sidebar.chat} />
        <NavItem id="wizard" icon={Compass} label={t.sidebar.wizard} />
        <NavItem id="topics" icon={FileText} label={t.sidebar.topics} />
        <NavItem id="resources" icon={Globe} label={lang === 'en' ? 'Resources' : 'الموارد'} />
        <NavItem id="news" icon={Zap} label={lang === 'en' ? 'Vision News' : 'أخبار الرؤية'} />
      </nav>

      <main className="flex flex-1 overflow-hidden relative">
        {/* Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden bg-bg">
          <AnimatePresence mode="wait">
            {mode === 'chat' && (
              <motion.div 
                key="chat"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="flex-1 flex flex-col overflow-hidden"
              >
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
                  {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center max-w-2xl mx-auto space-y-8">
                      <div className="text-6xl">🔑</div>
                      <div className="space-y-2">
                        <div className="arabic-font text-2xl text-gold font-semibold">{t.chat.emptyArabic}</div>
                        <div className="syne-font text-3xl font-bold text-sand">{t.chat.emptyTitle}</div>
                        <p className="text-sm text-muted leading-relaxed max-w-md mx-auto">{t.chat.emptySub}</p>
                      </div>
                      
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full">
                        {t.chat.suggests.map((s, i) => (
                          <button 
                            key={i}
                            onClick={() => {
                              setMode('topics');
                              setSelectedTopic(s.text);
                            }}
                            className="flex flex-col items-center gap-2 p-4 bg-surface border border-white/5 rounded-xl hover:border-gold/30 hover:bg-surface-light transition-all text-center group"
                          >
                            <span className="text-2xl group-hover:scale-110 transition-transform">{s.icon}</span>
                            <span className="text-[10px] text-sand font-bold uppercase tracking-wider">{s.text}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="max-w-4xl mx-auto w-full space-y-6">
                      {messages.map((m, i) => (
                        <div key={i} className={cn("flex gap-4", m.role === 'user' ? "flex-row-reverse" : "flex-row")}>
                          <div className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0",
                            m.role === 'ai' ? "bg-gradient-to-br from-gold to-teal" : "bg-surface-light border border-white/10"
                          )}>
                            {m.role === 'ai' ? '🔑' : '👤'}
                          </div>
                          <div className="max-w-[85%] space-y-1">
                            <div className={cn(
                              "p-4 text-sm leading-relaxed rounded-2xl shadow-lg",
                              m.role === 'ai' 
                                ? "bg-surface border border-white/5 rounded-tl-none text-sand" 
                                : "bg-gold/10 border border-gold/20 rounded-tr-none text-sand"
                            )}>
                              <div dangerouslySetInnerHTML={{ __html: formatContent(m.content) }} />
                            </div>
                          </div>
                        </div>
                      ))}
                      {isLoading && (
                        <div className="flex gap-4">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gold to-teal flex items-center justify-center text-sm shrink-0">🔑</div>
                          <div className="bg-surface border border-white/5 p-4 rounded-2xl rounded-tl-none">
                            <div className="flex gap-1">
                              <motion.span animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.2 }} className="w-1.5 h-1.5 bg-gold rounded-full" />
                              <motion.span animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.2, delay: 0.2 }} className="w-1.5 h-1.5 bg-gold rounded-full" />
                              <motion.span animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.2, delay: 0.4 }} className="w-1.5 h-1.5 bg-gold rounded-full" />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                <div className="p-4 sm:p-6 bg-surface border-t border-white/5">
                  <div className="max-w-4xl mx-auto flex gap-3 items-end">
                    <textarea 
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                      placeholder={t.chat.placeholder}
                      className="flex-1 bg-surface-light border border-white/10 rounded-xl px-4 py-3 text-sm text-sand outline-none focus:border-gold/40 transition-colors resize-none min-h-[48px] max-h-32"
                      rows={1}
                    />
                    <button 
                      onClick={() => handleSend()}
                      disabled={!input.trim() || isLoading}
                      className="w-12 h-12 rounded-xl bg-gold text-bg flex items-center justify-center hover:bg-gold-light transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0 shadow-lg shadow-gold/10"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {mode === 'wizard' && (
              <motion.div 
                key="wizard"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex-1 overflow-y-auto p-6 sm:p-10"
              >
                {!showResult ? (
                  <div className="max-w-3xl mx-auto space-y-8">
                    <div className="space-y-2">
                      <h2 className="syne-font text-3xl font-bold text-sand">{t.wizard.title} <span className="text-gold">{t.wizard.titleAccent}</span></h2>
                      <p className="text-sm text-muted leading-relaxed">{t.wizard.sub}</p>
                    </div>

                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-xs font-bold text-sand uppercase tracking-wider">
                          <span className="arabic-font text-[10px] text-muted">فكرة المشروع</span>
                          {t.wizard.idea}
                        </label>
                        <textarea 
                          value={wizardData.idea}
                          onChange={(e) => setWizardData(prev => ({ ...prev, idea: e.target.value }))}
                          placeholder="e.g. Online food delivery, retail clothing store, IT consulting..."
                          className="w-full bg-surface border border-white/10 rounded-xl p-4 text-sm text-sand outline-none focus:border-gold/40 transition-colors min-h-[100px]"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="flex items-center gap-2 text-xs font-bold text-sand uppercase tracking-wider">
                            <span className="arabic-font text-[10px] text-muted">الجنسية</span>
                            {t.wizard.nationality}
                          </label>
                          <select 
                            value={wizardData.nationality}
                            onChange={(e) => setWizardData(prev => ({ ...prev, nationality: e.target.value }))}
                            className="w-full bg-surface border border-white/10 rounded-xl p-3 text-sm text-sand outline-none focus:border-gold/40 transition-colors appearance-none"
                          >
                            <option value="saudi">{t.nationalities.saudi}</option>
                            <option value="gcc">{t.nationalities.gcc}</option>
                            <option value="expat">{t.nationalities.expat}</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="flex items-center gap-2 text-xs font-bold text-sand uppercase tracking-wider">
                            <span className="arabic-font text-[10px] text-muted">المدينة</span>
                            {t.wizard.city}
                          </label>
                          <select 
                            value={wizardData.city}
                            onChange={(e) => setWizardData(prev => ({ ...prev, city: e.target.value }))}
                            className="w-full bg-surface border border-white/10 rounded-xl p-3 text-sm text-sand outline-none focus:border-gold/40 transition-colors"
                          >
                            <option>Riyadh</option>
                            <option>Dammam</option>
                            <option>Jeddah</option>
                            <option>Mecca</option>
                            <option>Medina</option>
                            <option>Other</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-xs font-bold text-sand uppercase tracking-wider">
                          <span className="arabic-font text-[10px] text-muted">الميزانية التقريبية</span>
                          {t.wizard.budget}
                        </label>
                        <select 
                          value={wizardData.budget}
                          onChange={(e) => setWizardData(prev => ({ ...prev, budget: e.target.value }))}
                          className="w-full bg-surface border border-white/10 rounded-xl p-3 text-sm text-sand outline-none focus:border-gold/40 transition-colors"
                        >
                          <option value="micro">{t.budgets.micro}</option>
                          <option value="small">{t.budgets.small}</option>
                          <option value="medium">{t.budgets.medium}</option>
                          <option value="large">{t.budgets.large}</option>
                        </select>
                      </div>

                      <div className="space-y-4">
                        <label className="flex items-center gap-2 text-xs font-bold text-sand uppercase tracking-wider">
                          <span className="arabic-font text-[10px] text-muted">القطاع</span>
                          {t.wizard.sector}
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {[
                            { id: 'food', icon: '🍽️', label: t.sectors.food },
                            { id: 'retail', icon: '🛍️', label: t.sectors.retail },
                            { id: 'tech', icon: '💻', label: t.sectors.tech },
                            { id: 'ecommerce', icon: '📦', label: t.sectors.ecommerce },
                            { id: 'consulting', icon: '📋', label: t.sectors.consulting },
                            { id: 'other', icon: '✨', label: t.sectors.other },
                          ].map((s) => (
                            <button 
                              key={s.id}
                              onClick={() => setWizardData(prev => ({ ...prev, sector: s.id }))}
                              className={cn(
                                "p-4 border rounded-xl flex flex-col items-center gap-2 transition-all",
                                wizardData.sector === s.id 
                                  ? "bg-gold/10 border-gold text-gold-light" 
                                  : "bg-surface border-white/10 text-muted hover:border-white/30"
                              )}
                            >
                              <span className="text-2xl">{s.icon}</span>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-center">{s.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <button 
                        onClick={runWizard}
                        disabled={!wizardData.idea.trim() || isLoading}
                        className="w-full py-4 bg-gold text-bg rounded-xl syne-font font-bold text-lg flex items-center justify-center gap-3 hover:bg-gold-light transition-all disabled:opacity-40 shadow-lg shadow-gold/10"
                      >
                        <Rocket className="w-6 h-6" />
                        {t.wizard.generate}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="max-w-4xl mx-auto space-y-8">
                    <button 
                      onClick={() => setShowResult(false)}
                      className="flex items-center gap-2 text-xs font-bold text-muted hover:text-gold transition-colors uppercase tracking-widest"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      {t.wizard.back}
                    </button>

                    {isLoading ? (
                      <div className="flex flex-col items-center justify-center py-20 space-y-6">
                        <motion.div 
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                          className="text-5xl"
                        >⏳</motion.div>
                        <div className="text-center space-y-2">
                          <div className="syne-font text-xl font-bold text-sand">Generating your roadmap...</div>
                          <p className="text-xs text-muted">Our AI is analyzing KSA regulations and market data.</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-8">
                        <div className="p-6 sm:p-8 bg-surface border border-white/5 rounded-2xl space-y-6 shadow-xl">
                          <div className="flex items-center justify-between">
                            <span className="px-3 py-1 bg-gold/10 border border-gold/30 rounded text-[10px] font-bold text-gold uppercase tracking-widest">
                              {t.wizard.roadmap}
                            </span>
                            <div className="flex gap-2">
                              <button className="p-2 bg-surface-light border border-white/10 rounded-lg hover:border-gold/50 transition-colors" title="Download PDF"><FileText className="w-4 h-4 text-muted" /></button>
                              <button className="p-2 bg-surface-light border border-white/10 rounded-lg hover:border-gold/50 transition-colors" title="View Market Trends"><TrendingUp className="w-4 h-4 text-muted" /></button>
                              <button className="px-3 py-1 bg-gold/20 border border-gold/40 rounded-lg text-[10px] font-bold text-gold uppercase tracking-widest hover:bg-gold/30 transition-all flex items-center gap-2">
                                <Zap className="w-3 h-3" />
                                Full Pitch Deck
                              </button>
                            </div>
                          </div>
                          
                          <div className="prose prose-invert max-w-none">
                            <div dangerouslySetInnerHTML={{ __html: formatContent(roadmapResult || '') }} />
                          </div>
                        </div>

                        {/* Pitch Deck / QR Section */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="p-6 bg-surface border border-white/5 rounded-2xl space-y-4 shadow-lg">
                            <div className="flex items-center gap-3 text-gold">
                              <LayoutDashboard className="w-5 h-5" />
                              <h3 className="syne-font font-bold uppercase tracking-wider">Business Canvas</h3>
                            </div>
                            <p className="text-xs text-muted leading-relaxed">
                              Your full Business Model Canvas has been generated based on the Vision 2030 framework. 
                              Click below to view the detailed breakdown of partners, value prop, and revenue streams.
                            </p>
                            <button 
                              onClick={() => setShowBMC(true)}
                              className="w-full py-2 bg-surface-light border border-white/10 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-gold/10 hover:border-gold/30 transition-all"
                            >
                              View Full Canvas
                            </button>
                          </div>

                          <div className="p-6 bg-surface border border-white/5 rounded-2xl space-y-4 shadow-lg">
                            <div className="flex items-center gap-3 text-teal">
                              <TrendingUp className="w-5 h-5" />
                              <h3 className="syne-font font-bold uppercase tracking-wider">Business Phases</h3>
                            </div>
                            <div className="space-y-3">
                              {[
                                { step: 1, label: 'Ideation & Strategy', desc: 'Define your value prop and target market.' },
                                { step: 2, label: 'Legal & Licensing', desc: 'Register CR and obtain necessary permits.' },
                                { step: 3, label: 'Operational Setup', desc: 'Secure location, suppliers, and team.' },
                                { step: 4, label: 'Market Launch', desc: 'Execute marketing and start operations.' }
                              ].map((p, i) => (
                                <div key={i} className="flex items-start gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors">
                                  <div className="w-6 h-6 rounded-full bg-teal/20 border border-teal/30 flex items-center justify-center text-[10px] font-bold text-teal shrink-0">
                                    {p.step}
                                  </div>
                                  <div>
                                    <h4 className="text-[10px] font-bold text-sand uppercase tracking-wider">{p.label}</h4>
                                    <p className="text-[9px] text-muted leading-tight">{p.desc}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                            <button 
                              onClick={() => {
                                setMode('chat');
                                setMessages(prev => [...prev, {
                                  role: 'user',
                                  content: `I'd like to discuss and refine the roadmap for "${wizardData.name}". Can we look at the phases again?`
                                }]);
                                setShowResult(false);
                              }}
                              className="w-full py-2 mt-2 bg-teal/10 border border-teal/30 rounded-lg text-[10px] font-bold text-teal uppercase tracking-widest hover:bg-teal/20 transition-all flex items-center justify-center gap-2"
                            >
                              <MessageSquare className="w-3 h-3" />
                              Discuss & Refine
                            </button>
                          </div>
                        </div>

                        {/* BMC Modal */}
                        <AnimatePresence>
                          {showBMC && (
                            <motion.div 
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg/80 backdrop-blur-sm"
                            >
                              <motion.div 
                                initial={{ scale: 0.9, y: 20 }}
                                animate={{ scale: 1, y: 0 }}
                                exit={{ scale: 0.9, y: 20 }}
                                className="bg-surface border border-white/10 rounded-3xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
                              >
                                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <LayoutDashboard className="w-6 h-6 text-gold" />
                                    <h2 className="syne-font text-xl font-bold text-sand uppercase tracking-wider">Business Model Canvas</h2>
                                  </div>
                                  <button 
                                    onClick={() => setShowBMC(false)}
                                    className="p-2 hover:bg-surface-light rounded-lg transition-colors"
                                  >
                                    <ArrowLeft className="w-5 h-5 text-muted" />
                                  </button>
                                </div>
                                
                                <div className="flex-1 overflow-y-auto p-6">
                                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                                    {/* BMC Grid Layout */}
                                    <div className="md:col-span-1 space-y-4">
                                      <BMCBlock title="Key Partners" icon="🤝" content={extractBMC(roadmapResult || '')?.[0]} />
                                      <BMCBlock title="Key Activities" icon="⚡" content={extractBMC(roadmapResult || '')?.[1]} />
                                    </div>
                                    <div className="md:col-span-1 space-y-4">
                                      <BMCBlock title="Key Resources" icon="🏗️" content={extractBMC(roadmapResult || '')?.[2]} />
                                      <BMCBlock title="Value Propositions" icon="💎" content={extractBMC(roadmapResult || '')?.[3]} />
                                    </div>
                                    <div className="md:col-span-1 space-y-4">
                                      <BMCBlock title="Customer Relationships" icon="❤️" content={extractBMC(roadmapResult || '')?.[4]} />
                                      <BMCBlock title="Channels" icon="📢" content={extractBMC(roadmapResult || '')?.[5]} />
                                    </div>
                                    <div className="md:col-span-1 space-y-4">
                                      <BMCBlock title="Customer Segments" icon="👥" content={extractBMC(roadmapResult || '')?.[6]} />
                                    </div>
                                    <div className="md:col-span-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <BMCBlock title="Cost Structure" icon="💰" content={extractBMC(roadmapResult || '')?.[7]} />
                                      <BMCBlock title="Revenue Streams" icon="📈" content={extractBMC(roadmapResult || '')?.[8]} />
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {mode === 'topics' && (
              <motion.div 
                key="topics"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex-1 overflow-y-auto p-6 sm:p-10"
              >
                <div className="max-w-5xl mx-auto space-y-8">
                  {!selectedTopic ? (
                    <>
                      <div className="space-y-2">
                        <h2 className="syne-font text-3xl font-bold text-sand">{t.sidebar.topics}</h2>
                        <p className="text-sm text-muted">{lang === 'en' ? 'Deep dives into essential Saudi business requirements.' : 'تعمق في متطلبات الأعمال السعودية الأساسية.'}</p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {t.chat.suggests.map((s, i) => (
                          <button 
                            key={i}
                            onClick={() => setSelectedTopic(s.text)}
                            className="p-6 bg-surface border border-white/5 rounded-2xl hover:border-gold/30 hover:bg-surface-light transition-all text-left group flex flex-col gap-4"
                          >
                            <span className="text-4xl group-hover:scale-110 transition-transform">{s.icon}</span>
                            <div>
                              <h3 className="font-bold text-sand text-sm uppercase tracking-wider mb-1">{s.text}</h3>
                              <p className="text-[10px] text-muted leading-relaxed">
                                {lang === 'en' ? `Learn everything about ${s.text.toLowerCase()} in Saudi Arabia.` : `تعلم كل شيء عن ${s.text} في المملكة العربية السعودية.`}
                              </p>
                            </div>
                            <div className="mt-auto pt-4 flex items-center gap-2 text-[10px] font-bold text-gold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                              {lang === 'en' ? 'Read Guide' : 'اقرأ الدليل'}
                              <ArrowLeft className={cn("w-3 h-3", lang === 'ar' ? "" : "rotate-180")} />
                            </div>
                          </button>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="space-y-8">
                      <button 
                        onClick={() => setSelectedTopic(null)}
                        className="flex items-center gap-2 text-xs font-bold text-muted hover:text-gold transition-colors uppercase tracking-widest"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        {lang === 'en' ? 'Back to Topics' : 'العودة للمواضيع'}
                      </button>

                      <div className="p-8 bg-surface border border-white/5 rounded-2xl space-y-6 shadow-xl">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gold/10 rounded-xl flex items-center justify-center text-2xl">
                            {t.chat.suggests.find(s => s.text === selectedTopic)?.icon || '📄'}
                          </div>
                          <h2 className="syne-font text-3xl font-bold text-sand">{selectedTopic}</h2>
                        </div>

                        <div className="prose prose-invert max-w-none space-y-6 text-muted">
                          {/* Mock content for each topic */}
                          {selectedTopic.includes('Register') || selectedTopic.includes('تسجيل') ? (
                            <div className="space-y-4">
                              <p>Registering a company in Saudi Arabia has been significantly streamlined under Vision 2030. The process is now primarily digital through the Ministry of Commerce.</p>
                              <h4 className="text-gold font-bold">Key Steps:</h4>
                              <ul className="list-disc pl-5 space-y-2">
                                <li>Choose your business activity and legal form (LLC, Sole Proprietorship, etc.).</li>
                                <li>Reserve your trade name via the MC portal.</li>
                                <li>Submit the Articles of Association.</li>
                                <li>Issue the Commercial Registration (CR).</li>
                              </ul>
                              <div className="p-4 bg-teal/10 border border-teal/20 rounded-xl">
                                <p className="text-xs text-teal-400 font-medium">Pro Tip: Ensure your business activity matches the ISIC4 codes to avoid delays in licensing.</p>
                              </div>
                            </div>
                          ) : selectedTopic.includes('CR') || selectedTopic.includes('سجل') ? (
                            <div className="space-y-4">
                              <p>The Commercial Registration (CR) is the birth certificate of your business in KSA. It is issued by the Ministry of Commerce.</p>
                              <h4 className="text-gold font-bold">Requirements:</h4>
                              <ul className="list-disc pl-5 space-y-2">
                                <li>National ID or Iqama of the owner/partners.</li>
                                <li>A valid address (National Address).</li>
                                <li>Payment of registration fees (approx. SAR 200-500 depending on the type).</li>
                              </ul>
                            </div>
                          ) : selectedTopic.includes('MISA') || selectedTopic.includes('استثمار') ? (
                            <div className="space-y-4">
                              <p>The Ministry of Investment (MISA) license is required for foreign investors wanting to own 100% of their business in Saudi Arabia.</p>
                              <h4 className="text-gold font-bold">License Types:</h4>
                              <ul className="list-disc pl-5 space-y-2">
                                <li>Service License (Consulting, IT, etc.).</li>
                                <li>Industrial License.</li>
                                <li>Trading License (Retail/Wholesale).</li>
                              </ul>
                              <p>MISA has recently introduced a "Premium Residency" option that simplifies these steps for high-net-worth individuals.</p>
                            </div>
                          ) : selectedTopic.includes('Food') || selectedTopic.includes('أغذية') ? (
                            <div className="space-y-4">
                              <p>Opening a food business requires approvals from Balady (Municipality) and the Saudi Food and Drug Authority (SFDA).</p>
                              <h4 className="text-gold font-bold">Checklist:</h4>
                              <ul className="list-disc pl-5 space-y-2">
                                <li>Shop location approval (Balady).</li>
                                <li>Health certificates for all staff.</li>
                                <li>Interior design approval (Civil Defense).</li>
                                <li>Menu approval (if specialized).</li>
                              </ul>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              <p>{lang === 'en' ? 'Detailed guide for' : 'دليل مفصل لـ'} {selectedTopic} {lang === 'en' ? 'is being prepared by our AI advisors.' : 'يتم تحضيره بواسطة مستشارينا الذكيين.'}</p>
                              <p>{lang === 'en' ? 'This section will include regulatory requirements, costs, and step-by-step procedures specific to the Saudi market.' : 'سيشمل هذا القسم المتطلبات التنظيمية والتكاليف والإجراءات خطوة بخطوة الخاصة بالسوق السعودي.'}</p>
                              <button 
                                onClick={() => {
                                  setMode('chat');
                                  handleSend(lang === 'en' ? `Tell me more about ${selectedTopic}` : `أخبرني المزيد عن ${selectedTopic}`);
                                  setSelectedTopic(null);
                                }}
                                className="px-6 py-3 bg-gold text-bg rounded-xl font-bold hover:bg-gold-light transition-colors"
                              >
                                {lang === 'en' ? 'Ask AI for Details' : 'اسأل الذكاء الاصطناعي عن التفاصيل'}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {mode === 'resources' && (
              <motion.div 
                key="resources"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="flex-1 overflow-y-auto p-6 sm:p-10"
              >
                <div className="max-w-4xl mx-auto space-y-8">
                  <div className="space-y-2">
                    <h2 className="syne-font text-3xl font-bold text-sand">{lang === 'en' ? 'Official' : 'البوابات'} <span className="text-gold">{lang === 'en' ? 'Portals' : 'الرسمية'}</span></h2>
                    <p className="text-sm text-muted">{lang === 'en' ? 'Quick access to essential Saudi government business portals.' : 'وصول سريع إلى بوابات الأعمال الحكومية السعودية الأساسية.'}</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { name: 'Ministry of Commerce', url: 'https://mc.gov.sa', desc: 'CR registration and renewals', icon: '🏢' },
                      { name: 'MISA', url: 'https://misa.gov.sa', desc: 'Foreign investment licenses', icon: '🌍' },
                      { name: 'Monsha\'at', url: 'https://monshaat.gov.sa', desc: 'SME support and funding', icon: '📈' },
                      { name: 'ZATCA', url: 'https://zatca.gov.sa', desc: 'VAT and tax compliance', icon: '📄' },
                      { name: 'Balady', url: 'https://balady.gov.sa', desc: 'Municipal licenses', icon: '🏘️' },
                      { name: 'Qiwa', url: 'https://qiwa.sa', desc: 'Labor and employment services', icon: '👥' },
                    ].map((r, i) => (
                      <a 
                        key={i}
                        href={r.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-6 bg-surface border border-white/5 rounded-2xl hover:border-gold/30 hover:bg-surface-light transition-all group"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-3xl">{r.icon}</span>
                          <div className="w-8 h-8 rounded-full bg-surface-light flex items-center justify-center group-hover:bg-gold group-hover:text-bg transition-colors">
                            <TrendingUp className="w-4 h-4" />
                          </div>
                        </div>
                        <h3 className="font-bold text-sand mb-1">{r.name}</h3>
                        <p className="text-xs text-muted">{r.desc}</p>
                      </a>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {mode === 'news' && (
              <motion.div 
                key="news"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex-1 overflow-y-auto p-6 sm:p-10"
              >
                <div className="max-w-4xl mx-auto space-y-8">
                  <div className="space-y-2">
                    <h2 className="syne-font text-3xl font-bold text-sand">Vision 2030 <span className="text-gold">Updates</span></h2>
                    <p className="text-sm text-muted">{lang === 'en' ? 'Stay updated with the latest business regulations and Vision 2030 initiatives.' : 'ابق على اطلاع بآخر لوائح الأعمال ومبادرات رؤية 2030.'}</p>
                  </div>

                  <div className="space-y-4">
                    {[
                      { date: 'March 11, 2026', title: 'New SME Funding Initiative Launched', category: 'Finance', content: 'Monsha\'at announces a new SAR 2B fund specifically for tech startups in the logistics sector.' },
                      { date: 'March 05, 2026', title: 'MISA Simplifies Foreign License Process', category: 'Regulation', content: 'The Ministry of Investment has reduced the processing time for foreign investment licenses to under 24 hours.' },
                      { date: 'Feb 28, 2026', title: 'E-Commerce Growth Hits Record High', category: 'Market', content: 'Saudi Arabia\'s e-commerce sector grew by 32% in the last quarter, driven by local retail platforms.' },
                    ].map((n, i) => (
                      <div key={i} className="p-6 bg-surface border border-white/5 rounded-2xl space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-gold uppercase tracking-widest">{n.category}</span>
                          <span className="text-[10px] text-muted">{n.date}</span>
                        </div>
                        <h3 className="font-bold text-sand text-lg">{n.title}</h3>
                        <p className="text-sm text-muted leading-relaxed">{n.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

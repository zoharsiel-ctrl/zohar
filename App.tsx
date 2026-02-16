import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { 
  Search, Plus, Bell, User as UserIcon, LayoutGrid, X, ShieldCheck, Star, Zap, 
  Award, MapPin, ChevronLeft, Handshake, Share2, MessageCircle, Loader2, 
  Camera, History, PackageCheck, Copy, QrCode, Link as LinkIcon, Smartphone, 
  Users, Filter, Shield, ChevronRight, Lock, Map, CheckCircle2, Heart, Sparkles,
  ArrowRight, Info, Check, Clock, Globe, Download, Wand2, Trophy, Settings,
  CreditCard, LogOut, ChevronUp, BarChart3, Table, Monitor, Layout, Activity,
  Cpu, Database, Terminal, Settings2, RefreshCw, Eye, MousePointer2, TrendingUp,
  AlertTriangle, Rocket, Github, Share, FileText, Server, Code, ExternalLink,
  Globe2
} from 'lucide-react';
import { Item, User, ItemCategory, FAQ } from './types';
import { MOCK_ITEMS, MOCK_USERS } from './constants';
import ItemCard from './components/ItemCard';
import InsuranceBanner from './components/InsuranceBanner';
import TrustBadge from './components/TrustBadge';
import { getSmartSearchResults, getSmartItemAnalysis } from './services/gemini';

// --- UI Components ---

const StMetric: React.FC<{ label: string; value: string; delta?: string; icon?: React.ReactNode }> = ({ label, value, delta, icon }) => (
  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
    <div className="flex items-center justify-between mb-4">
      <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{label}</p>
      <div className="text-emerald-500 group-hover:scale-110 transition-transform">{icon}</div>
    </div>
    <div className="flex items-baseline gap-3">
      <h4 className="text-3xl font-black text-slate-900 tracking-tighter">{value}</h4>
      {delta && <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">↑ {delta}</span>}
    </div>
  </div>
);

const StSidebarItem: React.FC<{ icon: React.ReactNode; label: string; active?: boolean; onClick: () => void }> = ({ icon, label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-4 p-4 rounded-xl font-bold text-sm transition-all ${
      active ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400 hover:bg-white/5 hover:text-white'
    }`}
  >
    {icon} <span>{label}</span>
  </button>
);

const Logo: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
  const isLarge = size === 'lg';
  const isSmall = size === 'sm';
  return (
    <div className="flex items-center gap-3 group">
      <div className={`bg-gradient-to-br from-emerald-600 to-teal-500 p-3 rounded-2xl text-white shadow-lg group-hover:rotate-12 transition-transform`}>
        <Handshake size={isLarge ? 32 : isSmall ? 18 : 24} />
      </div>
      <span className={`${isLarge ? 'text-3xl' : isSmall ? 'text-lg' : 'text-xl'} font-black text-slate-900 tracking-tighter leading-none`}>
        Neighbor<span className="text-emerald-600">Share</span>
      </span>
    </div>
  );
};

// --- Main App ---

const App: React.FC = () => {
  // Navigation State
  const [appState, setAppState] = useState<'auth' | 'main' | 'dashboard'>(() => {
    return localStorage.getItem('neighbor_auth') ? 'main' : 'auth';
  });
  const [activeTab, setActiveTab] = useState<'explore' | 'profile'>('explore');
  const [dashboardView, setDashboardView] = useState<'overview' | 'launch' | 'analytics' | 'ai' | 'data'>('overview');
  
  // Data & Analytics State
  const [items, setItems] = useState<Item[]>(() => {
    const saved = localStorage.getItem('neighbor_share_items');
    return saved ? JSON.parse(saved) : MOCK_ITEMS;
  });
  const [userStats, setUserStats] = useState(() => {
    const saved = localStorage.getItem('neighbor_share_user');
    return saved ? JSON.parse(saved) : { points: 1250, level: 'גיבור השכונה', isPro: false, aiUsage: 0 };
  });
  const [events, setEvents] = useState<{ id: string; type: string; details: string; time: string; status?: 'success' | 'warn' | 'error' }[]>([]);
  const [isLiveInProd, setIsLiveInProd] = useState(true);

  // UI Components
  const [searchQuery, setSearchQuery] = useState('');
  const [isAISearching, setIsAISearching] = useState(false);
  const [aiResultIds, setAiResultIds] = useState<string[] | null>(null);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [toast, setToast] = useState<{message: string, icon?: React.ReactNode} | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  
  // Auth & Add Item Form
  const [authEmail, setAuthEmail] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState<number>(0);
  const [newItemDesc, setNewItemDesc] = useState('');
  const [newItemCategory, setNewItemCategory] = useState<ItemCategory>(ItemCategory.TOOLS);
  const [newItemImage, setNewItemImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Persistence
  useEffect(() => {
    localStorage.setItem('neighbor_share_items', JSON.stringify(items));
    localStorage.setItem('neighbor_share_user', JSON.stringify(userStats));
  }, [items, userStats]);

  // Analytics Helper
  const trackEvent = useCallback((type: string, details: string, status: 'success' | 'warn' | 'error' = 'success') => {
    const newEvent = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      details,
      status,
      time: new Date().toLocaleTimeString('he-IL')
    };
    setEvents(prev => [newEvent, ...prev].slice(0, 50));
  }, []);

  const showToast = useCallback((message: string, icon?: React.ReactNode) => {
    setToast({ message, icon });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    trackEvent('Auth', `User login attempt: ${authEmail}`);
    setTimeout(() => {
      localStorage.setItem('neighbor_auth', 'true');
      setAppState('main');
      setIsLoggingIn(false);
      trackEvent('Auth', `Login successful: ${authEmail}`);
      showToast("ברוכים הבאים הביתה!", <CheckCircle2 size={18}/>);
    }, 1200);
  };

  const handleUpgradePro = () => {
    setIsCheckoutOpen(false);
    setUserStats(prev => ({ ...prev, isPro: true, aiUsage: 0 }));
    setShowConfetti(true);
    trackEvent('Monetization', 'User upgraded to PRO');
    showToast("ברוך הבא ל-Neighbor Pro!", <Zap size={18} className="text-amber-500" />);
    setTimeout(() => setShowConfetti(false), 3000);
  };

  const handleMagicFill = async () => {
    if (!userStats.isPro && userStats.aiUsage >= 3) {
      showToast("הגעת למכסה היומית (3 פעולות)", <AlertTriangle size={18} className="text-amber-500" />);
      setIsCheckoutOpen(true);
      return;
    }
    if (!newItemName) return showToast("הכנס שם מוצר קודם", <Info size={18}/>);
    setIsAnalyzing(true);
    trackEvent('AI_Agent', `Analyzing item: ${newItemName}`);
    const res = await getSmartItemAnalysis(newItemName);
    setIsAnalyzing(false);
    if (res) {
      try {
        const data = JSON.parse(res);
        setNewItemDesc(data.description || "");
        setNewItemPrice(data.price || 0);
        setUserStats(prev => ({ ...prev, aiUsage: prev.aiUsage + 1 }));
        showToast("ה-AI השלים את הפרטים!", <Sparkles size={18} className="text-amber-400" />);
        trackEvent('AI_Agent', `Analysis success for: ${newItemName}`);
      } catch(e) {
        trackEvent('AI_Agent', `Analysis parse error`, 'error');
      }
    }
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    const newItem: Item = {
      id: `i${Date.now()}`,
      ownerId: 'u1',
      name: newItemName,
      description: newItemDesc,
      category: newItemCategory,
      pricePerDay: newItemPrice,
      images: [newItemImage || 'https://picsum.photos/seed/neighbor/400/300'],
      isAvailable: true,
      insuranceCovered: true,
      condition: 'במצב טוב'
    };
    setItems([newItem, ...items]);
    setIsAddingItem(false);
    setNewItemName(''); setNewItemDesc(''); setNewItemPrice(0); setNewItemImage(null);
    showToast("הפריט פורסם בהצלחה!", <PackageCheck size={18}/>);
    trackEvent('Inventory', `Item added: ${newItem.name}`);
    setUserStats(prev => ({ ...prev, points: prev.points + 100 }));
  };

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.length < 3) return setAiResultIds(null);
      setIsAISearching(true);
      const res = await getSmartSearchResults(searchQuery, items);
      setAiResultIds(res);
      setIsAISearching(false);
      trackEvent('Search', `User searched for: ${searchQuery}`);
    }, 800);
    return () => clearTimeout(timer);
  }, [searchQuery, items]);

  const currentUser = useMemo(() => ({ ...MOCK_USERS[0], ...userStats }), [userStats]);
  const filteredItems = useMemo(() => {
    if (aiResultIds) return items.filter(i => aiResultIds.includes(i.id));
    if (!searchQuery) return items;
    return items.filter(i => i.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [items, searchQuery, aiResultIds]);

  // --- Views ---

  if (appState === 'auth') {
    return (
      <div className="h-full bg-slate-50 flex items-center justify-center p-6" dir="rtl">
        <div className="w-full max-w-md bg-white p-12 rounded-[50px] shadow-2xl border border-slate-100 text-center animate-in fade-in duration-500">
           <Logo size="lg" />
           <div className="mt-8 mb-10">
              <h2 className="text-2xl font-black text-slate-900 leading-none">התחברות לקהילה</h2>
              <p className="text-slate-400 font-medium text-sm mt-3">פשוט, בטוח וקרוב לבית.</p>
           </div>
           <form onSubmit={handleLogin} className="space-y-6">
              <div className="text-right space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-4">אימייל</label>
                 <input type="email" required className="w-full p-5 bg-slate-50 border border-slate-200 rounded-3xl outline-none font-bold focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition-all" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} placeholder="name@email.com" />
              </div>
              <button type="submit" disabled={isLoggingIn} className="w-full bg-slate-900 text-white py-6 rounded-[30px] font-black text-xl shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3">
                 {isLoggingIn ? <Loader2 className="animate-spin" /> : <>כניסה <ChevronLeft size={20}/></>}
              </button>
           </form>
           <button onClick={() => setAppState('dashboard')} className="mt-8 text-emerald-600 font-black text-xs uppercase tracking-widest hover:underline">Console Dashboard</button>
        </div>
      </div>
    );
  }

  if (appState === 'dashboard') {
    const gitRepoUrl = "https://github.com/zoharsiel-ctrl/zohar.git";

    return (
      <div className="h-full bg-slate-900 flex flex-col md:flex-row" dir="rtl">
        {/* Streamlit Sidebar */}
        <div className="w-full md:w-72 bg-slate-950/50 backdrop-blur-xl border-l border-white/5 p-8 flex flex-col gap-10">
           <div className="flex items-center gap-3" onClick={() => setAppState('main')}><Monitor size={24} className="text-emerald-400 cursor-pointer"/><span className="text-xl font-black text-white tracking-tighter cursor-pointer">Neighbor Console</span></div>
           <nav className="flex-1 space-y-2 text-right">
              <StSidebarItem icon={<BarChart3 size={20}/>} label="מטריקות" active={dashboardView === 'overview'} onClick={() => setDashboardView('overview')} />
              <StSidebarItem icon={<Rocket size={20}/>} label="Launch Pad" active={dashboardView === 'launch'} onClick={() => setDashboardView('launch')} />
              <StSidebarItem icon={<MousePointer2 size={20}/>} label="Product Analytics" active={dashboardView === 'analytics'} onClick={() => setDashboardView('analytics')} />
              <StSidebarItem icon={<Table size={20}/>} label="Inventory Data" active={dashboardView === 'data'} onClick={() => setDashboardView('data')} />
              <StSidebarItem icon={<Cpu size={20}/>} label="AI Monitor" active={dashboardView === 'ai'} onClick={() => setDashboardView('ai')} />
              <div className="h-px bg-white/5 my-6" />
              <StSidebarItem icon={<Layout size={20}/>} label="חזרה לאפליקציה" onClick={() => setAppState('main')} />
           </nav>
           <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl flex items-center gap-3">
              <div className="w-2 h-2 rounded-full animate-pulse bg-emerald-500" />
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">All Systems Operational</span>
           </div>
        </div>

        {/* Streamlit Main Content */}
        <div className="flex-1 overflow-y-auto bg-slate-50 p-8 md:p-12 space-y-12 no-scrollbar">
           <header className="flex justify-between items-center text-right">
              <div>
                 <h1 className="text-4xl font-black text-slate-900 leading-none">Management Console</h1>
                 <p className="text-slate-500 font-medium mt-2">מעקב וניהול מלא של המוצר מקצה לקצה.</p>
              </div>
              <button onClick={() => setAppState('main')} className="md:hidden bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-bold">חזרה</button>
           </header>

           {dashboardView === 'overview' && (
             <div className="space-y-12 animate-in fade-in duration-500">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-right">
                   <StMetric label="Total Inventory" value={items.length.toString()} delta="12%" icon={<PackageCheck size={24}/>} />
                   <StMetric label="Active Neighbors" value="1.4K" delta="8%" icon={<Users size={24}/>} />
                   <StMetric label="Revenue (EST)" value="₪29.4K" delta="15%" icon={<TrendingUp size={24}/>} />
                   <StMetric label="AI Actions Today" value={userStats.aiUsage.toString()} icon={<Activity size={24}/>} />
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                   <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm text-right">
                      <h3 className="text-xl font-black mb-6">Engagement Funnel</h3>
                      <div className="space-y-4">
                        {[
                          { name: 'Awareness', val: 100 },
                          { name: 'Discovery', val: 65 },
                          { name: 'Magic Fill Usage', val: 30 },
                          { name: 'Pro Conversion', val: 8 }
                        ].map((source, i) => (
                          <div key={i} className="space-y-1">
                             <div className="flex justify-between text-xs font-bold text-slate-500 flex-row-reverse"><span>{source.name}</span><span>{source.val}%</span></div>
                             <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-emerald-500" style={{width: `${source.val}%`}} /></div>
                          </div>
                        ))}
                      </div>
                   </div>
                   <div className="bg-slate-900 p-8 rounded-[40px] text-white relative overflow-hidden flex flex-col justify-between">
                      <div className="relative z-10 text-right">
                        <h3 className="text-xl font-black mb-1">Weekly Stickiness</h3>
                        <p className="text-white/50 text-xs mb-6">User retention trends over 7 days.</p>
                      </div>
                      <div className="flex items-end gap-2 h-40 relative z-10">
                        {[40, 35, 60, 55, 75, 80, 85].map((h, i) => (
                          <div key={i} className="flex-1 bg-emerald-500/40 rounded-t-xl hover:bg-emerald-400 transition-all cursor-help" style={{height: `${h}%`}} />
                        ))}
                      </div>
                      <TrendingUp size={100} className="absolute -left-10 -bottom-10 text-white/5 rotate-12" fill="currentColor"/>
                   </div>
                </div>
             </div>
           )}

           {dashboardView === 'launch' && (
             <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
                <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-10 rounded-[40px] text-white shadow-2xl relative overflow-hidden">
                   <Rocket size={140} className="absolute -left-10 -bottom-10 text-white/10 -rotate-12" />
                   <div className="relative z-10 text-right">
                    <h2 className="text-3xl font-black mb-2">Launch Pad: Full Stack Prep</h2>
                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl border w-fit mr-auto bg-emerald-400/20 border-emerald-400/30">
                        <Globe2 size={16} className="text-emerald-300 animate-pulse" />
                        <span className="text-xs font-black uppercase tracking-widest">Live Production</span>
                    </div>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="bg-white p-10 rounded-[40px] border border-slate-200 shadow-sm space-y-8 group hover:border-emerald-500 transition-all text-right">
                      <div className="flex items-center justify-between flex-row-reverse">
                        <h3 className="text-xl font-black flex items-center gap-3 text-slate-900"><Github size={24}/> GitHub Sync</h3>
                        <a href={gitRepoUrl} target="_blank" className="text-emerald-600 hover:text-emerald-700 transition-colors"><ExternalLink size={18}/></a>
                      </div>
                      <div className="space-y-4">
                         <p className="text-sm font-bold text-slate-500">הפקודות לדחיפת הגרסה האחרונה:</p>
                         <div className="bg-slate-900 p-6 rounded-3xl font-mono text-xs text-emerald-400 relative ltr">
                            <button onClick={() => { 
                                navigator.clipboard.writeText(`git add .\ngit commit -m "Neighbor-Share v1.0.0"\ngit push origin main`);
                                showToast("Commands copied!", <Copy size={14}/>); 
                            }} className="absolute top-4 right-4 p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-all text-white"><Copy size={14}/></button>
                            <p>git add .</p>
                            <p>git commit -m "Neighbor-Share v1.0.0"</p>
                            <p>git push origin main</p>
                         </div>
                      </div>
                   </div>

                   <div className="bg-white p-10 rounded-[40px] border border-slate-200 shadow-sm space-y-8 text-right">
                      <h3 className="text-xl font-black flex items-center gap-3 text-slate-900 flex-row-reverse"><Globe size={24}/> Server Deployment</h3>
                      <div className="space-y-6">
                         <div className="space-y-3">
                           <div className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest justify-end">Production URL</div>
                           <div className="bg-emerald-50 p-4 rounded-2xl font-mono text-[10px] text-emerald-700 border border-emerald-100 flex items-center justify-between flex-row-reverse">
                             <span className="ltr">neighbor-share.up.railway.app</span>
                             <span className="bg-emerald-500 text-white text-[8px] px-2 py-0.5 rounded-full">ACTIVE</span>
                           </div>
                         </div>
                         <button className="w-full py-5 rounded-[30px] font-black text-lg transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3 bg-slate-100 text-slate-400 cursor-not-allowed">
                           <Check size={20}/> System is Live
                         </button>
                      </div>
                   </div>
                </div>
             </div>
           )}

           {dashboardView === 'analytics' && (
             <div className="space-y-8 animate-in fade-in duration-500 text-right">
                <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm">
                   <div className="flex items-center justify-between mb-8 flex-row-reverse">
                      <h3 className="text-xl font-black">PostHog Live Stream</h3>
                      <button onClick={() => setEvents([])} className="text-[10px] font-black text-slate-400 hover:text-rose-500 uppercase tracking-widest transition-colors">Clear Logs</button>
                   </div>
                   <div className="space-y-4 h-[550px] overflow-y-auto no-scrollbar pr-2">
                      {events.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-300">
                           <Activity size={48} className="mb-4 opacity-20" />
                           <p className="font-bold">Waiting for user interaction...</p>
                        </div>
                      ) : (
                        events.map(event => (
                          <div key={event.id} className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex items-start justify-between group hover:border-emerald-200 transition-all flex-row-reverse">
                             <div className="flex items-start gap-4 flex-row-reverse">
                                <div className={`p-2.5 rounded-xl ${
                                  event.status === 'error' ? 'bg-rose-100 text-rose-600' : 
                                  event.status === 'warn' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'
                                }`}>
                                   {event.type === 'AI_Agent' ? <Cpu size={18}/> : event.type === 'Search' ? <Search size={18}/> : <MousePointer2 size={18}/>}
                                </div>
                                <div className="text-right">
                                   <div className="flex items-center gap-2 justify-end">
                                      <span className="text-[10px] text-slate-400 font-mono opacity-60">{event.time}</span>
                                      <span className="font-black text-xs text-slate-900 uppercase tracking-tight">{event.type}</span>
                                   </div>
                                   <p className="text-sm text-slate-600 font-medium mt-1">{event.details}</p>
                                </div>
                             </div>
                          </div>
                        ))
                      )}
                   </div>
                </div>
             </div>
           )}

           {dashboardView === 'data' && (
             <div className="bg-white rounded-[40px] border border-slate-200 overflow-hidden shadow-sm animate-in fade-in duration-500 text-right">
                <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 flex-row-reverse">
                   <h3 className="font-black text-slate-800">Inventory Explorer</h3>
                   <button onClick={() => showToast("Exported Data", <Download size={14}/>)} className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-black"><Download size={14}/> EXPORT CSV</button>
                </div>
                <div className="overflow-x-auto">
                   <table className="w-full text-right text-sm">
                      <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                         <tr><th className="px-8 py-6">Status</th><th className="px-8 py-6">Price</th><th className="px-8 py-6">Category</th><th className="px-8 py-6">Product</th><th className="px-8 py-6">ID</th></tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                         {items.map(i => (
                           <tr key={i.id} className="hover:bg-slate-50 transition-colors font-bold text-slate-700">
                              <td className="px-8 py-6"><span className="bg-emerald-50 text-emerald-600 px-2 py-1 rounded-lg text-[10px] font-black uppercase">Available</span></td>
                              <td className="px-8 py-6">₪{i.pricePerDay}</td>
                              <td className="px-8 py-6">{i.category}</td>
                              <td className="px-8 py-6 text-slate-900 font-black">{i.name}</td>
                              <td className="px-8 py-6 text-[10px] font-mono opacity-50">#{i.id}</td>
                           </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
             </div>
           )}

           {dashboardView === 'ai' && (
             <div className="space-y-8 animate-in slide-in-from-bottom-6 duration-700 text-right">
                <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-[40px] p-10 text-white shadow-2xl relative overflow-hidden">
                   <h3 className="text-2xl font-black mb-4">Gemini Performance</h3>
                   <div className="grid grid-cols-2 md:grid-cols-4 gap-6 relative z-10">
                      <div><p className="text-[10px] uppercase font-black opacity-60">Avg Latency</p><p className="text-2xl font-black">1.12s</p></div>
                      <div><p className="text-[10px] uppercase font-black opacity-60">Uptime</p><p className="text-2xl font-black text-emerald-400">99.9%</p></div>
                      <div><p className="text-[10px] uppercase font-black opacity-60">Today's Tokens</p><p className="text-2xl font-black">42K</p></div>
                      <div><p className="text-[10px] uppercase font-black opacity-60">Total Sessions</p><p className="text-2xl font-black">1.2K</p></div>
                   </div>
                   <Cpu size={120} className="absolute -left-8 -bottom-8 text-white/10" />
                </div>
                <div className="bg-white p-8 rounded-[40px] border border-slate-200 text-right">
                   <div className="flex items-center gap-3 mb-6 flex-row-reverse"><Terminal size={20} className="text-slate-400"/><h4 className="font-black">Backend Trace Logs</h4></div>
                   <div className="space-y-3 font-mono text-[10px] text-slate-500 bg-slate-900 p-8 rounded-3xl h-80 overflow-y-auto no-scrollbar border border-white/5 ltr">
                      <p className="text-emerald-400">[2024-03-20 14:22] TRACE: item_analysis_v4 -> SUCCESS</p>
                      <p className="text-slate-500 pl-4">{`{ "input": "${newItemName || 'last_item'}", "model": "gemini-3-flash" }`}</p>
                      <p className="text-emerald-400 mt-4">[2024-03-20 14:25] TRACE: semantic_search_v2 -> SUCCESS</p>
                      <p className="text-slate-500 pl-4">{`{ "query": "${searchQuery || 'empty'}", "results": ${aiResultIds?.length || 0} }`}</p>
                      <div className="animate-pulse text-emerald-500 mt-2">_</div>
                   </div>
                </div>
             </div>
           )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col font-['Rubik'] bg-white select-none overflow-hidden" dir="rtl">
      {/* Confetti & Toast */}
      {showConfetti && <div className="fixed inset-0 z-[2000] pointer-events-none flex items-center justify-center animate-bounce"><Trophy size={140} className="text-amber-400 fill-amber-50 drop-shadow-2xl" /></div>}
      {toast && <div className="fixed bottom-32 left-1/2 -translate-x-1/2 z-[1000] toast-enter w-[90%] max-w-sm"><div className="bg-slate-900/95 text-white px-8 py-5 rounded-[30px] shadow-3xl flex items-center justify-between border border-white/10 backdrop-blur-2xl"><div className="flex items-center gap-4"><div className="text-emerald-400">{toast.icon}</div><span className="font-black text-sm">{toast.message}</span></div></div></div>}

      <header className="glass-effect sticky top-0 z-[60] safe-top px-6 pt-4 pb-2">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="cursor-pointer" onClick={() => setActiveTab('explore')}><Logo /></div>
          <div className="flex items-center gap-2">
            <button onClick={() => setAppState('dashboard')} className="p-3 text-slate-500 bg-slate-100 rounded-2xl hover:bg-emerald-50 hover:text-emerald-600 transition-all"><Monitor size={20}/></button>
            {userStats.isPro && <div className="bg-gradient-to-r from-amber-400 to-amber-600 text-white px-3 py-1.5 rounded-xl text-[10px] font-black shadow-lg animate-in zoom-in"><Zap size={10} className="inline mr-1" fill="currentColor"/> PRO</div>}
            <button onClick={() => setIsSettingsOpen(true)} className="p-3.5 bg-slate-100 rounded-2xl text-slate-500"><Settings size={22} /></button>
          </div>
        </div>
        <div className="mt-4 md:hidden relative">
          <input type="text" placeholder="מה תרצו לשאול היום?" className="w-full p-5 bg-slate-100/60 border border-slate-200 rounded-3xl outline-none font-bold text-sm focus:bg-white pr-14 transition-all" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          <Search className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400" size={20}/>
          {isAISearching && <Loader2 size={18} className="animate-spin text-emerald-500 absolute left-6 top-1/2 -translate-y-1/2" />}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto no-scrollbar px-6 pt-6 pb-40">
        <div className="max-w-7xl mx-auto space-y-10">
          {activeTab === 'explore' ? (
            <div className="animate-in fade-in duration-700">
               <InsuranceBanner />
               <div className="flex items-center justify-between mt-10 mb-8"><div className="text-right"><h3 className="text-3xl font-black text-slate-900 leading-none">השכונה שלך</h3><p className="text-slate-400 font-bold text-xs mt-2">{filteredItems.length} פריטים פנויים סביבך</p></div><button className="p-4 bg-white border-2 border-slate-100 rounded-2xl text-slate-400"><Filter size={20}/></button></div>
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                 {filteredItems.map(i => (
                   <ItemCard key={i.id} item={i} owner={MOCK_USERS[0]} onClick={(item) => {
                     trackEvent('Engagement', `Item clicked: ${item.name}`);
                     setSelectedItem(item);
                   }} />
                 ))}
               </div>
            </div>
          ) : (
            <div className="space-y-10 animate-in slide-in-from-bottom-6 duration-700">
               <div className="bg-white rounded-[50px] p-12 shadow-2xl border border-slate-100 relative overflow-hidden group">
                  <div className="flex items-center gap-10 flex-row-reverse">
                     <div className="relative"><img src={currentUser.avatar} className="w-32 h-32 rounded-[40px] border-4 border-emerald-50 shadow-2xl" /><div className="absolute -bottom-2 -right-2 bg-amber-400 p-2.5 rounded-2xl border-4 border-white"><Award size={24} className="text-white"/></div></div>
                     <div className="flex-1 text-right space-y-2"><h2 className="text-4xl font-black text-slate-900">{currentUser.name}</h2><div className="flex items-center gap-2 justify-end"><span className="bg-emerald-600 text-white px-4 py-1.5 rounded-xl text-[11px] font-black">{currentUser.level}</span><TrustBadge score={currentUser.trustScore} showText={false} /></div><p className="text-slate-400 font-bold text-sm tracking-widest">{currentUser.points} נקודות אמינות</p></div>
                  </div>
                  <div className="grid grid-cols-2 gap-6 mt-12"><button onClick={() => { trackEvent('UI', 'Add item modal opened'); setIsAddingItem(true); }} className="bg-slate-900 text-white py-6 rounded-[35px] font-black text-lg flex items-center justify-center gap-3 shadow-2xl active:scale-95 transition-all"><Plus size={24}/> שתף פריט</button><button className="bg-slate-50 text-slate-900 py-6 rounded-[35px] font-black text-lg flex items-center justify-center gap-3 active:scale-95 transition-all"><History size={24}/> היסטוריה</button></div>
               </div>
               {!userStats.isPro && (
                 <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-[45px] p-10 text-white text-right relative overflow-hidden shadow-3xl shadow-emerald-200">
                    <div className="relative z-10 space-y-4">
                       <div className="flex items-center gap-2 justify-end"><Zap size={24} fill="currentColor" className="text-amber-400" /><h3 className="text-3xl font-black">Neighbor Pro</h3></div>
                       <p className="text-white/80 font-bold text-lg max-w-sm ml-auto">ביטוח מורחב עד ₪15,000, תג זהב ושימוש בלתי מוגבל ב-AI!</p>
                       <button onClick={() => { trackEvent('UI', 'Checkout modal opened'); setIsCheckoutOpen(true); }} className="bg-white text-emerald-700 px-10 py-4 rounded-[25px] font-black text-lg shadow-2xl active:scale-95 transition-all">שדרג עכשיו</button>
                    </div>
                    <Activity className="absolute -left-10 -bottom-10 w-64 h-64 text-white/10 rotate-12" />
                 </div>
               )}
            </div>
          )}
        </div>
      </main>

      <nav className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[70] w-[90%] max-w-sm bg-white/95 backdrop-blur-2xl rounded-[40px] shadow-4xl border border-slate-100 p-3 flex justify-around items-center flex-row-reverse">
        <button onClick={() => setActiveTab('explore')} className={`p-5 rounded-full transition-all ${activeTab === 'explore' ? 'bg-emerald-600 text-white shadow-xl' : 'text-slate-300'}`}><LayoutGrid size={28}/></button>
        <button onClick={() => setIsAddingItem(true)} className="bg-slate-900 text-white p-6 rounded-[32px] -mt-16 shadow-3xl border-4 border-white active:scale-90 transition-all"><Plus size={36} strokeWidth={3}/></button>
        <button onClick={() => setActiveTab('profile')} className={`p-5 rounded-full transition-all ${activeTab === 'profile' ? 'bg-emerald-600 text-white shadow-xl' : 'text-slate-300'}`}><UserIcon size={28}/></button>
      </nav>

      {/* Item Details View */}
      {selectedItem && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-slate-900/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-white w-full max-w-2xl sm:rounded-[50px] overflow-hidden shadow-4xl flex flex-col h-full max-h-[97vh] sm:h-auto modal-enter text-right border border-white/20">
            <div className="relative h-[48vh] sm:h-[400px]">
              <img src={selectedItem.images[0]} className="w-full h-full object-cover" />
              <button onClick={() => setSelectedItem(null)} className="absolute top-8 left-8 p-4 bg-black/20 backdrop-blur-xl text-white rounded-full"><X size={28}/></button>
              <div className="absolute bottom-8 right-8 bg-emerald-600 text-white px-8 py-4 rounded-[25px] font-black text-xl shadow-2xl">₪{selectedItem.pricePerDay} <span className="text-xs opacity-60">/ יום</span></div>
            </div>
            <div className="p-10 sm:p-12 space-y-10 overflow-y-auto no-scrollbar">
               <div className="space-y-4">
                  <h2 className="text-5xl font-black text-slate-900 tracking-tighter leading-none">{selectedItem.name}</h2>
                  <div className="flex items-center gap-4 justify-end text-slate-400 font-black text-[10px] uppercase tracking-widest"><span>{selectedItem.category}</span><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"/><span>0.4 ק״מ ממך</span></div>
               </div>
               <div className="bg-slate-50 p-6 rounded-[35px] flex items-center justify-between flex-row-reverse border border-slate-100">
                  <div className="flex items-center gap-4 flex-row-reverse"><img src={MOCK_USERS[0].avatar} className="w-16 h-16 rounded-[22px] border-4 border-white shadow-xl" /><div className="text-right"><p className="font-black text-slate-900 text-lg">שרה לוי</p><p className="text-[10px] text-emerald-600 font-black flex items-center gap-1 justify-end">מענה תוך דקות <Clock size={10}/></p></div></div>
                  <TrustBadge score={98} />
               </div>
               <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">תיאור הפריט</h4>
                  <p className="text-slate-600 font-medium text-xl leading-relaxed">{selectedItem.description}</p>
               </div>
               <div className="pt-6 flex gap-4"><button onClick={() => { trackEvent('Conversion', `Borrow request: ${selectedItem.name}`); setSelectedItem(null); showToast("בקשת השכרה נשלחה!", <Check size={18}/>);}} className="flex-1 bg-emerald-600 text-white py-7 rounded-[35px] font-black text-2xl shadow-3xl shadow-emerald-500/30 active:scale-95 transition-all">שלח בקשת השכרה</button><button className="p-7 bg-slate-900 text-white rounded-[35px] active:scale-95 shadow-2xl"><MessageCircle size={32}/></button></div>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-slate-900/80 backdrop-blur-sm animate-in fade-in">
           <div className="bg-white w-full max-w-lg rounded-t-[50px] sm:rounded-[50px] p-12 shadow-4xl text-right modal-enter relative">
              <button onClick={() => setIsSettingsOpen(false)} className="absolute top-12 left-12 text-slate-300 hover:text-slate-900 transition-all"><X size={36}/></button>
              <h2 className="text-4xl font-black text-slate-900 mb-10 tracking-tighter">הגדרות חשבון</h2>
              <div className="space-y-4">
                 <button onClick={() => {setDashboardView('overview'); setAppState('dashboard'); setIsSettingsOpen(false);}} className="w-full p-6 bg-slate-50 rounded-[30px] flex items-center justify-between border border-slate-100 active:bg-emerald-50 transition-all group flex-row-reverse"><div className="flex items-center gap-4 flex-row-reverse"><div className="bg-white p-3 rounded-2xl text-emerald-600 shadow-sm"><Monitor size={20}/></div><span className="font-black">Admin Console</span></div><ChevronLeft size={20}/></button>
                 <button onClick={() => {localStorage.removeItem('neighbor_auth'); setAppState('auth'); setIsSettingsOpen(false);}} className="w-full p-6 bg-rose-50 rounded-[30px] flex items-center justify-between border border-rose-100 text-rose-600 transition-all flex-row-reverse"><div className="flex items-center gap-4 flex-row-reverse"><div className="bg-white p-3 rounded-2xl shadow-sm"><LogOut size={20}/></div><span className="font-black">התנתקות</span></div></button>
              </div>
           </div>
        </div>
      )}

      {/* Add Item Modal */}
      {isAddingItem && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-slate-900/80 backdrop-blur-md animate-in fade-in">
           <div className="bg-white w-full max-w-xl rounded-t-[60px] sm:rounded-[60px] p-12 shadow-4xl max-h-[95vh] overflow-y-auto no-scrollbar text-right modal-enter relative">
              <button onClick={() => setIsAddingItem(false)} className="absolute top-12 left-12 text-slate-300 hover:text-slate-900 transition-all"><X size={36}/></button>
              <div className="mb-12"><h2 className="text-5xl font-black text-slate-900 mb-2 tracking-tighter">שתפו פריט</h2><p className="text-slate-400 font-bold text-lg leading-none">תעזרו לשכנים, תרוויחו נקודות אמינות.</p></div>
              <form onSubmit={handleAddItem} className="space-y-8">
                 <div onClick={() => fileInputRef.current?.click()} className="w-full h-64 bg-slate-50 border-4 border-dashed border-slate-100 rounded-[50px] flex flex-col items-center justify-center gap-6 cursor-pointer hover:bg-emerald-50 hover:border-emerald-200 transition-all group overflow-hidden relative shadow-inner">
                    {newItemImage ? <img src={newItemImage} className="w-full h-full object-cover" /> : <><div className="bg-white p-6 rounded-[35px] shadow-2xl text-emerald-500 group-hover:scale-110 transition-transform"><Camera size={40}/></div><span className="font-black text-slate-800">צילום פריט</span></>}
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => {const f=e.target.files?.[0]; if(f){const r=new FileReader(); r.onload=()=>setNewItemImage(r.result as string); r.readAsDataURL(f);}}} />
                 </div>
                 <div className="space-y-6">
                    <div className="relative">
                       <input type="text" placeholder="מה תרצו לשתף?" className="w-full p-7 bg-slate-50 border border-slate-200 rounded-[35px] outline-none font-black text-2xl focus:bg-white transition-all shadow-inner" value={newItemName} onChange={(e)=>setNewItemName(e.target.value)} required />
                       <button type="button" onClick={handleMagicFill} disabled={isAnalyzing} className="absolute left-3 top-1/2 -translate-y-1/2 bg-amber-400 text-white p-4 rounded-2xl shadow-xl active:scale-90 transition-all">
                          {isAnalyzing ? <Loader2 size={18} className="animate-spin" /> : <Wand2 size={18} />}
                       </button>
                    </div>
                    <textarea placeholder="תיאור קצר..." className="w-full p-7 bg-slate-50 border border-slate-200 rounded-[35px] outline-none font-bold text-lg focus:bg-white min-h-[160px] shadow-inner" value={newItemDesc} onChange={(e)=>setNewItemDesc(e.target.value)} />
                    <div className="grid grid-cols-2 gap-6"><input type="number" placeholder="מחיר" className="w-full p-7 bg-slate-50 border border-slate-200 rounded-[35px] outline-none font-black text-2xl focus:bg-white shadow-inner" value={newItemPrice || ''} onChange={(e)=>setNewItemPrice(Number(e.target.value))} /><select className="w-full p-7 bg-slate-50 border border-slate-200 rounded-[35px] outline-none font-black text-lg appearance-none focus:bg-white shadow-inner" value={newItemCategory} onChange={(e)=>setNewItemCategory(e.target.value as ItemCategory)}>{Object.values(ItemCategory).map(c=><option key={c} value={c}>{c}</option>)}</select></div>
                 </div>
                 <button type="submit" className="w-full bg-slate-900 text-white py-8 rounded-[40px] font-black text-2xl shadow-4xl hover:bg-emerald-600 active:scale-95 transition-all mb-8">פרסם בקהילה</button>
              </form>
           </div>
        </div>
      )}

      {/* Checkout Modal */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in">
           <div className="bg-white w-full max-w-md rounded-[45px] overflow-hidden shadow-4xl text-right animate-in zoom-in-95">
              <div className="p-10 space-y-8">
                 <div className="flex justify-between items-center"><button onClick={() => setIsCheckoutOpen(false)} className="text-slate-300 hover:text-slate-900 transition-all"><X size={28}/></button><CreditCard size={36} className="text-blue-600"/></div>
                 <div className="space-y-2"><h2 className="text-3xl font-black text-slate-900">בחר תוכנית</h2><p className="text-slate-500 font-bold">השכונה שלך בגרסה המקצוענית.</p></div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 border-2 border-slate-100 rounded-3xl text-center space-y-2 opacity-60">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">חינם</p>
                       <p className="text-2xl font-black">₪0</p>
                       <p className="text-[10px] font-bold">3 שאילתות AI ביום</p>
                    </div>
                    <div className="p-4 border-2 border-emerald-500 bg-emerald-50 rounded-3xl text-center space-y-2 relative overflow-hidden">
                       <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[8px] px-2 py-0.5 rounded-bl-lg font-black uppercase">Most Popular</div>
                       <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Pro</p>
                       <p className="text-2xl font-black">₪29</p>
                       <p className="text-[10px] font-bold">AI ללא הגבלה</p>
                    </div>
                 </div>
                 <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-2">
                    <div className="flex justify-between text-xs font-bold text-slate-500"><span>Neighbor Pro Month</span><span>₪29.00</span></div>
                    <div className="flex justify-between text-2xl font-black text-slate-900 pt-2 border-t border-slate-200"><span>סה״כ</span><span>₪29.00</span></div>
                 </div>
                 <button onClick={handleUpgradePro} className="w-full bg-blue-600 text-white py-6 rounded-[30px] font-black text-xl shadow-2xl shadow-blue-500/20 active:scale-95 transition-all">שלם והתחל להשתמש</button>
                 <p className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center justify-center gap-2"><Lock size={10}/> תשלום מאובטח ע״י Stripe</p>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default App;
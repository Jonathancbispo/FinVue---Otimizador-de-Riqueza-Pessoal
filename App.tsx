
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Wallet, 
  TrendingUp, 
  CreditCard, 
  ShoppingCart, 
  Utensils, 
  Calendar, 
  Sparkles,
  PieChart as PieIcon,
  BarChart3,
  PlusCircle,
  LayoutDashboard,
  Moon,
  Sun,
  Target,
  Trophy,
  LineChart as LineIcon,
  BrainCircuit,
  LogOut,
  RefreshCw,
  Receipt,
  User,
  Mail,
  Shield,
  Activity,
  ChevronRight,
  Save,
  Key,
  AlertCircle,
  CheckCircle2,
  CalendarDays,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  Award,
  Filter,
  Lock
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  AreaChart, 
  Area, 
  RadialBarChart, 
  RadialBar, 
  Legend,
  Line,
  ComposedChart
} from 'recharts';
import NumberInput from './components/NumberInput';
import SummaryCard from './components/SummaryCard';
import ChatBot from './components/ChatBot';
import CurrencyTicker from './components/CurrencyTicker';
import EconomicNews from './components/EconomicNews';
import MarketIntelligence from './components/MarketIntelligence';
import Login from './components/Login';
import { FinancialState, CalculationResults } from './types';
import { getFinancialAdvice } from './services/geminiService';
import { supabase, loadFinancialData, saveFinancialData, updateUserProfile, updateUserPassword } from './services/supabaseClient';

const COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899'];
const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

type PeriodRange = { label: string; start: number; end: number };

const PERIOD_OPTIONS: PeriodRange[] = [
  { label: 'Ano Inteiro', start: 0, end: 11 },
  { label: '1º Semestre', start: 0, end: 5 },
  { label: '2º Semestre', start: 6, end: 11 },
  { label: 'T1', start: 0, end: 2 },
  { label: 'T2', start: 3, end: 5 },
  { label: 'T3', start: 6, end: 8 },
  { label: 'T4', start: 9, end: 11 },
];

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  
  const [currentMonthIdx, setCurrentMonthIdx] = useState(new Date().getMonth());
  const [activeTab, setActiveTab] = useState<'inputs' | 'dashboard' | 'strategy' | 'profile' | 'annual'>('dashboard');
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodRange>(PERIOD_OPTIONS[0]);
  const [newsHeadlines, setNewsHeadlines] = useState<string[]>([]);
  
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('finvue_theme');
    return saved === null ? true : saved === 'dark';
  });
  
  const monthScrollRef = useRef<HTMLDivElement>(null);
  const monthRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Profile management states
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileFeedback, setProfileFeedback] = useState<{type: 'success' | 'error', msg: string} | null>(null);

  const [state, setState] = useState<FinancialState>(() => {
    const createEmptyYear = () => Array(12).fill(0);
    return {
      income: { fixed: createEmptyYear(), extra: createEmptyYear(), investments: createEmptyYear() },
      expenses: { fixed: createEmptyYear(), creditCard: createEmptyYear(), monthlyPurchases: createEmptyYear(), butcher: createEmptyYear(), weekly: createEmptyYear(), otherExpenses: createEmptyYear() }
    };
  });

  const [aiAdvice, setAiAdvice] = useState<string>('');
  const [loadingAdvice, setLoadingAdvice] = useState<boolean>(false);

  // Auth Listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsAuthenticated(!!session);
      if (session?.user?.user_metadata?.display_name) {
        setNewDisplayName(session.user.user_metadata.display_name);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setIsAuthenticated(!!session);
      if (session?.user?.user_metadata?.display_name) {
        setNewDisplayName(session.user.user_metadata.display_name);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load Data from Supabase when authenticated
  useEffect(() => {
    if (isAuthenticated && session?.user?.id) {
      const fetchData = async () => {
        setIsSyncing(true);
        try {
          const cloudData = await loadFinancialData(session.user.id);
          if (cloudData) {
            setState(cloudData);
          }
        } catch (error) {
          console.error("Erro ao carregar dados do Supabase:", error);
        } finally {
          setIsSyncing(false);
        }
      };
      fetchData();
    }
  }, [isAuthenticated, session]);

  // Auto-save to Supabase
  useEffect(() => {
    if (isAuthenticated && session?.user?.id) {
      const timeoutId = setTimeout(async () => {
        try {
          await saveFinancialData(session.user.id, state);
        } catch (error) {
          console.error("Falha ao sincronizar:", error);
        }
      }, 2000); 
      return () => clearTimeout(timeoutId);
    }
  }, [state, isAuthenticated, session]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('finvue_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('finvue_theme', 'light');
    }
  }, [isDarkMode]);

  useEffect(() => {
    const selectedMonth = monthRefs.current[currentMonthIdx];
    if (selectedMonth && monthScrollRef.current) {
      const scrollContainer = monthScrollRef.current;
      const scrollLeft = selectedMonth.offsetLeft - (scrollContainer.clientWidth / 2) + (selectedMonth.clientWidth / 2);
      scrollContainer.scrollTo({ left: scrollLeft, behavior: 'smooth' });
    }
  }, [currentMonthIdx]);

  const results = useMemo(() => {
    let runningBalance = 0;
    const allMonthlyResults = MONTHS.map((_, idx) => {
      const grossIncome = (state.income.fixed[idx] || 0) + (state.income.extra[idx] || 0);
      const netIncome = grossIncome - (state.income.investments[idx] || 0);
      const exp = (state.expenses.fixed[idx] || 0) + (state.expenses.creditCard[idx] || 0) + (state.expenses.monthlyPurchases[idx] || 0) + (state.expenses.butcher[idx] || 0) + (state.expenses.weekly[idx] || 0) + (state.expenses.otherExpenses[idx] || 0);
      const monthlyBalance = netIncome - exp;
      
      return { 
        income: netIncome, 
        gross: grossIncome,
        expense: exp, 
        balance: monthlyBalance,
        invested: state.income.investments[idx] || 0,
        month: MONTHS[idx],
        shortMonth: MONTHS[idx].substring(0, 3) 
      };
    });

    const cumulativeResults = allMonthlyResults.map(m => {
      runningBalance += m.balance;
      return { month: m.shortMonth, balance: runningBalance };
    });

    const cumulativeInvested = state.income.investments.reduce((a, b) => a + b, 0);

    // Cálculos acumulados até o mês selecionado (YTD)
    const ytdSlice = allMonthlyResults.slice(0, currentMonthIdx + 1);
    const ytdIncome = ytdSlice.reduce((acc, curr) => acc + curr.income, 0);
    const ytdExpenses = ytdSlice.reduce((acc, curr) => acc + curr.expense, 0);
    const ytdBalance = ytdIncome - ytdExpenses;
    const ytdInvested = ytdSlice.reduce((acc, curr) => acc + curr.invested, 0);

    const annualIncome = allMonthlyResults.reduce((acc, curr) => acc + curr.income, 0);
    const annualGross = allMonthlyResults.reduce((acc, curr) => acc + curr.gross, 0);
    const annualExpenses = allMonthlyResults.reduce((acc, curr) => acc + curr.expense, 0);
    const annualBalance = annualIncome - annualExpenses;

    const periodResults = allMonthlyResults.slice(selectedPeriod.start, selectedPeriod.end + 1);
    const pGross = periodResults.reduce((a, b) => a + b.gross, 0);
    const pIncome = periodResults.reduce((a, b) => a + b.income, 0);
    const pExpenses = periodResults.reduce((a, b) => a + b.expense, 0);
    const pInvested = periodResults.reduce((a, b) => a + b.invested, 0);
    const pBalance = pIncome - pExpenses;

    const savingsRate = pGross > 0 ? Math.round(((pIncome - pExpenses) / pIncome) * 100) : 0;

    return { 
      ytdIncome, 
      ytdExpenses, 
      ytdBalance, 
      ytdInvested,
      annualIncome, 
      annualGross,
      annualExpenses, 
      annualBalance, 
      allMonthlyResults, 
      cumulativeResults, 
      cumulativeInvested,
      pGross, pIncome, pExpenses, pInvested, pBalance,
      savingsRate,
      periodResults
    };
  }, [state, currentMonthIdx, selectedPeriod]);

  const updateField = (category: 'income' | 'expenses', field: string, value: number) => {
    setState(prev => {
      const newState = { ...prev };
      // @ts-ignore
      const arr = [...newState[category][field]];
      arr[currentMonthIdx] = value;
      // @ts-ignore
      newState[category][field] = arr;
      return newState;
    });
  };

  const handleAiAdvice = async () => {
    if (loadingAdvice) return;
    setLoadingAdvice(true);
    try {
      const advice = await getFinancialAdvice(state, results as any, currentMonthIdx);
      setAiAdvice(advice);
    } catch (error) {
      console.error("Erro ao obter conselho da IA:", error);
      setAiAdvice("Mantenha o equilíbrio entre renda e despesas para um futuro sólido.");
    } finally {
      setLoadingAdvice(false);
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setSession(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };

  const chartData = [
    { name: 'Fixo', value: state.expenses.fixed[currentMonthIdx] },
    { name: 'Cartão', value: state.expenses.creditCard[currentMonthIdx] },
    { name: 'Compras Mensais', value: state.expenses.monthlyPurchases[currentMonthIdx] },
    { name: 'Açougue', value: state.expenses.butcher[currentMonthIdx] },
    { name: 'Semanal', value: state.expenses.weekly[currentMonthIdx] },
    { name: 'Outras', value: state.expenses.otherExpenses[currentMonthIdx] },
  ].filter(d => d.value > 0);

  const formatCurrency = (num: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(num);
  const formatCompact = (num: number) => new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 }).format(num);

  const displayName = session?.user?.user_metadata?.display_name || session?.user?.email?.split('@')[0];

  if (!isAuthenticated) {
    return <Login onLogin={(session) => { setSession(session); setIsAuthenticated(true); }} isDarkMode={isDarkMode} />;
  }

  return (
    <div className="min-h-screen pb-24 bg-[#f8fafc] dark:bg-darkBg flex flex-col transition-colors duration-300">
      <header className="bg-white dark:bg-darkCard border-b border-slate-200 dark:border-darkBorder sticky top-0 z-50 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
              <div className="bg-indigo-600 p-2 rounded-lg shadow-indigo-200 dark:shadow-none shadow-lg">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">FinVue<span className="text-indigo-600">.</span></h1>
            </div>
            {isSyncing && (
              <div className="flex items-center space-x-2 text-[10px] font-black uppercase text-indigo-500 animate-pulse">
                <RefreshCw size={12} className="animate-spin" />
                <span>Syncing Cloud</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            <nav className="hidden lg:flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-darkBorder">
              <button onClick={() => setActiveTab('inputs')} className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'inputs' ? 'bg-white dark:bg-darkCard text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Lançamentos</button>
              <button onClick={() => setActiveTab('dashboard')} className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'dashboard' ? 'bg-white dark:bg-darkCard text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Painel</button>
              <button onClick={() => setActiveTab('annual')} className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'annual' ? 'bg-white dark:bg-darkCard text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Relatórios</button>
              <button onClick={() => setActiveTab('strategy')} className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'strategy' ? 'bg-white dark:bg-darkCard text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Estratégia</button>
            </nav>

            <div className="flex items-center space-x-2">
              <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors">
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <button onClick={handleAiAdvice} disabled={loadingAdvice} className="flex items-center space-x-2 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-400 px-3 py-1.5 rounded-full text-xs font-bold transition-all disabled:opacity-50">
                <Sparkles className={`w-3.5 h-3.5 ${loadingAdvice ? 'animate-pulse' : ''}`} />
                <span className="hidden sm:inline">{loadingAdvice ? 'Gerando...' : 'IA Insight'}</span>
              </button>
              <div className="h-8 w-px bg-slate-200 dark:bg-darkBorder mx-2 hidden sm:block"></div>
              <button 
                onClick={() => setActiveTab('profile')} 
                className={`p-2 rounded-full transition-all ${activeTab === 'profile' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
                title="Meu Perfil"
              >
                <User size={22} />
              </button>
              <button onClick={handleLogout} className="flex items-center space-x-2 p-2 rounded-full hover:bg-rose-50 dark:hover:bg-rose-900/20 text-slate-400 hover:text-rose-600 transition-all" title="Sair"><LogOut size={20} /></button>
            </div>
          </div>
        </div>
      </header>

      {activeTab !== 'strategy' && activeTab !== 'profile' && activeTab !== 'annual' && (
        <div ref={monthScrollRef} className="bg-white dark:bg-darkCard border-b border-slate-200 dark:border-darkBorder overflow-x-auto scrollbar-hide sticky top-16 z-40 shadow-sm transition-colors duration-300">
          <div className="flex px-4 min-w-max">
            {MONTHS.map((month, idx) => (
              <button key={month} ref={el => monthRefs.current[idx] = el} onClick={() => setCurrentMonthIdx(idx)} className={`py-4 px-5 text-[10px] font-bold uppercase tracking-widest transition-all border-b-2 ${currentMonthIdx === idx ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50/30 dark:bg-indigo-900/20' : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}>
                {month}
              </button>
            ))}
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 mt-6 flex-1 w-full lg:mt-8">
        {activeTab === 'inputs' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
            <section className="bg-white dark:bg-darkCard p-6 rounded-[2rem] border border-slate-200 dark:border-darkBorder shadow-sm">
              <div className="flex items-center space-x-3 mb-6"><div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center"><Wallet className="w-5 h-5 text-emerald-600" /></div><h3 className="text-lg font-bold">Renda - {MONTHS[currentMonthIdx]}</h3></div>
              <div className="space-y-4">
                <NumberInput label="Renda Fixa" value={state.income.fixed[currentMonthIdx]} onChange={(val) => updateField('income', 'fixed', val)} icon={<Calendar className="w-4 h-4" />} />
                <NumberInput label="Renda Extra" value={state.income.extra[currentMonthIdx]} onChange={(val) => updateField('income', 'extra', val)} icon={<Sparkles className="w-4 h-4" />} />
                <div className="pt-2 border-t dark:border-slate-800"><NumberInput label="Investimentos" value={state.income.investments[currentMonthIdx]} onChange={(val) => updateField('income', 'investments', val)} icon={<Target className="w-4 h-4 text-indigo-500" />} /></div>
              </div>
            </section>
            <section className="bg-white dark:bg-darkCard p-6 rounded-[2rem] border border-slate-200 dark:border-darkBorder shadow-sm">
              <div className="flex items-center space-x-3 mb-6"><div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center"><CreditCard className="w-5 h-5 text-amber-600" /></div><h3 className="text-lg font-bold">Despesas - {MONTHS[currentMonthIdx]}</h3></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <NumberInput label="Fixas" value={state.expenses.fixed[currentMonthIdx]} onChange={(val) => updateField('expenses', 'fixed', val)} icon={<Calendar className="w-4 h-4" />} />
                <NumberInput label="Cartão de Crédito" value={state.expenses.creditCard[currentMonthIdx]} onChange={(val) => updateField('expenses', 'creditCard', val)} icon={<CreditCard className="w-4 h-4" />} />
                <NumberInput label="Compras Mensais" value={state.expenses.monthlyPurchases[currentMonthIdx]} onChange={(val) => updateField('expenses', 'monthlyPurchases', val)} icon={<ShoppingCart className="w-4 h-4" />} />
                <NumberInput label="Açougue" value={state.expenses.butcher[currentMonthIdx]} onChange={(val) => updateField('expenses', 'butcher', val)} icon={<Utensils className="w-4 h-4" />} />
                <NumberInput label="Compras Semanais" value={state.expenses.weekly[currentMonthIdx]} onChange={(val) => updateField('expenses', 'weekly', val)} icon={<ShoppingCart className="w-4 h-4" />} />
                <NumberInput label="Outras Despesas" value={state.expenses.otherExpenses[currentMonthIdx]} onChange={(val) => updateField('expenses', 'otherExpenses', val)} icon={<Receipt className="w-4 h-4" />} />
              </div>
            </section>
          </div>
        )}

        {activeTab === 'dashboard' && (
          <div className="space-y-8 animate-fade-in">
            {aiAdvice && <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-6 rounded-[2rem] text-white shadow-xl group relative overflow-hidden"><div className="absolute top-0 right-0 p-4 opacity-10 rotate-12 group-hover:scale-110 transition-transform"><Sparkles size={100} /></div><div className="relative z-10 flex flex-col space-y-2"><div className="flex items-center space-x-2"><Sparkles size={16} /><span className="text-[10px] font-black uppercase tracking-widest">Dica Estratégica</span></div><p className="text-lg font-medium leading-tight">{aiAdvice}</p></div></div>}

            <div className="space-y-4">
              <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Resumo Acumulado (Jan - {MONTHS[currentMonthIdx].substring(0,3)})</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                <SummaryCard title="Renda Líquida Acum." value={results.ytdIncome} type="income" subtitle={`Total até ${MONTHS[currentMonthIdx].substring(0,3)}`} />
                <SummaryCard title="Despesa Acumulada" value={results.ytdExpenses} type="expense" subtitle={`Total até ${MONTHS[currentMonthIdx].substring(0,3)}`} />
                <SummaryCard title="Saldo em Caixa" value={results.ytdBalance} type={results.ytdBalance >= 0 ? 'positive' : 'negative'} subtitle="Acumulado" />
                <SummaryCard title="Investido no Ano" value={results.ytdInvested} type="positive" subtitle={`Até ${MONTHS[currentMonthIdx].substring(0,3)}`} />
                <SummaryCard title="Patrimônio Est." value={results.cumulativeResults[currentMonthIdx].balance} type="positive" subtitle="Saldo YTD" />
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              <div className="xl:col-span-2 space-y-8">
                <div className="bg-white dark:bg-darkCard p-6 rounded-[2rem] border border-slate-200 dark:border-darkBorder shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center text-sm">
                      <BarChart3 className="w-4 h-4 mr-2 text-indigo-500" />
                      Fluxo Mensal vs Lucratividade
                    </h3>
                    <div className="flex items-center space-x-3 text-[10px] font-bold uppercase tracking-widest">
                      <div className="flex items-center space-x-1"><div className="w-2 h-2 rounded-full bg-indigo-500"></div><span className="text-slate-400">Renda</span></div>
                      <div className="flex items-center space-x-1"><div className="w-2 h-2 rounded-full bg-amber-500"></div><span className="text-slate-400">Gasto</span></div>
                      <div className="flex items-center space-x-1"><div className="w-2 h-2 bg-emerald-500"></div><span className="text-slate-400">Saldo</span></div>
                    </div>
                  </div>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={results.allMonthlyResults}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis 
                          dataKey="shortMonth" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{fontSize: 10, fontWeight: 700}} 
                        />
                        <YAxis 
                          axisLine={false} 
                          tickLine={false} 
                          tickFormatter={formatCompact} 
                          tick={{fontSize: 10}}
                        />
                        <Tooltip 
                          cursor={{fill: 'rgba(99, 102, 241, 0.03)'}}
                          contentStyle={{ borderRadius: '1.2rem', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px' }}
                          formatter={(value: any) => formatCurrency(value)}
                        />
                        <Bar dataKey="income" radius={[4, 4, 0, 0]} barSize={25}>
                          {results.allMonthlyResults.map((entry, index) => (
                            <Cell key={`cell-i-${index}`} fill={index === currentMonthIdx ? '#6366f1' : '#c7d2fe'} />
                          ))}
                        </Bar>
                        <Bar dataKey="expense" radius={[4, 4, 0, 0]} barSize={25}>
                          {results.allMonthlyResults.map((entry, index) => (
                            <Cell key={`cell-e-${index}`} fill={index === currentMonthIdx ? '#f59e0b' : '#fde68a'} />
                          ))}
                        </Bar>
                        <Line 
                          type="monotone" 
                          dataKey="balance" 
                          stroke="#10b981" 
                          strokeWidth={3} 
                          dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
                          activeDot={{ r: 6, strokeWidth: 0 }}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white dark:bg-darkCard p-6 rounded-[2rem] border border-slate-200 dark:border-darkBorder shadow-sm">
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center text-sm">
                    <LineIcon className="w-4 h-4 mr-2 text-indigo-500" />
                    Curva Patrimonial Jan - {MONTHS[currentMonthIdx]}
                  </h3>
                  <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={results.cumulativeResults.slice(0, currentMonthIdx + 1)}>
                        <defs>
                          <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15}/>
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                        <YAxis axisLine={false} tickLine={false} tickFormatter={formatCompact} tick={{fontSize: 10}} />
                        <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none' }} />
                        <Area type="monotone" dataKey="balance" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorBalance)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
              
              <div className="space-y-8">
                <div className="bg-white dark:bg-darkCard p-6 rounded-[2rem] border border-slate-200 dark:border-darkBorder shadow-sm">
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center text-sm">
                    <PieIcon className="w-4 h-4 mr-2 text-indigo-500" />
                    Gastos do Mês de {MONTHS[currentMonthIdx]}
                  </h3>
                  <div className="h-[220px] w-full">
                    {chartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={chartData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={8} dataKey="value" stroke="none">
                            {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full opacity-20">
                        <LayoutDashboard size={40} className="mb-2" />
                        <p className="text-[10px] font-bold uppercase">Sem gastos</p>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="bg-slate-900 p-6 rounded-[2rem] text-white shadow-xl">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4">Meta Anual (Total 12 meses)</h3>
                  <div className="space-y-4">
                    <div><p className="text-[10px] text-slate-500 uppercase font-bold">Expectativa Bruta</p><p className="text-xl font-bold">{formatCurrency(results.annualGross)}</p></div>
                    <div><p className="text-[10px] text-slate-500 uppercase font-bold">Gasto Total Previsto</p><p className="text-xl font-bold text-amber-400">{formatCurrency(results.annualExpenses)}</p></div>
                    <div className="pt-4 border-t border-white/10"><p className="text-[10px] text-indigo-400 uppercase font-bold">Projeção Final</p><p className={`text-2xl font-black ${results.annualBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{formatCurrency(results.annualBalance)}</p></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'annual' && (
          <div className="space-y-8 animate-fade-in pb-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Relatórios de Performance</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Análise granular por períodos personalizados.</p>
              </div>
              <div className="bg-white dark:bg-darkCard p-1 rounded-2xl border border-slate-200 dark:border-darkBorder flex items-center shadow-sm overflow-hidden">
                {PERIOD_OPTIONS.map((period) => (
                   <button 
                    key={period.label}
                    onClick={() => setSelectedPeriod(period)}
                    className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all rounded-xl ${selectedPeriod.label === period.label ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                   >
                    {period.label}
                   </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
               <SummaryCard title="Renda no Período" value={results.pGross} type="income" subtitle={selectedPeriod.label} />
               <SummaryCard title="Gasto no Período" value={results.pExpenses} type="expense" subtitle={selectedPeriod.label} />
               <SummaryCard title="Investido" value={results.pInvested} type="positive" subtitle={selectedPeriod.label} />
               <SummaryCard title="Saldo Final" value={results.pBalance} type={results.pBalance >= 0 ? 'positive' : 'negative'} subtitle={selectedPeriod.label} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
               <div className="lg:col-span-1 bg-white dark:bg-darkCard p-8 rounded-[3rem] border border-slate-200 dark:border-darkBorder shadow-sm flex flex-col items-center text-center">
                  <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-8">Eficiência do Período</h3>
                  <div className="h-64 w-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="100%" barSize={15} data={[{ name: 'Eficiência', value: results.savingsRate, fill: results.savingsRate >= 20 ? '#10b981' : results.savingsRate >= 0 ? '#6366f1' : '#ef4444' }]} startAngle={180} endAngle={0}>
                        <RadialBar background dataKey="value" cornerRadius={10} />
                      </RadialBarChart>
                    </ResponsiveContainer>
                    <div className="absolute top-[45%] left-1/2 -translate-x-1/2 text-center">
                      <p className="text-5xl font-black text-slate-900 dark:text-white leading-none">{results.savingsRate}%</p>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Saving Rate</p>
                    </div>
                  </div>
               </div>

               <div className="lg:col-span-2 bg-white dark:bg-darkCard p-8 rounded-[3rem] border border-slate-200 dark:border-darkBorder shadow-sm">
                  <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-8 flex items-center"><BarChart3 size={18} className="mr-3 text-indigo-500" />Fluxo: {selectedPeriod.label}</h3>
                  <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={results.periodResults}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="shortMonth" axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                        <Tooltip />
                        <Bar dataKey="income" fill="#6366f1" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="expense" fill="#fbbf24" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
               </div>
            </div>
          </div>
        )}

        {activeTab === 'strategy' && (
          <div className="space-y-8 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Centro de Inteligência Global</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Análise macroeconômica e previsões estratégicas alimentadas por IA.</p>
              </div>
              <div className="bg-white dark:bg-darkCard p-2 rounded-2xl border border-slate-200 dark:border-darkBorder flex items-center space-x-4">
                 <CurrencyTicker />
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
              <div className="xl:col-span-8 space-y-8">
                <MarketIntelligence newsHeadlines={newsHeadlines} userId={session?.user?.id} />
                <div className="bg-indigo-600 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-[80px]"></div>
                  <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                    <div className="w-16 h-16 bg-white/20 rounded-3xl flex items-center justify-center shrink-0"><Trophy size={32} /></div>
                    <div>
                      <h3 className="text-xl font-black mb-2 uppercase tracking-widest">Estratégia de Longo Prazo</h3>
                      <p className="text-sm text-indigo-100 leading-relaxed">Continue investindo na sua educação financeira. O retorno sobre o conhecimento é o maior que existe.</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="xl:col-span-4 sticky top-24">
                <EconomicNews onNewsLoaded={setNewsHeadlines} />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-12">
            <div className="bg-white dark:bg-darkCard rounded-[3rem] border border-slate-200 dark:border-darkBorder shadow-sm overflow-hidden">
              <div className="h-48 bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-800 relative">
                 <div className="absolute -bottom-16 left-8">
                    <div className="w-32 h-32 rounded-[2.5rem] bg-white dark:bg-darkCard p-2 shadow-2xl border border-white/20">
                       <div className="w-full h-full bg-slate-100 dark:bg-slate-800 rounded-[2rem] flex items-center justify-center text-indigo-600 dark:text-indigo-400"><User size={64} /></div>
                    </div>
                 </div>
              </div>
              <div className="pt-20 px-8 pb-10">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                  <div>
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{displayName}</h2>
                    <div className="flex items-center space-x-2 text-slate-500 dark:text-slate-400 mt-1 font-medium"><Mail size={16} /><span>{session?.user?.email}</span></div>
                  </div>
                  <button onClick={handleLogout} className="flex items-center space-x-2 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 px-6 py-3 rounded-2xl font-bold transition-all hover:bg-rose-100 dark:hover:bg-rose-900/30 border border-rose-100 dark:border-rose-900/30"><LogOut size={18} /><span>Sair</span></button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <ChatBot financialData={state} />

      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-darkCard/90 backdrop-blur-xl border-t border-slate-200 dark:border-darkBorder flex items-center justify-around h-20 px-4 lg:hidden z-40">
        <button onClick={() => setActiveTab('inputs')} className={`flex flex-col items-center space-y-1 transition-all ${activeTab === 'inputs' ? 'text-indigo-600 scale-110' : 'text-slate-400'}`}>
          <div className={`p-2 rounded-xl ${activeTab === 'inputs' ? 'bg-indigo-50 dark:bg-indigo-900/30' : ''}`}><PlusCircle size={22} /></div>
          <span className="text-[9px] font-black uppercase tracking-widest">Lançar</span>
        </button>
        <button onClick={() => setActiveTab('dashboard')} className={`flex flex-col items-center space-y-1 transition-all ${activeTab === 'dashboard' ? 'text-indigo-600 scale-110' : 'text-slate-400'}`}>
          <div className={`p-2 rounded-xl ${activeTab === 'dashboard' ? 'bg-indigo-50 dark:bg-indigo-900/30' : ''}`}><LayoutDashboard size={22} /></div>
          <span className="text-[9px] font-black uppercase tracking-widest">Painel</span>
        </button>
        <button onClick={() => setActiveTab('annual')} className={`flex flex-col items-center space-y-1 transition-all ${activeTab === 'annual' ? 'text-indigo-600 scale-110' : 'text-slate-400'}`}>
          <div className={`p-2 rounded-xl ${activeTab === 'annual' ? 'bg-indigo-50 dark:bg-indigo-900/30' : ''}`}><BarChart3 size={22} /></div>
          <span className="text-[9px] font-black uppercase tracking-widest">Relatórios</span>
        </button>
        <button onClick={() => setActiveTab('strategy')} className={`flex flex-col items-center space-y-1 transition-all ${activeTab === 'strategy' ? 'text-indigo-600 scale-110' : 'text-slate-400'}`}>
          <div className={`p-2 rounded-xl ${activeTab === 'strategy' ? 'bg-indigo-50 dark:bg-indigo-900/30' : ''}`}><BrainCircuit size={22} /></div>
          <span className="text-[9px] font-black uppercase tracking-widest">Estratégia</span>
        </button>
        <button onClick={() => setActiveTab('profile')} className={`flex flex-col items-center space-y-1 transition-all ${activeTab === 'profile' ? 'text-indigo-600 scale-110' : 'text-slate-400'}`}>
          <div className={`p-2 rounded-xl ${activeTab === 'profile' ? 'bg-indigo-50 dark:bg-indigo-900/30' : ''}`}><User size={22} /></div>
          <span className="text-[9px] font-black uppercase tracking-widest">Perfil</span>
        </button>
      </nav>
    </div>
  );
};

export default App;

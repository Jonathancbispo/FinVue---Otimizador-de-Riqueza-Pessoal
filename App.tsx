
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { 
  Wallet, TrendingUp, CreditCard, ShoppingCart, Utensils, Calendar, Sparkles,
  PieChart as PieIcon, BarChart3, PlusCircle, LayoutDashboard, Moon, Sun,
  Target, Trophy, LineChart as LineIcon, BrainCircuit, LogOut, RefreshCw,
  Receipt, User, Mail, Database, History, ImageIcon, Loader2, Copy, CheckCircle2,
  CalendarDays, Activity, AlertCircle, ChevronRight, Cloud
} from 'lucide-react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, 
  CartesianGrid, AreaChart, Area, RadialBarChart, RadialBar, Legend, Line, ComposedChart
} from 'recharts';
import NumberInput from './components/NumberInput';
import SummaryCard from './components/SummaryCard';
import ChatBot from './components/ChatBot';
import CurrencyTicker from './components/CurrencyTicker';
import EconomicNews from './components/EconomicNews';
import MarketIntelligence from './components/MarketIntelligence';
import ProfileSettings from './components/ProfileSettings';
import Login from './components/Login';
import { FinancialState } from './types';
import { getFinancialAdvice } from './services/geminiService';
import { supabase, loadFinancialData, saveFinancialData, getUserAssets } from './services/supabaseClient';

const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const PERIOD_OPTIONS = [
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
  const [dataLoaded, setDataLoaded] = useState(false);
  const [setupRequired, setSetupRequired] = useState(false);
  const [generatedAssets, setGeneratedAssets] = useState<any[]>([]);
  const [currentMonthIdx, setCurrentMonthIdx] = useState(new Date().getMonth());
  const [activeTab, setActiveTab] = useState<'inputs' | 'dashboard' | 'strategy' | 'profile' | 'annual'>('dashboard');
  const [selectedPeriod, setSelectedPeriod] = useState(PERIOD_OPTIONS[0]);
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('finvue_theme') !== 'light');
  const [newsHeadlines, setNewsHeadlines] = useState<string[]>([]);
  const [copySuccess, setCopySuccess] = useState(false);

  const displayName = useMemo(() => {
    return session?.user?.user_metadata?.display_name || session?.user?.email?.split('@')[0] || 'Investidor';
  }, [session]);

  const createEmptyYear = () => Array(12).fill(0);
  const [state, setState] = useState<FinancialState>({
    income: { fixed: createEmptyYear(), extra: createEmptyYear(), investments: createEmptyYear() },
    expenses: { fixed: createEmptyYear(), creditCard: createEmptyYear(), monthlyPurchases: createEmptyYear(), butcher: createEmptyYear(), weekly: createEmptyYear(), otherExpenses: createEmptyYear() }
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsAuthenticated(!!session);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setIsAuthenticated(!!session);
      if (!session) {
        setDataLoaded(false);
        setState({
          income: { fixed: createEmptyYear(), extra: createEmptyYear(), investments: createEmptyYear() },
          expenses: { fixed: createEmptyYear(), creditCard: createEmptyYear(), monthlyPurchases: createEmptyYear(), butcher: createEmptyYear(), weekly: createEmptyYear(), otherExpenses: createEmptyYear() }
        });
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const safeMerge = (incoming: any): FinancialState => {
    const base = {
      income: { fixed: createEmptyYear(), extra: createEmptyYear(), investments: createEmptyYear() },
      expenses: { fixed: createEmptyYear(), creditCard: createEmptyYear(), monthlyPurchases: createEmptyYear(), butcher: createEmptyYear(), weekly: createEmptyYear(), otherExpenses: createEmptyYear() }
    };
    if (!incoming) return base;
    const merge = (target: any, source: any) => {
      if (!source) return;
      Object.keys(target).forEach(key => {
        if (Array.isArray(source[key])) target[key] = [...source[key]].map(v => typeof v === 'number' ? v : 0);
      });
    };
    if (incoming.income) merge(base.income, incoming.income);
    if (incoming.expenses) merge(base.expenses, incoming.expenses);
    return base;
  };

  const fetchData = useCallback(async (userId: string) => {
    setIsSyncing(true);
    try {
      const cloudData = await loadFinancialData(userId);
      if (cloudData) setState(safeMerge(cloudData));
      const assets = await getUserAssets(userId);
      setGeneratedAssets(assets);
      setDataLoaded(true);
      setSetupRequired(false);
    } catch (error: any) {
      if (error.code === 'PGRST205' || error.message?.includes('financial_data')) setSetupRequired(true);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && session?.user?.id) fetchData(session.user.id);
  }, [isAuthenticated, session, fetchData]);

  // Efeito de Salvamento Automático (Debounce)
  useEffect(() => {
    if (isAuthenticated && session?.user?.id && dataLoaded && !setupRequired) {
      const timer = setTimeout(async () => {
        setIsSyncing(true);
        try {
          await saveFinancialData(session.user.id, state);
        } catch (err: any) {
          if (err.code === 'PGRST205') setSetupRequired(true);
        } finally {
          setIsSyncing(false);
        }
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [state, isAuthenticated, session, dataLoaded, setupRequired]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
    localStorage.setItem('finvue_theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const results = useMemo(() => {
    let runningBalance = 0;
    const allMonthlyResults = MONTHS.map((_, idx) => {
      const gross = (state.income.fixed[idx] || 0) + (state.income.extra[idx] || 0);
      const income = gross - (state.income.investments[idx] || 0);
      const expense = (state.expenses.fixed[idx] || 0) + (state.expenses.creditCard[idx] || 0) + (state.expenses.monthlyPurchases[idx] || 0) + (state.expenses.butcher[idx] || 0) + (state.expenses.weekly[idx] || 0) + (state.expenses.otherExpenses[idx] || 0);
      const balance = income - expense;
      return { income, gross, expense, balance, invested: state.income.investments[idx] || 0, month: MONTHS[idx], shortMonth: MONTHS[idx].substring(0, 3) };
    });

    const periodResults = allMonthlyResults.slice(selectedPeriod.start, selectedPeriod.end + 1);
    const pGross = periodResults.reduce((a, b) => a + b.gross, 0);
    const pIncome = periodResults.reduce((a, b) => a + b.income, 0);
    const pExpenses = periodResults.reduce((a, b) => a + b.expense, 0);
    const pInvested = periodResults.reduce((a, b) => a + b.invested, 0);
    const pBalance = pIncome - pExpenses;

    return { 
      annualGross: allMonthlyResults.reduce((a, b) => a + b.gross, 0),
      annualExpenses: allMonthlyResults.reduce((a, b) => a + b.expense, 0),
      annualBalance: allMonthlyResults.reduce((a, b) => a + b.balance, 0),
      allMonthlyResults, pGross, pIncome, pExpenses, pInvested, pBalance,
      savingsRate: pGross > 0 ? Math.round((pBalance / pIncome) * 100) : 0,
      periodResults
    } as any;
  }, [state, selectedPeriod]);

  const updateField = (cat: 'income' | 'expenses', field: string, val: number) => {
    setState(prev => {
      const newState = JSON.parse(JSON.stringify(prev));
      newState[cat][field][currentMonthIdx] = val;
      return newState;
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    setSession(null);
  };

  const copySQL = () => {
    navigator.clipboard.writeText("CREATE UNIQUE INDEX ON financial_data (user_id, year);");
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const formatCurrency = (num: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(num);

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-darkBg flex flex-col transition-colors duration-300 pb-20 lg:pb-0">
      {!isAuthenticated ? (
        <Login onLogin={(s) => { setSession(s); setIsAuthenticated(true); }} isDarkMode={isDarkMode} />
      ) : (
        <>
          <header className="bg-white dark:bg-darkCard border-b border-slate-200 dark:border-darkBorder sticky top-0 z-50 px-4 h-16 flex items-center justify-between">
            <div className="flex items-center space-x-2 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
              <div className="bg-indigo-600 p-2 rounded-lg shadow-lg shadow-indigo-200 dark:shadow-none"><TrendingUp className="w-5 h-5 text-white" /></div>
              <h1 className="text-xl font-bold dark:text-white tracking-tight">FinVue<span className="text-indigo-600">.</span></h1>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* Indicador de Nuvem/Sincronização */}
              <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-[9px] font-black uppercase transition-all ${isSyncing ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20' : 'bg-slate-50 text-slate-400 dark:bg-slate-800/30'}`}>
                {isSyncing ? (
                  <>
                    <RefreshCw size={12} className="animate-spin" />
                    <span className="animate-pulse">Sincronizando...</span>
                  </>
                ) : (
                  <>
                    <Cloud size={12} />
                    <span>Nuvem Ativa</span>
                  </>
                )}
              </div>

              <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              <button onClick={() => setActiveTab('profile')} className={`p-2 rounded-full transition-colors ${activeTab === 'profile' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}>
                <User size={20} />
              </button>
            </div>
          </header>

          <main className="max-w-7xl mx-auto px-4 mt-6 w-full flex-1 mb-8">
            {setupRequired && (
              <div className="mb-8 p-8 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-[3rem] shadow-xl animate-fade-in">
                <div className="flex flex-col md:flex-row items-center gap-8">
                  <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-3xl flex items-center justify-center shrink-0">
                    <Database className="w-8 h-8 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="flex-1 space-y-3">
                    <h3 className="text-xl font-black text-amber-900 dark:text-amber-100 uppercase tracking-tight">Configuração de Banco Necessária</h3>
                    <p className="text-sm text-amber-700 dark:text-amber-300 font-medium leading-relaxed">
                      Seu banco de dados Supabase precisa de uma restrição de unicidade para sincronizar. Execute este comando SQL:
                    </p>
                    <div className="flex items-center gap-3">
                      <code className="flex-1 bg-black/90 text-emerald-400 p-4 rounded-2xl font-mono text-[10px] overflow-x-auto shadow-inner">
                        CREATE UNIQUE INDEX ON financial_data (user_id, year);
                      </code>
                      <button onClick={copySQL} className="p-4 bg-white dark:bg-slate-800 border rounded-2xl hover:bg-slate-50 transition-all shadow-sm">
                        {copySuccess ? <CheckCircle2 className="text-emerald-500" /> : <Copy className="text-slate-400" />}
                      </button>
                    </div>
                  </div>
                  <button onClick={() => fetchData(session.user.id)} className="bg-amber-600 hover:bg-amber-700 text-white px-8 py-4 rounded-2xl font-bold shadow-lg transition-all active:scale-95 shrink-0">
                    Verificar Agora
                  </button>
                </div>
              </div>
            )}

            <nav className="flex bg-white dark:bg-darkCard p-1 rounded-2xl border border-slate-200 dark:border-darkBorder mb-8 max-w-fit mx-auto shadow-sm sticky top-20 z-40 backdrop-blur-md">
              {['inputs', 'dashboard', 'annual', 'strategy'].map(tab => (
                <button 
                  key={tab} 
                  onClick={() => setActiveTab(tab as any)} 
                  className={`px-6 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === tab ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  {tab === 'inputs' ? 'Lançar' : tab === 'dashboard' ? 'Painel' : tab === 'annual' ? 'Relatórios' : 'Estratégia'}
                </button>
              ))}
            </nav>

            {activeTab === 'inputs' && (
              <div className="space-y-8 animate-fade-in">
                <div className="flex items-center justify-between bg-white dark:bg-darkCard p-6 rounded-[2rem] border border-slate-200 dark:border-darkBorder shadow-sm">
                   <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Lançamentos de {MONTHS[currentMonthIdx]}</h2>
                   <div className="flex gap-2">
                      <button onClick={() => setCurrentMonthIdx(m => (m > 0 ? m - 1 : 11))} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"><Calendar size={18} /></button>
                      <button onClick={() => setCurrentMonthIdx(m => (m < 11 ? m + 1 : 0))} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"><ChevronRight size={18} /></button>
                   </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <section className="bg-white dark:bg-darkCard p-8 rounded-[2.5rem] border border-slate-200 dark:border-darkBorder shadow-sm">
                    <div className="flex items-center space-x-3 mb-8"><div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center"><Wallet className="w-5 h-5 text-emerald-600" /></div><h3 className="text-lg font-bold">Renda e Investimentos</h3></div>
                    <div className="space-y-6">
                      <NumberInput label="Renda Fixa" value={state.income.fixed[currentMonthIdx]} onChange={(v) => updateField('income', 'fixed', v)} />
                      <NumberInput label="Renda Extra" value={state.income.extra[currentMonthIdx]} onChange={(v) => updateField('income', 'extra', v)} />
                      <div className="pt-4 border-t border-slate-100 dark:border-darkBorder">
                        <NumberInput label="Total Investido" value={state.income.investments[currentMonthIdx]} onChange={(v) => updateField('income', 'investments', v)} tooltip="Valor deduzido da renda bruta para cálculo do saldo." icon={<Target className="text-indigo-500" />} />
                      </div>
                    </div>
                  </section>
                  <section className="bg-white dark:bg-darkCard p-8 rounded-[2.5rem] border border-slate-200 dark:border-darkBorder shadow-sm">
                    <div className="flex items-center space-x-3 mb-8"><div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center"><CreditCard className="w-5 h-5 text-rose-600" /></div><h3 className="text-lg font-bold">Despesas do Mês</h3></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <NumberInput label="Despesas Fixas" value={state.expenses.fixed[currentMonthIdx]} onChange={(v) => updateField('expenses', 'fixed', v)} />
                      <NumberInput label="Cartão de Crédito" value={state.expenses.creditCard[currentMonthIdx]} onChange={(v) => updateField('expenses', 'creditCard', v)} />
                      <NumberInput label="Compras Mensais" value={state.expenses.monthlyPurchases[currentMonthIdx]} onChange={(v) => updateField('expenses', 'monthlyPurchases', v)} />
                      <NumberInput label="Outros Gastos" value={state.expenses.otherExpenses[currentMonthIdx]} onChange={(v) => updateField('expenses', 'otherExpenses', v)} />
                    </div>
                  </section>
                </div>
              </div>
            )}

            {activeTab === 'dashboard' && (
              <div className="space-y-8 animate-fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <SummaryCard title="Renda Líquida" value={results.allMonthlyResults[currentMonthIdx].income} type="income" subtitle={MONTHS[currentMonthIdx]} />
                  <SummaryCard title="Despesa Total" value={results.allMonthlyResults[currentMonthIdx].expense} type="expense" subtitle={MONTHS[currentMonthIdx]} />
                  <SummaryCard title="Saldo do Mês" value={results.allMonthlyResults[currentMonthIdx].balance} type="balance" subtitle={MONTHS[currentMonthIdx]} />
                  <SummaryCard title="Investido (Acumulado)" value={results.pInvested} type="balance" subtitle="Ano Corrente" />
                </div>
                
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                  <div className="xl:col-span-2 bg-white dark:bg-darkCard p-8 rounded-[3rem] border border-slate-200 dark:border-darkBorder shadow-sm h-[450px]">
                    <h3 className="font-black text-xs mb-8 uppercase tracking-widest text-slate-400">Fluxo de Caixa Consolidado</h3>
                    <ResponsiveContainer width="100%" height="90%">
                      <ComposedChart data={results.allMonthlyResults}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? "#1e293b" : "#f1f5f9"} />
                        <XAxis dataKey="shortMonth" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b'}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b'}} />
                        <Tooltip 
                          contentStyle={{ borderRadius: '1.2rem', border: 'none', backgroundColor: isDarkMode ? '#0f172a' : '#fff', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.15)' }}
                          formatter={(v: number, name: string) => [formatCurrency(v), name === 'income' ? 'Renda' : 'Despesa']}
                        />
                        <Bar name="income" dataKey="income" fill="#10b981" radius={[4,4,0,0]} barSize={24} />
                        <Bar name="expense" dataKey="expense" fill="#f43f5e" radius={[4,4,0,0]} barSize={24} />
                        <Line name="balance" type="monotone" dataKey="balance" stroke="#6366f1" strokeWidth={4} dot={{ r: 5, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div className="bg-slate-900 p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden flex flex-col justify-between">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl -mr-24 -mt-24"></div>
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-6">Projeção Patrimonial</h3>
                    <div className="space-y-8 relative z-10">
                      <div><p className="text-[9px] text-emerald-500/60 uppercase font-black tracking-widest mb-1">Renda Bruta Total</p><p className="text-3xl font-black text-emerald-400">{formatCurrency(results.annualGross)}</p></div>
                      <div><p className="text-[9px] text-rose-500/60 uppercase font-black tracking-widest mb-1">Gastos Previstos</p><p className="text-3xl font-black text-rose-400">{formatCurrency(results.annualExpenses)}</p></div>
                      <div className="pt-8 border-t border-white/10">
                        <p className="text-[9px] text-indigo-400/60 uppercase font-black tracking-widest mb-1">Saldo Líquido Anual</p>
                        <p className={`text-4xl font-black ${results.annualBalance >= 0 ? 'text-indigo-400' : 'text-rose-400'}`}>{formatCurrency(results.annualBalance)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'annual' && (
              <div className="space-y-8 animate-fade-in">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Performance Analítica</h2>
                  <div className="flex bg-white dark:bg-darkCard p-1 rounded-2xl border overflow-x-auto scrollbar-hide max-w-full">
                    {PERIOD_OPTIONS.map(p => (
                      <button key={p.label} onClick={() => setSelectedPeriod(p)} className={`px-4 py-2 text-[9px] font-black uppercase tracking-widest whitespace-nowrap rounded-xl transition-all ${selectedPeriod.label === p.label ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400'}`}>{p.label}</button>
                    ))}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <SummaryCard title="Renda Bruta" value={results.pGross} type="income" subtitle={selectedPeriod.label} />
                  <SummaryCard title="Despesa Total" value={results.pExpenses} type="expense" subtitle={selectedPeriod.label} />
                  <SummaryCard title="Valor Investido" value={results.pInvested} type="balance" subtitle={selectedPeriod.label} />
                  <SummaryCard title="Resultado Líquido" value={results.pBalance} type="balance" subtitle={selectedPeriod.label} />
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-1 bg-white dark:bg-darkCard p-10 rounded-[3.5rem] border border-slate-200 dark:border-darkBorder shadow-sm flex flex-col items-center">
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-10">Eficiência Financeira</h3>
                    <div className="w-full aspect-square relative max-w-[280px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadialBarChart cx="50%" cy="50%" innerRadius="70%" outerRadius="100%" barSize={20} data={[{ value: results.savingsRate, fill: '#6366f1' }]} startAngle={210} endAngle={-30}>
                          <RadialBar background dataKey="value" cornerRadius={12} />
                        </RadialBarChart>
                      </ResponsiveContainer>
                      <div className="absolute top-[50%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                        <p className="text-6xl font-black text-indigo-600 dark:text-indigo-400 leading-none">{results.savingsRate}%</p>
                        <p className="text-[10px] font-black text-slate-400 mt-4 uppercase tracking-[0.2em]">Taxa de Poupança</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="lg:col-span-2 bg-white dark:bg-darkCard p-10 rounded-[3.5rem] border border-slate-200 dark:border-darkBorder shadow-sm h-[450px]">
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-10">Fluxo de Caixa: {selectedPeriod.label}</h3>
                    <ResponsiveContainer width="100%" height="85%">
                      <BarChart data={results.periodResults}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? "#1e293b" : "#f1f5f9"} />
                        <XAxis dataKey="shortMonth" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b'}} />
                        <Tooltip 
                          cursor={{fill: 'rgba(99,102,241,0.05)'}}
                          contentStyle={{ borderRadius: '1.2rem', border: 'none', backgroundColor: isDarkMode ? '#0f172a' : '#fff', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.15)' }}
                          formatter={(v: any, name: string) => [formatCurrency(v), name === 'income' ? 'Renda' : 'Despesa']}
                        />
                        <Bar name="income" dataKey="income" fill="#10b981" radius={[6,6,0,0]} barSize={32} />
                        <Bar name="expense" dataKey="expense" fill="#f43f5e" radius={[6,6,0,0]} barSize={32} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'strategy' && (
              <MarketIntelligence 
                newsHeadlines={newsHeadlines} 
                userId={session?.user?.id} 
                history={generatedAssets} 
                onAssetGenerated={(newAsset) => setGeneratedAssets([newAsset, ...generatedAssets])}
              />
            )}
            
            {activeTab === 'profile' && (
              <ProfileSettings 
                initialName={displayName} 
                email={session?.user?.email} 
                onLogout={handleLogout}
              />
            )}
          </main>

          <ChatBot financialData={state} />
          
          <nav className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-darkCard/95 backdrop-blur-xl border-t border-slate-200 dark:border-darkBorder h-20 lg:hidden flex justify-around items-center px-4 z-40">
            <button onClick={() => setActiveTab('dashboard')} className={`flex flex-col items-center gap-1 ${activeTab === 'dashboard' ? 'text-indigo-600' : 'text-slate-400'}`}>
              <LayoutDashboard size={22} />
              <span className="text-[9px] font-black uppercase">Painel</span>
            </button>
            <button onClick={() => setActiveTab('inputs')} className={`flex flex-col items-center gap-1 ${activeTab === 'inputs' ? 'text-indigo-600' : 'text-slate-400'}`}>
              <PlusCircle size={22} />
              <span className="text-[9px] font-black uppercase">Lançar</span>
            </button>
            <button onClick={() => setActiveTab('annual')} className={`flex flex-col items-center gap-1 ${activeTab === 'annual' ? 'text-indigo-600' : 'text-slate-400'}`}>
              <BarChart3 size={22} />
              <span className="text-[9px] font-black uppercase">Relatórios</span>
            </button>
            <button onClick={() => setActiveTab('profile')} className={`flex flex-col items-center gap-1 ${activeTab === 'profile' ? 'text-indigo-600' : 'text-slate-400'}`}>
              <User size={22} />
              <span className="text-[9px] font-black uppercase">Perfil</span>
            </button>
          </nav>
        </>
      )}
    </div>
  );
};

export default App;

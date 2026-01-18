
import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Zap, 
  TrendingUp, 
  TrendingDown, 
  Info, 
  BrainCircuit, 
  Loader2, 
  Briefcase,
  PieChart as PieIcon,
  ChevronRight,
  LineChart,
  Sparkles,
  Image as ImageIcon,
  AlertTriangle,
  RefreshCcw
} from 'lucide-react';
import { getMarketIntelligence } from '../services/geminiService';
import { GoogleGenAI } from "@google/genai";
import { saveGeneratedAsset } from '../services/supabaseClient';

interface ForecastData {
  outlook: string; 
  risk: string;
  portfolio: string[];
}

interface MarketData {
  sentiment: string;
  sentimentColor: 'emerald' | 'rose' | 'slate';
  explanation: string;
  shortTerm: ForecastData;
  mediumTerm: ForecastData;
  longTerm: ForecastData;
  drivers: string[];
}

const MarketIntelligence: React.FC<{ newsHeadlines: string[], userId?: string }> = ({ newsHeadlines, userId }) => {
  const [data, setData] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  const runAnalysis = async () => {
    if (!newsHeadlines || newsHeadlines.length === 0) return;
    setLoading(true);
    setError(false);
    try {
      const result = await getMarketIntelligence(newsHeadlines);
      if (result) {
        const s = result.sentiment.toLowerCase();
        let color: 'emerald' | 'rose' | 'slate' = 'slate';
        if (s.includes('otimista')) color = 'emerald';
        else if (s.includes('pessimista')) color = 'rose';
        
        setData({ ...result, sentimentColor: color });
      } else {
        setError(true);
      }
    } catch (err) {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const generateWealthVision = async () => {
    if (!data || !userId) return;
    setIsGeneratingImage(true);
    
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `A futuristic, high-tech, cinematic masterpiece visualization of financial success and growth. 
    Theme: ${data.sentiment}. Concept: ${data.explanation}. 
    Style: Minimalist luxury, architectural financial hub, neon indigo and emerald accents, 4k, hyper-realistic.`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: prompt }] },
      });

      let imageUrl = null;
      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            imageUrl = `data:image/png;base64,${part.inlineData.data}`;
            break;
          }
        }
      }

      if (imageUrl) {
        setGeneratedImage(imageUrl);
        await saveGeneratedAsset(userId, prompt, imageUrl, 'wealth_vision');
      }
    } catch (error) {
      console.error("Erro ao gerar imagem:", error);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  useEffect(() => {
    if (newsHeadlines && newsHeadlines.length > 0 && !data && !loading && !error) {
      runAnalysis();
    }
  }, [newsHeadlines]);

  const getRiskBadge = (risk: string) => {
    const r = risk?.toLowerCase() || '';
    if (r.includes('alto') || r.includes('high')) return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400';
    if (r.includes('médio') || r.includes('medium')) return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
    return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
  };

  const ForecastCard = ({ title, icon: Icon, data, accentColor }: { title: string, icon: any, data: ForecastData, accentColor: string }) => (
    <div className="bg-white dark:bg-darkCard p-6 rounded-[2rem] border border-slate-200 dark:border-darkBorder shadow-sm flex flex-col hover:shadow-md transition-all group">
      <div className="flex items-center justify-between mb-4">
        <div className={`flex items-center space-x-2 ${accentColor}`}>
          <Icon size={18} />
          <h4 className="text-[10px] font-black uppercase tracking-widest">{title}</h4>
        </div>
        <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase ${getRiskBadge(data.risk)}`}>
          Risco {data.risk}
        </span>
      </div>
      
      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-relaxed mb-6">
        {data.outlook}
      </p>

      <div className="space-y-3">
        <div className="flex items-center space-x-2 text-[10px] font-black uppercase tracking-tighter text-slate-400">
          <Briefcase size={12} />
          <span>Sugestão de Carteira</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {data.portfolio.map((item, idx) => (
            <div key={idx} className="flex items-center bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-darkBorder rounded-lg px-2 py-1 text-[10px] text-slate-600 dark:text-slate-400 font-medium">
              <ChevronRight size={8} className="mr-1 text-indigo-500" />
              {item}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="bg-white dark:bg-darkCard p-8 rounded-[2.5rem] border border-slate-200 dark:border-darkBorder flex flex-col items-center justify-center space-y-4 min-h-[450px]">
        <div className="relative">
          <BrainCircuit className="w-14 h-14 text-indigo-500 animate-pulse" />
          <Loader2 className="w-14 h-14 text-indigo-500 animate-spin absolute top-0 left-0 opacity-20" />
        </div>
        <div className="text-center">
          <p className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-slate-200">Simulador Estratégico</p>
          <p className="text-xs text-slate-400 mt-1">Computando modelos de alocação de ativos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-darkCard p-8 rounded-[2.5rem] border border-slate-200 dark:border-darkBorder flex flex-col items-center justify-center space-y-4 min-h-[450px] text-center">
        <AlertTriangle className="w-12 h-12 text-amber-500" />
        <div>
          <h4 className="font-bold text-slate-900 dark:text-white">Ops! Falha na Análise</h4>
          <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">Não conseguimos processar os dados de mercado no momento. Tente novamente em alguns instantes.</p>
        </div>
        <button onClick={runAnalysis} className="flex items-center space-x-2 bg-indigo-600 text-white px-6 py-2 rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all">
          <RefreshCcw size={14} />
          <span>Tentar Novamente</span>
        </button>
      </div>
    );
  }

  if (!newsHeadlines || newsHeadlines.length === 0) {
    return (
      <div className="bg-white dark:bg-darkCard p-8 rounded-[2.5rem] border border-slate-200 dark:border-darkBorder flex flex-col items-center justify-center space-y-4 min-h-[450px] text-center opacity-60">
        <Zap className="w-12 h-12 text-indigo-400" />
        <div>
          <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-widest text-xs">Aguardando Dados</h4>
          <p className="text-[10px] text-slate-500 mt-1 max-w-xs mx-auto uppercase font-bold tracking-tighter">Carregando manchetes globais para iniciar processamento estratégico...</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6 animate-fade-in">
      <section className="bg-white dark:bg-darkCard p-6 rounded-[2.5rem] border border-slate-200 dark:border-darkBorder shadow-sm overflow-hidden relative group">
        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
          {data.sentimentColor === 'rose' ? <TrendingDown size={120} /> : <TrendingUp size={120} />}
        </div>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center space-x-4">
            <div className={`w-16 h-16 rounded-3xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-105 ${
              data.sentimentColor === 'rose' ? 'bg-rose-500 text-white shadow-rose-200' : 
              data.sentimentColor === 'emerald' ? 'bg-emerald-500 text-white shadow-emerald-200' : 
              'bg-slate-500 text-white shadow-slate-200'
            }`}>
              {data.sentimentColor === 'rose' ? <TrendingDown size={32} /> : <TrendingUp size={32} />}
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sentimento Global</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">{data.sentiment}</h3>
            </div>
          </div>
          
          <div className="flex-1 md:max-w-lg">
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium italic">
              "{data.explanation}"
            </p>
          </div>

          <div className="flex space-x-2">
            <button 
              onClick={generateWealthVision}
              disabled={isGeneratingImage || !userId}
              className="p-4 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 shadow-lg shadow-emerald-100 dark:shadow-none transition-all disabled:opacity-50 relative overflow-hidden group/btn"
              title="Gerar Visão de Riqueza"
            >
              {isGeneratingImage ? <Loader2 size={20} className="animate-spin" /> : <Sparkles size={20} />}
              {isGeneratingImage && (
                <div className="absolute inset-0 bg-emerald-600/50 flex items-center justify-center">
                  <span className="sr-only">Gerando...</span>
                </div>
              )}
            </button>
            <button 
              onClick={runAnalysis}
              className="p-4 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 dark:shadow-none transition-all"
              title="Recalcular Estratégia"
            >
              <BrainCircuit size={20} />
            </button>
          </div>
        </div>

        {generatedImage && (
          <div className="mt-8 rounded-[2rem] overflow-hidden border-4 border-indigo-500/20 shadow-2xl animate-in zoom-in-95 duration-500">
            <img src={generatedImage} alt="Visão de Riqueza" className="w-full h-auto object-cover max-h-[500px]" />
            <div className="bg-indigo-600/90 backdrop-blur-md p-4 flex items-center justify-between text-white">
              <div className="flex items-center space-x-2">
                <ImageIcon size={16} />
                <span className="text-xs font-black uppercase tracking-widest text-[9px]">Asset Salvo na Galeria de Perfil</span>
              </div>
              <p className="text-[9px] font-medium opacity-80 italic">Processado via FinVue Brain Core</p>
            </div>
          </div>
        )}

        <div className="mt-8 flex flex-wrap gap-2">
          {data.drivers.map((driver, idx) => (
            <span key={idx} className="px-3 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-darkBorder rounded-xl text-[10px] font-black uppercase tracking-tighter text-slate-500 dark:text-slate-400">
              {driver}
            </span>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ForecastCard title="Curto Prazo" icon={Zap} data={data.shortTerm} accentColor="text-indigo-500" />
        <ForecastCard title="Médio Prazo" icon={LineChart} data={data.mediumTerm} accentColor="text-amber-500" />
        <ForecastCard title="Longo Prazo" icon={ShieldCheck} data={data.longTerm} accentColor="text-emerald-500" />
      </div>

      <div className="bg-indigo-600/5 dark:bg-indigo-900/10 p-5 rounded-[2rem] flex items-start space-x-4 border border-indigo-100 dark:border-indigo-900/30">
        <Info className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-black uppercase tracking-[0.1em]">Aviso Legal de Inteligência</p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">As sugestões de carteira são baseadas em análise algorítmica de notícias em tempo real e servem apenas como referência educacional. Consulte sempre um assessor de investimentos certificado.</p>
        </div>
      </div>
    </div>
  );
};

export default MarketIntelligence;

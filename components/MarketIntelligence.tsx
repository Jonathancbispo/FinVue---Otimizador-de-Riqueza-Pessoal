
import React, { useState, useEffect, useCallback } from 'react';
import { 
  ShieldCheck, 
  Zap, 
  TrendingUp, 
  TrendingDown, 
  Briefcase,
  ChevronRight,
  LineChart,
  Sparkles,
  Loader2,
  AlertTriangle,
  RefreshCcw,
  FastForward,
  Info
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

  const runAnalysis = useCallback(async (forcedHeadlines?: string[]) => {
    setLoading(true);
    setError(false);
    try {
      const headlines = forcedHeadlines || newsHeadlines || [];
      const result = await getMarketIntelligence(headlines);
      
      if (result) {
        const s = result.sentiment.toLowerCase();
        let color: 'emerald' | 'rose' | 'slate' = 'slate';
        // Mapeamento de sentimentos em português ou inglês para cores
        if (s.includes('otimista') || s.includes('alta') || s.includes('bullish') || s.includes('verde')) color = 'emerald';
        else if (s.includes('pessimista') || s.includes('baixa') || s.includes('bearish') || s.includes('queda')) color = 'rose';
        
        setData({ ...result, sentimentColor: color });
      } else {
        setError(true);
      }
    } catch (err) {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [newsHeadlines]);

  useEffect(() => {
    if (!data && !loading && !error) {
      if (newsHeadlines && newsHeadlines.length > 0) {
        runAnalysis();
      } else {
        const timer = setTimeout(() => {
          if (!data && !loading) runAnalysis([]);
        }, 1500);
        return () => clearTimeout(timer);
      }
    }
  }, [newsHeadlines, data, loading, error, runAnalysis]);

  const generateWealthVision = async () => {
    if (!data || !userId) return;
    setIsGeneratingImage(true);
    
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Futuristic visualization of financial success, theme: ${data.sentiment}, brazilian investment prosperity, 8k cinematic lighting.`;

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
      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-relaxed mb-6">{data.outlook}</p>
      <div className="space-y-3">
        <div className="flex items-center space-x-2 text-[10px] font-black uppercase tracking-tighter text-slate-400">
          <Briefcase size={12} />
          <span>Portfólio Sugerido</span>
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
          <div className="absolute inset-0 bg-indigo-500/20 rounded-full animate-ping"></div>
          <div className="relative bg-indigo-600 p-6 rounded-3xl">
            <FastForward className="w-10 h-10 text-white animate-pulse" />
          </div>
        </div>
        <div className="text-center">
          <p className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">Gerando Estratégia</p>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-1">Modo Turbo Ativado (Traduzindo...)</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-darkCard p-8 rounded-[2.5rem] border border-slate-200 dark:border-darkBorder flex flex-col items-center justify-center space-y-4 min-h-[450px] text-center">
        <AlertTriangle className="w-12 h-12 text-amber-500" />
        <h4 className="font-bold">Falha no Processamento</h4>
        <p className="text-xs text-slate-400">Não foi possível gerar a estratégia de mercado no momento.</p>
        <button onClick={() => runAnalysis()} className="bg-indigo-600 text-white px-6 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 mt-4 hover:bg-indigo-700 transition-all">
          <RefreshCcw size={14} />
          <span>Tentar Novamente</span>
        </button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6 animate-fade-in">
      <section className="bg-white dark:bg-darkCard p-6 rounded-[2.5rem] border border-slate-200 dark:border-darkBorder shadow-sm overflow-hidden relative group">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          {data.sentimentColor === 'rose' ? <TrendingDown size={120} /> : <TrendingUp size={120} />}
        </div>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center space-x-4">
            <div className={`w-16 h-16 rounded-3xl flex items-center justify-center shadow-lg ${
              data.sentimentColor === 'rose' ? 'bg-rose-500 text-white shadow-rose-200' : 
              data.sentimentColor === 'emerald' ? 'bg-emerald-500 text-white shadow-emerald-200' : 
              'bg-slate-500 text-white shadow-slate-200'
            }`}>
              {data.sentimentColor === 'rose' ? <TrendingDown size={32} /> : <TrendingUp size={32} />}
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Análise Estratégica</p>
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
              className="p-4 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 transition-all disabled:opacity-50 group/btn shadow-lg shadow-emerald-200 dark:shadow-none"
              title="Gerar Visão do Futuro"
            >
              {isGeneratingImage ? <Loader2 size={20} className="animate-spin" /> : <Sparkles size={20} className="group-hover/btn:rotate-12 transition-transform" />}
            </button>
            <button 
              onClick={() => runAnalysis()} 
              className="p-4 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 dark:shadow-none"
              title="Atualizar Análise"
            >
              <RefreshCcw size={20} />
            </button>
          </div>
        </div>

        {generatedImage && (
          <div className="mt-8 rounded-[2rem] overflow-hidden border-4 border-indigo-500/20 shadow-2xl animate-in zoom-in-95 duration-500">
            <img src={generatedImage} alt="Visão de Riqueza" className="w-full h-auto object-cover max-h-[400px]" />
          </div>
        )}

        <div className="mt-8 flex flex-wrap gap-2">
          {data.drivers.map((driver, idx) => (
            <span key={idx} className="px-3 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-darkBorder rounded-xl text-[10px] font-black uppercase text-slate-500 dark:text-slate-400">
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
    </div>
  );
};

export default MarketIntelligence;

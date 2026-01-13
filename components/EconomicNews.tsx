
import React, { useState, useEffect } from 'react';
import { Globe, Zap, Clock, ExternalLink, Newspaper, Info } from 'lucide-react';

interface NewsItem {
  id: string;
  headline: string;
  summary: string;
  relevance: 'low' | 'medium' | 'high';
  source: string;
  time: string;
  link: string;
}

interface EconomicNewsProps {
  onNewsLoaded?: (headlines: string[]) => void;
}

const FALLBACK_NEWS: NewsItem[] = [
  {
    id: 'f1',
    headline: 'FED sinaliza manutenção de taxas de juros frente à inflação resiliente',
    summary: 'Membros do Federal Reserve indicam que a trajetória de queda da inflação estagnou, sugerindo juros altos por mais tempo.',
    relevance: 'high',
    source: 'Financial Times (Simulado)',
    time: '5m atrás',
    link: '#'
  },
  {
    id: 'f2',
    headline: 'PIB da China cresce acima do esperado no primeiro trimestre',
    summary: 'A segunda maior economia do mundo mostra sinais de recuperação industrial, impulsionando commodities globais.',
    relevance: 'medium',
    source: 'Bloomberg (Simulado)',
    time: '15m atrás',
    link: '#'
  },
  {
    id: 'f3',
    headline: 'BC do Brasil monitora volatilidade cambial e não descarta intervenções',
    summary: 'O Banco Central reforça o compromisso com a meta de inflação em meio à pressão do dólar sobre o Real.',
    relevance: 'high',
    source: 'Valor Econômico (Simulado)',
    time: '30m atrás',
    link: '#'
  },
  {
    id: 'f4',
    headline: 'Conflitos no Oriente Médio elevam preços do Petróleo Brent',
    summary: 'Tensões geopolíticas continuam a pressionar os custos de energia, impactando cadeias de suprimentos globais.',
    relevance: 'medium',
    source: 'Reuters (Simulado)',
    time: '1h atrás',
    link: '#'
  }
];

const EconomicNews: React.FC<EconomicNewsProps> = ({ onNewsLoaded }) => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFallback, setIsFallback] = useState(false);

  const fetchNews = async () => {
    try {
      const response = await fetch('https://ok.surf/api/v1/news-feed', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        }
      });
      
      if (!response.ok) throw new Error('Network response was not ok');
      
      const data = await response.json();
      const rawNews = data.Business || data.World || [];
      
      if (rawNews.length === 0) throw new Error('No news found');

      const formattedNews: NewsItem[] = rawNews.slice(0, 8).map((item: any, idx: number) => {
        const text = (item.title + item.content).toLowerCase();
        let relevance: 'low' | 'medium' | 'high' = 'low';
        
        if (text.includes('fed') || text.includes('inflation') || text.includes('gdp') || text.includes('rates') || text.includes('war') || text.includes('juros')) {
          relevance = 'high';
        } else if (text.includes('earnings') || text.includes('stock') || text.includes('market') || text.includes('ações')) {
          relevance = 'medium';
        }

        return {
          id: idx.toString(),
          headline: item.title,
          summary: item.content || "Clique para ver o resumo completo desta movimentação de mercado.",
          relevance,
          source: item.source || "Global Finance",
          time: "Agora",
          link: item.link
        };
      });

      setNews(formattedNews);
      setIsFallback(false);
      if (onNewsLoaded) onNewsLoaded(formattedNews.map(n => n.headline));
    } catch (error) {
      console.warn('Usando notícias de contingência devido a erro na API:', error);
      setNews(FALLBACK_NEWS);
      setIsFallback(true);
      if (onNewsLoaded) onNewsLoaded(FALLBACK_NEWS.map(n => n.headline));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
    const interval = setInterval(fetchNews, 300000);
    return () => clearInterval(interval);
  }, []);

  const getRelevanceBadge = (level: string) => {
    switch (level) {
      case 'high': return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border-rose-200 dark:border-rose-800';
      case 'medium': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800';
      default: return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800';
    }
  };

  return (
    <section className="bg-white dark:bg-darkCard rounded-[2.5rem] border border-slate-200 dark:border-darkBorder shadow-sm overflow-hidden flex flex-col h-full transition-all">
      <div className="p-6 border-b border-slate-100 dark:border-darkBorder flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center">
            <Globe className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-slate-200">Notícias Globais</h3>
            <div className="flex items-center space-x-2 mt-0.5">
              <span className={`w-1.5 h-1.5 rounded-full ${isFallback ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse'}`}></span>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                {isFallback ? 'Modo de Contingência' : 'Live Feed'}
              </span>
            </div>
          </div>
        </div>
        <Newspaper className="w-5 h-5 text-slate-300 dark:text-slate-600" />
      </div>

      <div className="flex-1 overflow-y-auto max-h-[600px] scrollbar-hide">
        {loading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="animate-pulse flex flex-col space-y-2">
                <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-3/4"></div>
                <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-full"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-darkBorder">
            {news.map((item) => (
              <a 
                key={item.id} 
                href={item.link} 
                target={item.link === '#' ? '_self' : '_blank'} 
                rel="noopener noreferrer"
                className="block p-6 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group"
              >
                <div className="flex items-start justify-between mb-2">
                  <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase border ${getRelevanceBadge(item.relevance)}`}>
                    {item.relevance}
                  </span>
                  <div className="flex items-center space-x-1 text-[10px] text-slate-400 font-medium">
                    <Clock size={10} />
                    <span>{item.time}</span>
                  </div>
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-2 leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">
                  {item.headline}
                </h4>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] font-black text-indigo-600/60 dark:text-indigo-400/60 uppercase tracking-widest italic truncate max-w-[150px]">
                    {item.source}
                  </span>
                  <ExternalLink size={12} className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
      
      {isFallback && (
        <div className="p-3 bg-amber-50 dark:bg-amber-900/10 border-t border-amber-100 dark:border-amber-900/30 flex items-center space-x-2">
          <Info size={12} className="text-amber-500 shrink-0" />
          <p className="text-[9px] text-amber-600 dark:text-amber-400 font-bold uppercase tracking-tight leading-none">
            Utilizando notícias de backup devido a problemas de conexão com o feed global.
          </p>
        </div>
      )}
    </section>
  );
};

export default EconomicNews;

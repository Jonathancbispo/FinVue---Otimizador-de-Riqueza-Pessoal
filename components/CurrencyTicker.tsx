
import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, RefreshCw, DollarSign } from 'lucide-react';

interface CurrencyData {
  code: string;
  bid: string;
  pctChange: string;
  create_date: string;
}

const CurrencyTicker: React.FC = () => {
  const [data, setData] = useState<CurrencyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<string>('');

  const fetchRate = async () => {
    try {
      const response = await fetch('https://economia.awesomeapi.com.br/last/USD-BRL');
      const json = await response.json();
      const usdData = json.USDBRL;
      setData(usdData);
      setLastUpdate(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
      setLoading(false);
    } catch (error) {
      console.error('Erro ao buscar câmbio:', error);
    }
  };

  useEffect(() => {
    fetchRate();
    const interval = setInterval(fetchRate, 60000); // Atualiza a cada 1 minuto
    return () => clearInterval(interval);
  }, []);

  if (loading || !data) {
    return (
      <div className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-800 animate-pulse px-3 py-1.5 rounded-full border border-slate-200 dark:border-darkBorder">
        <div className="w-3 h-3 bg-slate-300 dark:bg-slate-600 rounded-full"></div>
        <div className="w-16 h-3 bg-slate-300 dark:bg-slate-600 rounded-md"></div>
      </div>
    );
  }

  const isPositive = parseFloat(data.pctChange) >= 0;
  const price = parseFloat(data.bid).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

  return (
    <div className="flex items-center group cursor-help" title={`Última atualização: ${lastUpdate}`}>
      <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-full border shadow-sm transition-all duration-300 hover:shadow-md ${
        isPositive 
          ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400' 
          : 'bg-rose-50 dark:bg-rose-900/20 border-rose-100 dark:border-rose-800 text-rose-700 dark:text-rose-400'
      }`}>
        <div className="flex items-center space-x-1">
          <DollarSign className="w-3 h-3 opacity-70" />
          <span className="text-xs font-black tracking-tight">{price}</span>
        </div>
        
        <div className="flex items-center space-x-1 border-l border-current/20 pl-2">
          {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          <span className="text-[10px] font-bold">
            {isPositive ? '+' : ''}{data.pctChange}%
          </span>
        </div>
        
        <RefreshCw className="w-2.5 h-2.5 opacity-30 group-hover:animate-spin transition-opacity" />
      </div>
    </div>
  );
};

export default CurrencyTicker;


import React from 'react';

interface SummaryCardProps {
  title: string;
  value: number;
  type?: 'neutral' | 'positive' | 'negative' | 'income' | 'expense';
  subtitle?: string;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ title, value, type = 'neutral', subtitle }) => {
  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(num);
  };

  const getColors = () => {
    switch (type) {
      case 'positive': return 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-900/30';
      case 'negative': return 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 border-rose-100 dark:border-rose-900/30';
      case 'income': return 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 border-indigo-100 dark:border-indigo-900/30';
      case 'expense': return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-900/30';
      default: return 'text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-darkBorder';
    }
  };

  const getValueColor = () => {
    if (type === 'positive') return 'text-emerald-600 dark:text-emerald-400';
    if (type === 'negative') return 'text-rose-600 dark:text-rose-400';
    if (type === 'income') return 'text-indigo-700 dark:text-indigo-300';
    if (type === 'expense') return 'text-amber-700 dark:text-amber-300';
    return 'text-slate-900 dark:text-slate-100';
  };

  return (
    <div className={`p-5 rounded-2xl border transition-all hover:shadow-md ${getColors()}`}>
      <h3 className="text-xs font-bold uppercase tracking-wider opacity-70 mb-1">{title}</h3>
      <div className={`text-2xl font-bold ${getValueColor()}`}>
        {formatCurrency(value)}
      </div>
      {subtitle && <p className="text-[10px] mt-1 font-medium uppercase opacity-50">{subtitle}</p>}
    </div>
  );
};

export default SummaryCard;


import React from 'react';

interface SummaryCardProps {
  title: string;
  value: number;
  type?: 'neutral' | 'positive' | 'negative' | 'income' | 'expense' | 'balance';
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
      case 'positive': 
      case 'income': return 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-800/30';
      case 'negative':
      case 'expense': return 'bg-rose-50 dark:bg-rose-900/10 border-rose-100 dark:border-rose-800/30';
      case 'balance': return 'bg-indigo-50 dark:bg-indigo-900/10 border-indigo-100 dark:border-indigo-800/30';
      default: return 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-darkBorder';
    }
  };

  const getLabelColor = () => {
    switch (type) {
      case 'positive': 
      case 'income': return 'text-emerald-600 dark:text-emerald-400';
      case 'negative':
      case 'expense': return 'text-rose-600 dark:text-rose-400';
      case 'balance': return 'text-indigo-600 dark:text-indigo-400';
      default: return 'text-slate-500 dark:text-slate-400';
    }
  };

  const getValueColor = () => {
    switch (type) {
      case 'positive': 
      case 'income': return 'text-emerald-700 dark:text-emerald-300';
      case 'negative':
      case 'expense': return 'text-rose-700 dark:text-rose-300';
      case 'balance': return 'text-indigo-700 dark:text-indigo-300';
      default: return 'text-slate-900 dark:text-slate-100';
    }
  };

  return (
    <div className={`p-5 rounded-3xl border transition-all hover:shadow-lg hover:-translate-y-1 duration-300 ${getColors()}`}>
      <h3 className={`text-[10px] font-black uppercase tracking-[0.15em] mb-1.5 ${getLabelColor()}`}>{title}</h3>
      <div className={`text-2xl font-black tracking-tight ${getValueColor()}`}>
        {formatCurrency(value)}
      </div>
      {subtitle && <p className="text-[9px] mt-1.5 font-bold uppercase tracking-tighter opacity-40 text-slate-500 dark:text-slate-400">{subtitle}</p>}
    </div>
  );
};

export default SummaryCard;

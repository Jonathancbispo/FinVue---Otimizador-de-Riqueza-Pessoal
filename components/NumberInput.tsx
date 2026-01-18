
import React from 'react';
import { Info } from 'lucide-react';

interface NumberInputProps {
  label: string;
  value: number;
  onChange: (val: number) => void;
  placeholder?: string;
  icon?: React.ReactNode;
  tooltip?: string;
}

const NumberInput: React.FC<NumberInputProps> = ({ label, value, onChange, placeholder, icon, tooltip }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    onChange(isNaN(val) ? 0 : Math.max(0, val));
  };

  return (
    <div className="flex flex-col space-y-1.5 w-full">
      <div className="flex items-center space-x-1.5 ml-1">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>
        {tooltip && (
          <div className="group relative flex items-center">
            <Info size={14} className="text-slate-400 dark:text-slate-500 cursor-help hover:text-indigo-500 transition-colors" />
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2.5 bg-slate-900 dark:bg-slate-800 text-white text-[10px] font-medium rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none z-50 shadow-xl border border-white/10 text-center leading-relaxed">
              {tooltip}
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900 dark:border-t-slate-800"></div>
            </div>
          </div>
        )}
      </div>
      <div className="relative group">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 group-focus-within:text-indigo-500 dark:group-focus-within:text-indigo-400 transition-colors">
            {icon}
          </div>
        )}
        <input
          type="number"
          value={value === 0 ? '' : value}
          onChange={handleChange}
          placeholder={placeholder || '0.00'}
          className={`w-full bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-darkBorder rounded-xl py-2.5 ${icon ? 'pl-10' : 'pl-4'} pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all text-slate-900 dark:text-slate-100 font-medium placeholder:text-slate-300 dark:placeholder:text-slate-600 shadow-sm`}
        />
      </div>
    </div>
  );
};

export default NumberInput;

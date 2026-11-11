import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Info } from 'lucide-react';

interface DetailToggleProps {
  children: React.ReactNode;
  defaultOpen?: boolean;
  label?: string;
  variant?: 'light' | 'dark';
  className?: string;
  buttonClassName?: string;
}

export const DetailToggle: React.FC<DetailToggleProps> = ({
  children,
  defaultOpen = false,
  label = 'Detail',
  variant = 'light',
  className = '',
  buttonClassName = ''
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const defaultBtnClass =
    variant === 'dark'
      ? 'bg-white/10 hover:bg-white/20 text-slate-200 border-white/20 hover:border-white/40'
      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200 hover:border-slate-300';

  return (
    <div className={`my-1.5 ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-0.5 rounded-lg border shadow-xs transition active:scale-95 cursor-pointer select-none ${
          buttonClassName || defaultBtnClass
        }`}
        title={isOpen ? 'Sembunyikan keterangan' : 'Klik untuk melihat keterangan detail'}
      >
        <Info size={11} className={isOpen ? (variant === 'dark' ? 'text-amber-300' : 'text-blue-600') : 'opacity-70'} />
        <span>{label}</span>
        {isOpen ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
      </button>

      {isOpen && (
        <div className="mt-2 animate-in fade-in slide-in-from-top-1 duration-150">
          {children}
        </div>
      )}
    </div>
  );
};

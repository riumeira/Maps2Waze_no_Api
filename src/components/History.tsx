import React from 'react';
import { LocationItem } from '../types';
import { Clock, Navigation, ExternalLink } from 'lucide-react';

interface HistoryProps {
  history: LocationItem[];
  onClear: () => void;
}

export function History({ history, onClear }: HistoryProps) {
  if (history.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        <Clock className="w-12 h-12 mx-auto mb-3 opacity-20" />
        <p className="text-xs uppercase tracking-widest font-bold">Sem histórico recente</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 flex flex-col flex-1 shadow-xl">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Recentes</h3>
        <button
          onClick={onClear}
          className="text-[10px] font-bold tracking-widest uppercase text-slate-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
        >
          Limpar
        </button>
      </div>
      
      <div className="flex flex-col gap-2">
        {history.map((item) => (
          <div key={item.id} className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between group hover:border-cyan-200 dark:hover:border-cyan-900 transition-colors">
            <div className="flex-1 min-w-0 pr-4">
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                {item.title || `${item.lat.toFixed(4)}, ${item.lng.toFixed(4)}`}
              </p>
              <p className="text-[10px] text-slate-500 font-mono mt-1">
                {new Date(item.timestamp).toLocaleString()} • {item.lat.toFixed(4)}, {item.lng.toFixed(4)}
              </p>
            </div>
            
            <a
              href={item.wazeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 dark:text-slate-600 group-hover:text-cyan-600 dark:group-hover:text-cyan-500 transition-colors p-2"
              title="Abrir no Waze"
            >
              <Navigation className="w-5 h-5" />
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}

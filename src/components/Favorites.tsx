import React from 'react';
import { LocationItem } from '../types';
import { Star, Navigation, Trash2 } from 'lucide-react';

interface FavoritesProps {
  favorites: LocationItem[];
  onRemove: (id: string) => void;
}

export function Favorites({ favorites, onRemove }: FavoritesProps) {
  if (favorites.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        <Star className="w-12 h-12 mx-auto mb-3 opacity-20" />
        <p className="text-xs uppercase tracking-widest font-bold">Nenhum destino guardado</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 flex flex-col shadow-xl">
      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Destinos guardados (Offline)</h3>
      
      <div className="flex flex-col gap-3">
        {favorites.map((item) => (
          <div key={item.id} className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between group hover:border-cyan-300 dark:hover:border-cyan-500 transition-colors">
            <div className="flex-1 min-w-0 pr-4">
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate uppercase">
                {item.title || `${item.lat.toFixed(4)}, ${item.lng.toFixed(4)}`}
              </p>
              <p className="text-[10px] text-slate-500 font-mono mt-1 truncate">
                GUARDADO A {new Date(item.timestamp).toLocaleDateString()}
              </p>
            </div>
            
            <div className="flex items-center gap-1">
              <button
                onClick={() => onRemove(item.id)}
                className="text-slate-400 dark:text-slate-600 hover:text-red-600 dark:hover:text-red-500 transition-colors p-2"
                title="Remover"
              >
                <Trash2 className="w-5 h-5" />
              </button>
              <a
                href={item.wazeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-600 dark:text-cyan-500 hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors p-2"
                title="Abrir no Waze"
              >
                <Navigation className="w-5 h-5" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

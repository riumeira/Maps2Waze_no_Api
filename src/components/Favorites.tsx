import React, { useState, useMemo } from 'react';
import { LocationItem } from '../types';
import { Star, Navigation, Trash2, ArrowUpDown, Share2 } from 'lucide-react';
import { useLanguage } from '../utils/i18n';

interface FavoritesProps {
  favorites: LocationItem[];
  onRemove: (id: string) => void;
  onSelectLocation?: (item: LocationItem) => void;
}

type SortOption = 'date-desc' | 'date-asc' | 'name-asc' | 'name-desc';

export function Favorites({ favorites, onRemove, onSelectLocation }: FavoritesProps) {
  const { t } = useLanguage();
  const [sortBy, setSortBy] = useState<SortOption>('date-desc');

  const sortedFavorites = useMemo(() => {
    return [...favorites].sort((a, b) => {
      if (sortBy === 'date-desc') {
        return b.timestamp - a.timestamp;
      }
      if (sortBy === 'date-asc') {
        return a.timestamp - b.timestamp;
      }
      const titleA = (a.title || (a.lat && a.lng ? `${a.lat.toFixed(4)}, ${a.lng.toFixed(4)}` : 'Morada')).toLowerCase();
      const titleB = (b.title || (b.lat && b.lng ? `${b.lat.toFixed(4)}, ${b.lng.toFixed(4)}` : 'Morada')).toLowerCase();
      if (sortBy === 'name-asc') {
        return titleA.localeCompare(titleB);
      }
      if (sortBy === 'name-desc') {
        return titleB.localeCompare(titleA);
      }
      return 0;
    });
  }, [favorites, sortBy]);

  const handleShare = async (e: React.MouseEvent, item: LocationItem) => {
    e.stopPropagation();
    const shareData = {
      title: item.title || 'Waze',
      text: `Navegar para ${item.title || 'Waze'}`,
      url: item.wazeUrl,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        // User cancelled
      }
    } else {
      try {
        await navigator.clipboard.writeText(item.wazeUrl);
        alert(t('linkCopied'));
      } catch (err) {
        console.error(err);
      }
    }
  };

  if (favorites.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        <Star className="w-12 h-12 mx-auto mb-3 opacity-20" />
        <p className="text-xs uppercase tracking-widest font-bold">{t('emptyFavorites')}</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 flex flex-col shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">
          {t('myFavorites')} ({favorites.length})
        </h3>
        
        <div className="flex items-center gap-2">
          <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium rounded-xl px-3 py-1.5 focus:outline-none focus:border-cyan-500 transition-colors cursor-pointer"
          >
            <option value="date-desc">{t('sortByDate')} (↓)</option>
            <option value="date-asc">{t('sortByDate')} (↑)</option>
            <option value="name-asc">{t('sortByName')} (A - Z)</option>
            <option value="name-desc">{t('sortByName')} (Z - A)</option>
          </select>
        </div>
      </div>
      
      <div className="flex flex-col gap-3">
        {sortedFavorites.map((item) => (
          <div key={item.id} className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between group hover:border-cyan-300 dark:hover:border-cyan-500 transition-colors">
            <div 
              onClick={() => onSelectLocation?.(item)}
              className="flex-1 min-w-0 pr-4 cursor-pointer hover:opacity-90"
              title={t('viewFullAddress')}
            >
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate uppercase hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">
                {item.title || (item.lat && item.lng ? `${item.lat.toFixed(4)}, ${item.lng.toFixed(4)}` : 'Morada')}
              </p>
              <p className="text-[10px] text-slate-500 font-mono mt-1 truncate uppercase">
                {new Date(item.timestamp).toLocaleDateString()}
              </p>
            </div>
            
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => handleShare(e, item)}
                className="text-slate-400 dark:text-slate-600 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors p-2"
                title={t('share')}
              >
                <Share2 className="w-5 h-5" />
              </button>
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
                title={t('openWaze')}
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

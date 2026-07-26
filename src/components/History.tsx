import React from 'react';
import { LocationItem } from '../types';
import { Clock, Navigation, Star, Trash2, Share2 } from 'lucide-react';
import { useLanguage } from '../utils/i18n';

interface HistoryProps {
  history: LocationItem[];
  favorites?: LocationItem[];
  onClear: () => void;
  onRemoveItem?: (id: string) => void;
  onAddFavorite?: (item: LocationItem) => void;
  onRemoveFavorite?: (id: string) => void;
  onSelectLocation?: (item: LocationItem) => void;
}

export function History({ history, favorites = [], onClear, onRemoveItem, onAddFavorite, onRemoveFavorite, onSelectLocation }: HistoryProps) {
  const { t } = useLanguage();

  if (history.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        <Clock className="w-12 h-12 mx-auto mb-3 opacity-20" />
        <p className="text-xs uppercase tracking-widest font-bold">{t('emptyHistory')}</p>
      </div>
    );
  }

  const isFavorite = (item: LocationItem) => {
    return favorites.some(
      (f) => f.id === item.id || (f.lat === item.lat && f.lng === item.lng && f.title === item.title)
    );
  };

  const getFavoriteId = (item: LocationItem) => {
    const found = favorites.find(
      (f) => f.id === item.id || (f.lat === item.lat && f.lng === item.lng && f.title === item.title)
    );
    return found ? found.id : item.id;
  };

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

  return (
    <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 flex flex-col flex-1 shadow-xl">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t('recentHistory')}</h3>
        <button
          onClick={onClear}
          className="text-[10px] font-bold tracking-widest uppercase text-slate-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
        >
          {t('clearHistory')}
        </button>
      </div>
      
      <div className="flex flex-col gap-2">
        {history.map((item) => {
          const fav = isFavorite(item);
          const favId = getFavoriteId(item);

          return (
            <div key={item.id} className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between group hover:border-cyan-200 dark:hover:border-cyan-900 transition-colors">
              <div 
                onClick={() => onSelectLocation?.(item)}
                className="flex-1 min-w-0 pr-4 cursor-pointer group-hover/item:opacity-90"
                title={t('viewFullAddress')}
              >
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">
                  {item.title || (item.lat && item.lng ? `${item.lat.toFixed(4)}, ${item.lng.toFixed(4)}` : 'Morada')}
                </p>
                <p className="text-[10px] text-slate-500 font-mono mt-1 flex items-center gap-1">
                  <span>{new Date(item.timestamp).toLocaleString()}</span>
                  <span>•</span>
                  <span>{item.lat && item.lng ? `${item.lat.toFixed(4)}, ${item.lng.toFixed(4)}` : 'Por Morada'}</span>
                </p>
              </div>
              
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    if (fav) {
                      onRemoveFavorite?.(favId);
                    } else {
                      onAddFavorite?.(item);
                    }
                  }}
                  className={`p-2 rounded-lg transition-colors ${
                    fav
                      ? 'text-amber-500 hover:text-amber-600 dark:hover:text-amber-400'
                      : 'text-slate-400 dark:text-slate-600 hover:text-amber-500 dark:hover:text-amber-400'
                  }`}
                  title={fav ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                >
                  <Star className={`w-5 h-5 ${fav ? 'fill-amber-500' : ''}`} />
                </button>
                <button
                  onClick={(e) => handleShare(e, item)}
                  className="text-slate-400 dark:text-slate-600 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors p-2"
                  title={t('share')}
                >
                  <Share2 className="w-5 h-5" />
                </button>
                <a
                  href={item.wazeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-400 dark:text-slate-600 hover:text-cyan-600 dark:hover:text-cyan-500 transition-colors p-2"
                  title={t('openWaze')}
                >
                  <Navigation className="w-5 h-5" />
                </a>
                <button
                  onClick={() => onRemoveItem?.(item.id)}
                  className="text-slate-400 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 transition-colors p-2"
                  title="Remover do histórico"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

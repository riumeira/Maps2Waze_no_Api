import React from 'react';
import { Link, MapPin, Star, Clock, Share2, Compass } from 'lucide-react';
import { useLanguage } from '../utils/i18n';

export function Help() {
  const { t } = useLanguage();

  return (
    <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 flex flex-col shadow-xl space-y-4">
      <div className="text-center mb-2 flex flex-col items-center">
        <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 mb-2 tracking-wider">
          Beta v1.0.0
        </span>
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t('helpTitle')}</h3>
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-1">
          {t('helpSubtitle')}
        </p>
      </div>

      {/* Item 1: Converter Links */}
      <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-start gap-3">
        <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 shrink-0 mt-0.5">
          <Link className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-1">
            {t('help1Title')}
          </h4>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            {t('help1Desc')}
          </p>
        </div>
      </div>

      {/* Item 2: Morada Completa */}
      <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-start gap-3">
        <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5">
          <MapPin className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-1">
            {t('help2Title')}
          </h4>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            {t('help2Desc')}
          </p>
        </div>
      </div>

      {/* Item 3: Partilhar Rota */}
      <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-start gap-3">
        <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
          <Share2 className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-1">
            {t('help3Title')}
          </h4>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            {t('help3Desc')}
          </p>
        </div>
      </div>

      {/* Item 4: Favoritos */}
      <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-start gap-3">
        <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
          <Star className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-1">
            {t('help4Title')}
          </h4>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            {t('help4Desc')}
          </p>
        </div>
      </div>

      {/* Item 5: Histórico */}
      <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-start gap-3">
        <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5">
          <Clock className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-1">
            {t('help5Title')}
          </h4>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            {t('help5Desc')}
          </p>
        </div>
      </div>

      {/* Item 6: A minha localização */}
      <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-start gap-3">
        <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5">
          <Compass className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-1">
            {t('help6Title')}
          </h4>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            {t('help6Desc')}
          </p>
        </div>
      </div>
    </div>
  );
}

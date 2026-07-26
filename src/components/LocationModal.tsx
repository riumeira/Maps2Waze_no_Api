import React, { useState, useEffect } from 'react';
import { LocationItem } from '../types';
import { MapPin, X, Navigation, Copy, Check, Star, Building2, Share2, ExternalLink } from 'lucide-react';
import { useLanguage } from '../utils/i18n';

interface LocationModalProps {
  item: LocationItem | null;
  onClose: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}

interface ExtraDetails {
  fullAddress?: string;
  road?: string;
  houseNumber?: string;
  postcode?: string;
  city?: string;
  loading: boolean;
}

export function LocationModal({ item, onClose, isFavorite = false, onToggleFavorite }: LocationModalProps) {
  const { t } = useLanguage();
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [extraDetails, setExtraDetails] = useState<ExtraDetails>({ loading: false });

  useEffect(() => {
    if (!item) return;

    // Check if we already have full details from the item
    if (item.fullAddress || item.road) {
      setExtraDetails({
        fullAddress: item.fullAddress,
        road: item.road,
        houseNumber: item.houseNumber,
        postcode: item.postcode,
        city: item.city,
        loading: false,
      });
      return;
    }

    // Otherwise fetch details live from Nominatim if coordinates exist
    if (!item.lat || !item.lng) {
      setExtraDetails({
        fullAddress: item.fullAddress || item.title,
        loading: false,
      });
      return;
    }

    let isMounted = true;
    setExtraDetails({ loading: true });

    async function fetchAddressDetails() {
      try {
        const url = `https://nominatim.openstreetmap.org/reverse?lat=${item!.lat}&lon=${item!.lng}&format=json&accept-language=pt`;
        const res = await fetch(url, {
          headers: { 'User-Agent': 'Maps2WazeConverter/1.0' },
        });
        if (res.ok && isMounted) {
          const data = await res.json();
          const addr = data.address || {};
          const road = addr.road || addr.pedestrian || addr.footway || addr.path;
          const houseNumber = addr.house_number || addr.house_name;
          const postcode = addr.postcode;
          const city = addr.city || addr.town || addr.village || addr.municipality || addr.suburb || addr.county;

          setExtraDetails({
            fullAddress: data.display_name,
            road,
            houseNumber,
            postcode,
            city,
            loading: false,
          });
        } else if (isMounted) {
          setExtraDetails({ loading: false });
        }
      } catch (err) {
        if (isMounted) {
          setExtraDetails({ loading: false });
        }
      }
    }

    fetchAddressDetails();

    return () => {
      isMounted = false;
    };
  }, [item]);

  if (!item) return null;

  const copyToClipboard = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleShare = async () => {
    if (!item) return;
    const shareData = {
      title: item.title,
      text: `Navegar para ${item.title}${formattedFullAddress ? ': ' + formattedFullAddress : ''}`,
      url: item.wazeUrl,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        // User cancelled
      }
    } else {
      copyToClipboard(item.wazeUrl, 'share');
    }
  };

  const formattedRoad = extraDetails.road || item.road;
  const formattedHouseNumber = extraDetails.houseNumber || item.houseNumber;
  const formattedPostcode = extraDetails.postcode || item.postcode;
  const formattedCity = extraDetails.city || item.city;
  const formattedFullAddress = extraDetails.fullAddress || item.fullAddress || item.title;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 pb-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-950/50">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-widest">
                {t('addressDetails')}
              </h3>
              <p className="text-base font-bold text-slate-800 dark:text-slate-100 truncate">
                {item.title}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onToggleFavorite && (
              <button
                onClick={onToggleFavorite}
                className={`p-2.5 rounded-xl transition-colors ${
                  isFavorite
                    ? 'text-amber-500 bg-amber-500/10 border border-amber-500/20'
                    : 'text-slate-400 hover:text-amber-500 bg-slate-100 dark:bg-slate-800'
                }`}
                title={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
              >
                <Star className={`w-4 h-4 ${isFavorite ? 'fill-amber-500' : ''}`} />
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 transition-colors"
              title={t('close')}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar">
          {extraDetails.loading ? (
            <div className="py-8 flex flex-col items-center justify-center gap-3 text-slate-400">
              <div className="w-6 h-6 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
              <p className="text-xs font-medium uppercase tracking-wider">{t('loadingAddress')}</p>
            </div>
          ) : (
            <>
              {/* Morada Completa Card */}
              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 relative group">
                <div className="flex justify-between items-start gap-2 mb-1.5">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-cyan-500" />
                    {t('fullAddressLabel')}
                  </span>
                  {formattedFullAddress && (
                    <button
                      onClick={() => copyToClipboard(formattedFullAddress, 'full')}
                      className="text-xs text-slate-400 hover:text-cyan-500 flex items-center gap-1 transition-colors"
                      title={t('copy')}
                    >
                      {copiedField === 'full' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span className="text-[10px] uppercase font-bold">
                        {copiedField === 'full' ? t('copied') : t('copy')}
                      </span>
                    </button>
                  )}
                </div>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200 leading-relaxed">
                  {formattedFullAddress || '—'}
                </p>
              </div>

              {/* Grid of structured details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Rua / Avenida */}
                <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    {t('street')}
                  </span>
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {formattedRoad || '—'}
                  </p>
                </div>

                {/* Número da Porta */}
                <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    {t('houseNumber')}
                  </span>
                  <p className="text-xs font-semibold text-cyan-600 dark:text-cyan-400">
                    {formattedHouseNumber ? `Nº ${formattedHouseNumber}` : '—'}
                  </p>
                </div>

                {/* Código Postal */}
                <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    {t('postcode')}
                  </span>
                  <p className="text-xs font-mono font-semibold text-slate-700 dark:text-slate-300">
                    {formattedPostcode || '—'}
                  </p>
                </div>

                {/* Cidade / Localidade */}
                <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    {t('city')}
                  </span>
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {formattedCity || '—'}
                  </p>
                </div>
              </div>

              {/* Coordenadas GPS ou Tipo de Navegação */}
              {item.lat && item.lng ? (
                <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                      {t('gpsCoords')}
                    </span>
                    <p className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                      {item.lat.toFixed(6)}, {item.lng.toFixed(6)}
                    </p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(`${item.lat}, ${item.lng}`, 'coords')}
                    className="p-2 text-slate-400 hover:text-cyan-500 transition-colors"
                    title={t('copy')}
                  >
                    {copiedField === 'coords' ? (
                      <Check className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              ) : (
                <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                      Tipo de Navegação
                    </span>
                    <p className="text-xs font-bold text-amber-600 dark:text-amber-400">
                      Navegação por Morada / Pesquisa Waze
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 pt-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex flex-col sm:flex-row gap-2.5">
          <a
            href={item.wazeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-4 rounded-2xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors shadow-lg shadow-cyan-900/20"
          >
            <Navigation className="w-4 h-4" />
            {t('openWaze')}
          </a>

          <button
            onClick={handleShare}
            className="px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors shadow-lg shadow-emerald-900/20"
          >
            {copiedField === 'share' ? (
              <Check className="w-4 h-4 text-white" />
            ) : (
              <Share2 className="w-4 h-4 text-white" />
            )}
            <span>{copiedField === 'share' ? t('copied') : t('share')}</span>
          </button>

          {item.originalUrl && (
            <a
              href={item.originalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-2xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Maps
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

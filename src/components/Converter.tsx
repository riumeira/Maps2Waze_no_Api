import React, { useState } from 'react';
import { Copy, Navigation, Search, MapPin, Info, Share2, Check } from 'lucide-react';
import { LocationItem } from '../types';
import { useLanguage } from '../utils/i18n';

interface ConverterProps {
  onConvert: (item: Omit<LocationItem, 'id' | 'timestamp'>) => void;
  loading: boolean;
  onSelectLocation?: (item: LocationItem) => void;
}

export function Converter({ onConvert, loading, onSelectLocation }: ConverterProps) {
  const { t } = useLanguage();
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState<Omit<LocationItem, 'id' | 'timestamp'> | null>(null);
  const [localLoading, setLocalLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const isLoading = loading || localLoading;

  const handleConvert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    setError('');
    setResult(null);
    setLocalLoading(true);

    try {
      // Helper function to extract coordinates from Google Maps URLs (with high precision !3d/!4d matching first)
      const extractCoordinates = (urlStr: string): { lat: number; lng: number } | null => {
        if (!urlStr) return null;
        try {
          let decoded = urlStr;
          try {
            decoded = decodeURIComponent(urlStr);
          } catch {
            decoded = urlStr;
          }
          
          // 1. Check for high-precision !3d / !4d coordinates (actual pinned location)
          // E.g. !3d41.1468351!4d-8.6148317
          const internalRegex = /!3d(-?\d+\.\d+)[^!]*!4d(-?\d+\.\d+)/i;
          const internalMatch = decoded.match(internalRegex);
          if (internalMatch) {
            const lat = parseFloat(internalMatch[1]);
            const lng = parseFloat(internalMatch[2]);
            if (!isNaN(lat) && !isNaN(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
              return { lat, lng };
            }
          }

          // 2. Check for !2d (lng) !3d (lat) coordinates (common in Google Maps embed/pb strings)
          const pbRegex = /!2d(-?\d+\.\d+)[^!]*!3d(-?\d+\.\d+)/i;
          const pbMatch = decoded.match(pbRegex);
          if (pbMatch) {
            const lng = parseFloat(pbMatch[1]);
            const lat = parseFloat(pbMatch[2]);
            if (!isNaN(lat) && !isNaN(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
              return { lat, lng };
            }
          }

          // 3. Static map image or meta tags (og:image contains center=lat,lng or markers=lat,lng)
          const staticMapRegex = /(?:staticmap\?|center=|markers=|ll=)[^"'>]*(?:center|markers|ll|sll)=?(-?\d+\.\d+)(?:%2C|,)(-?\d+\.\d+)/i;
          const staticMapMatch = decoded.match(staticMapRegex);
          if (staticMapMatch) {
            const lat = parseFloat(staticMapMatch[1]);
            const lng = parseFloat(staticMapMatch[2]);
            if (!isNaN(lat) && !isNaN(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
              return { lat, lng };
            }
          }

          // 4. Directions coordinates in path (e.g. /dir/origin/destination)
          // Look for coordinates in the /dir/ path and prefer the last pair (destination)
          if (decoded.includes('/dir/')) {
            const allCoordsRegex = /(-?\d+\.\d+)[,%](-?\d+\.\d+)/g;
            let match;
            let lastCoords = null;
            while ((match = allCoordsRegex.exec(decoded)) !== null) {
              const lat = parseFloat(match[1]);
              const lng = parseFloat(match[2]);
              if (!isNaN(lat) && !isNaN(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
                lastCoords = { lat, lng };
              }
            }
            if (lastCoords) {
              return lastCoords;
            }
          }

          // 5. Standard coordinates in query or path (explicitly defined coordinates)
          // E.g. q=38.7436214,-9.1602037 or query=38.7436214,-9.1602037 or destination=38.7436214,-9.1602037
          const queryCoordsRegex = /(?:q=|query=|destination=|ll=|center=|sll=|search\/|place\/)(-?\d+\.\d+)[,%](-?\d+\.\d+)/i;
          const queryCoordsMatch = decoded.match(queryCoordsRegex);
          if (queryCoordsMatch) {
            const lat = parseFloat(queryCoordsMatch[1]);
            const lng = parseFloat(queryCoordsMatch[2]);
            if (!isNaN(lat) && !isNaN(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
              return { lat, lng };
            }
          }

          // 6. Fallback to @ camera coordinates (only if we didn't find !3d/!4d pinned ones first!)
          // E.g. @41.3409151,-8.7062402,17z
          const cameraRegex = /@(-?\d+\.\d+)[,%](-?\d+\.\d+)/i;
          const cameraMatch = decoded.match(cameraRegex);
          if (cameraMatch) {
            const lat = parseFloat(cameraMatch[1]);
            const lng = parseFloat(cameraMatch[2]);
            if (!isNaN(lat) && !isNaN(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
              return { lat, lng };
            }
          }

          // 7. Google Maps JS state arrays: [null,null,lat,lng] or [3,"...",[lat,lng]] or [1,[null,null,lat,lng]]
          const stateArrRegex = /(?:\[null,null,|\[3,"[^"]*",\[|\[1,\[null,null,)(-?\d+\.\d+),(-?\d+\.\d+)\]/i;
          const stateMatch = decoded.match(stateArrRegex);
          if (stateMatch) {
            const lat = parseFloat(stateMatch[1]);
            const lng = parseFloat(stateMatch[2]);
            if (!isNaN(lat) && !isNaN(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
              return { lat, lng };
            }
          }

          // 8. Any comma/percent separated float pair as a last resort (ONLY for short input strings)
          if (decoded.length < 500) {
            const simpleRegex = /(?:^|[^-\d])(-?\d+\.\d+)[,%](-?\d+\.\d+)(?:$|[^-\d])/;
            const simpleMatch = decoded.match(simpleRegex);
            if (simpleMatch) {
              const lat = parseFloat(simpleMatch[1]);
              const lng = parseFloat(simpleMatch[2]);
              if (!isNaN(lat) && !isNaN(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
                return { lat, lng };
              }
            }
          }
        } catch (e) {
          console.error("Error extracting coordinates:", e);
        }
        return null;
      };

      // 0. Handle direct text address input (non-URL)
      const isUrlInput = url.trim().toLowerCase().startsWith('http://') || url.trim().toLowerCase().startsWith('https://');
      
      if (!isUrlInput) {
        const addressQuery = url.trim();
        let dataAddress: any = null;
        try {
          const isForeign = /(?:españ|spain|españa|francia|france|italia|italy|germany|alemanha|uk|united kingdom|usa|estados unidos)/i.test(addressQuery);
          const urlsToTry: string[] = [];
          if (!isForeign) {
            urlsToTry.push(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(addressQuery)}&countrycodes=pt&format=json&limit=1`);
          }
          urlsToTry.push(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(addressQuery)}&format=json&limit=1`);

          for (const nomUrl of urlsToTry) {
            const nomRes = await fetch(nomUrl);
            if (nomRes.ok) {
              const nomData = await nomRes.json();
              if (Array.isArray(nomData) && nomData.length > 0) {
                const lat = parseFloat(nomData[0].lat);
                const lng = parseFloat(nomData[0].lon);
                if (!isNaN(lat) && !isNaN(lng)) {
                  dataAddress = {
                    lat,
                    lng,
                    title: nomData[0].display_name ? nomData[0].display_name.split(',')[0] : addressQuery,
                    fullAddress: nomData[0].display_name,
                    wazeUrl: `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`,
                  };
                  break;
                }
              }
            }
          }
        } catch (e) {
          // Ignore
        }

        if (!dataAddress) {
          dataAddress = {
            title: addressQuery,
            fullAddress: addressQuery,
            wazeUrl: `https://waze.com/ul?q=${encodeURIComponent(addressQuery)}&navigate=yes`,
            isAddressOnly: true,
          };
        }

        const newItem = {
          title: dataAddress.title,
          originalUrl: url,
          wazeUrl: dataAddress.wazeUrl,
          lat: dataAddress.lat,
          lng: dataAddress.lng,
          fullAddress: dataAddress.fullAddress,
          isAddressOnly: dataAddress.isAddressOnly,
        };

        setResult(newItem);
        onConvert(newItem);
        setLocalLoading(false);
        return;
      }

      // 1. Try to extract coordinates directly client-side first to avoid any network requests
      const directCoords = extractCoordinates(url);
      if (directCoords) {
        const wazeUrl = `https://waze.com/ul?ll=${directCoords.lat},${directCoords.lng}&navigate=yes`;
        
        const newItem = {
          title: 'Localização GPS',
          originalUrl: url,
          wazeUrl,
          lat: directCoords.lat,
          lng: directCoords.lng,
        };
        
        setResult(newItem);
        onConvert(newItem);
        setLocalLoading(false);
        return;
      }

      let data: any = null;
      let callBackendSuccessful = false;

      // 2. Try calling the backend conversion API
      try {
        const res = await fetch('/api/convert', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ url }),
        });

        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const json = await res.json();
          if (res.ok) {
            data = json;
            callBackendSuccessful = true;
          }
        }
      } catch (backendErr: any) {
        console.warn('Backend API call failed or unavailable, attempting client-side fallback:', backendErr);
      }

      // 3. Resilient client-side fallback (works perfectly on static platforms like Vercel)
      if (!callBackendSuccessful) {
        let resolvedUrl = url;
        let htmlContents = '';

        // If it's a shortened URL, try resolving it using multiple CORS proxies sequentially
        if (url.includes('goo.gl') || url.includes('maps.app') || url.includes('g.co')) {
          const proxies = [
            {
              url: `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
              type: 'allorigins'
            },
            {
              url: `https://corsproxy.io/?${encodeURIComponent(url)}`,
              type: 'corsproxy'
            },
            {
              url: `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
              type: 'raw'
            }
          ];

          for (const proxy of proxies) {
            try {
              const proxyRes = await fetch(proxy.url);
              if (proxyRes.ok) {
                let tempResolvedUrl = '';
                let tempHtmlContents = '';

                if (proxy.type === 'allorigins') {
                  const proxyData = await proxyRes.json();
                  if (proxyData) {
                    if (proxyData.status && proxyData.status.url) {
                      tempResolvedUrl = proxyData.status.url;
                    }
                    if (proxyData.contents) {
                      tempHtmlContents = proxyData.contents;
                    }
                  }
                } else {
                  tempHtmlContents = await proxyRes.text();
                }

                if (tempHtmlContents) {
                  const ogUrlMatch = tempHtmlContents.match(/<meta\s+property=["']og:url["']\s+content=["']([^"']+)["']/i);
                  if (ogUrlMatch) {
                    tempResolvedUrl = ogUrlMatch[1];
                  } else {
                    const canonicalMatch = tempHtmlContents.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i);
                    if (canonicalMatch) {
                      tempResolvedUrl = canonicalMatch[1];
                    }
                  }
                }

                if (tempResolvedUrl) {
                  resolvedUrl = tempResolvedUrl;
                }
                if (tempHtmlContents) {
                  htmlContents = tempHtmlContents;
                }

                const checkCoords = extractCoordinates(resolvedUrl) || (htmlContents ? extractCoordinates(htmlContents) : null);
                if (checkCoords) {
                  break;
                }
              }
            } catch (proxyErr) {
              console.warn(`CORS proxy resolution via ${proxy.type} failed:`, proxyErr);
            }
          }
        }

        // Try extracting coordinates from the resolved URL or HTML contents
        let resolvedCoords = extractCoordinates(resolvedUrl);
        if (!resolvedCoords && htmlContents) {
          resolvedCoords = extractCoordinates(htmlContents);
        }

        if (resolvedCoords) {
          let title = '';
          let fullAddress = '';
          let road = '';
          let houseNumber = '';
          let postcode = '';
          let city = '';

          try {
            const decoded = decodeURIComponent(resolvedUrl);
            const placeMatch = decoded.match(/\/maps\/place\/([^/@?]+)/i);
            const searchMatch = decoded.match(/(?:q=|search\/)([^&/?]+)/i);
            if (placeMatch && placeMatch[1]) {
              const raw = placeMatch[1].replace(/\+/g, ' ').trim();
              if (!/^-?\d+\.\d+[\s,%]+-?\d+\.\d+$/.test(raw)) {
                title = raw;
              }
            } else if (searchMatch && searchMatch[1]) {
              const raw = searchMatch[1].replace(/\+/g, ' ').trim();
              if (!/^-?\d+\.\d+[\s,%]+-?\d+\.\d+$/.test(raw)) {
                title = raw;
              }
            }
          } catch (e) {
            // Ignore
          }

          try {
            const revRes = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${resolvedCoords.lat}&lon=${resolvedCoords.lng}&format=json&accept-language=pt`);
            if (revRes.ok) {
              const revData = await revRes.json();
              const addr = revData.address || {};
              fullAddress = revData.display_name || '';
              road = addr.road || addr.pedestrian || addr.footway || '';
              houseNumber = addr.house_number || addr.house_name || '';
              postcode = addr.postcode || '';
              city = addr.city || addr.town || addr.village || addr.municipality || addr.suburb || addr.county || '';

              const storeName = addr.shop || addr.amenity || addr.building || addr.company || addr.tourism || addr.leisure || addr.office;
              if (!title) {
                if (storeName) {
                  title = storeName;
                } else if (road) {
                  const houseStr = houseNumber ? `, Nº ${houseNumber}` : '';
                  const cityStr = city ? `, ${city}` : '';
                  title = `${road}${houseStr}${cityStr}`;
                } else if (revData.display_name) {
                  title = revData.display_name.split(',').slice(0, 2).join(',').trim();
                }
              }
            }
          } catch (revErr) {
            console.error('Client-side reverse geocode error:', revErr);
          }

          data = {
            lat: resolvedCoords.lat,
            lng: resolvedCoords.lng,
            title: title || `${resolvedCoords.lat.toFixed(4)}, ${resolvedCoords.lng.toFixed(4)}`,
            fullAddress,
            road,
            houseNumber,
            postcode,
            city,
            wazeUrl: `https://waze.com/ul?ll=${resolvedCoords.lat},${resolvedCoords.lng}&navigate=yes`,
            finalUrl: resolvedUrl,
          };
        } else {
          // Extract address or place name fallback
          let searchQuery = '';
          if (htmlContents) {
            const ogTitleMatch = htmlContents.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i);
            if (ogTitleMatch && ogTitleMatch[1]) {
              const clean = ogTitleMatch[1].replace(/\s*-\s*Google Maps/i, '').trim();
              if (clean && !clean.toLowerCase().includes('google maps')) {
                searchQuery = clean;
              }
            }
          }

          if (!searchQuery) {
            try {
              const decoded = decodeURIComponent(resolvedUrl);
              const placeMatch = decoded.match(/\/maps\/place\/([^/@?]+)/i);
              const searchMatch = decoded.match(/(?:q=|query=|search\/)([^&/?]+)/i);
              if (placeMatch && placeMatch[1]) {
                searchQuery = placeMatch[1].replace(/\+/g, ' ').trim();
              } else if (searchMatch && searchMatch[1]) {
                searchQuery = searchMatch[1].replace(/\+/g, ' ').trim();
              }
            } catch (e) {
              console.error('Error parsing search query:', e);
            }
          }

          if (searchQuery) {
            const parts = searchQuery.split(',').map(s => s.trim()).filter(Boolean);
            const candidates: string[] = [
              searchQuery,
              searchQuery.toLowerCase().includes('portugal') ? null : `${searchQuery}, Portugal`,
            ].filter(Boolean) as string[];

            if (parts.length > 1) {
              const withoutPoi = parts.slice(1).join(', ');
              candidates.push(withoutPoi);
              if (!withoutPoi.toLowerCase().includes('portugal')) {
                candidates.push(`${withoutPoi}, Portugal`);
              }
            }

            if (parts.length > 2) {
              const streetAndCity = parts.slice(1, parts.length - 1).join(', ');
              candidates.push(streetAndCity);
              if (!streetAndCity.toLowerCase().includes('portugal')) {
                candidates.push(`${streetAndCity}, Portugal`);
              }
            }

            const cleanCandidates = Array.from(new Set(candidates));

            for (const q of cleanCandidates) {
              try {
                const isForeign = /(?:españ|spain|españa|francia|france|italia|italy|germany|alemanha|uk|united kingdom|usa|estados unidos)/i.test(q);
                const urlsToTry: string[] = [];
                if (!isForeign) {
                  urlsToTry.push(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&countrycodes=pt&format=json&limit=1`);
                }
                urlsToTry.push(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1`);

                let foundForCandidate = false;
                for (const nomUrl of urlsToTry) {
                  const nomRes = await fetch(nomUrl);
                  if (nomRes.ok) {
                    const nomData = await nomRes.json();
                    if (Array.isArray(nomData) && nomData.length > 0) {
                      const lat = parseFloat(nomData[0].lat);
                      const lng = parseFloat(nomData[0].lon);
                      const title = parts[0] ? parts[0] : (nomData[0].display_name ? nomData[0].display_name.split(',')[0] : searchQuery);
                      if (!isNaN(lat) && !isNaN(lng)) {
                        data = {
                          lat,
                          lng,
                          title,
                          fullAddress: nomData[0].display_name || searchQuery,
                          wazeUrl: `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`,
                          finalUrl: resolvedUrl,
                        };
                        foundForCandidate = true;
                        break;
                      }
                    }
                  }
                }
                if (foundForCandidate) {
                  break;
                }
              } catch (nomErr) {
                console.error('Nominatim client-side fallback error for candidate:', q, nomErr);
              }
            }

            if (!data) {
              // Address-based Waze navigation link!
              data = {
                title: parts[0] || searchQuery,
                fullAddress: searchQuery,
                wazeUrl: `https://waze.com/ul?q=${encodeURIComponent(searchQuery)}&navigate=yes`,
                finalUrl: resolvedUrl,
                isAddressOnly: true,
              };
            }
          }

          if (!data) {
            throw new Error('Não foi possível extrair coordenadas nem a morada deste link. Por favor, introduza a morada diretamente.');
          }
        }
      }

      if (!data) {
        throw new Error('Falha ao processar a ligação ou obter as coordenadas.');
      }

      const wazeUrl = data.wazeUrl || (data.lat && data.lng ? `https://waze.com/ul?ll=${data.lat},${data.lng}&navigate=yes` : `https://waze.com/ul?q=${encodeURIComponent(data.title)}&navigate=yes`);

      const newItem = {
        title: data.title || 'Destino',
        originalUrl: url,
        wazeUrl,
        lat: data.lat,
        lng: data.lng,
        fullAddress: data.fullAddress,
        road: data.road,
        houseNumber: data.houseNumber,
        postcode: data.postcode,
        city: data.city,
        isAddressOnly: data.isAddressOnly,
      };

      setResult(newItem);
      onConvert(newItem);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLocalLoading(false);
    }
  };

  const handleShare = async () => {
    if (!result) return;
    const shareData = {
      title: result.title,
      text: `Navegar para ${result.title}`,
      url: result.wazeUrl,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        // User cancelled or failed
      }
    } else {
      handleCopy();
    }
  };

  const handleCopy = async () => {
    if (result) {
      await navigator.clipboard.writeText(result.wazeUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl">
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
          <Search className="w-4 h-4 text-cyan-600 dark:text-cyan-500" />
          {t('tabConvert')} Link
        </h2>
        <form onSubmit={handleConvert} className="space-y-4">
          <div>
            <label htmlFor="url" className="block text-xs font-bold text-slate-500 uppercase mb-3 tracking-widest">
              {t('inputLabel')}
            </label>
            <div className="flex flex-col gap-3">
              <div className="relative">
                <input
                  id="url"
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder={t('inputPlaceholder')}
                  className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 rounded-2xl py-4 pl-5 pr-12 text-sm focus:outline-none focus:border-cyan-500 transition-colors text-slate-800 dark:text-slate-300 placeholder-slate-400 dark:placeholder-slate-700 shadow-inner"
                  required
                />
                {url && (
                  <button
                    type="button"
                    onClick={() => { setUrl(''); setResult(null); setError(''); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-slate-400 dark:text-slate-500 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors bg-slate-200/50 dark:bg-slate-950/50 rounded-full"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                  </button>
                )}
              </div>
              <button
                type="submit"
                disabled={isLoading || !url}
                className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-4 px-6 rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 uppercase tracking-widest text-xs"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  t('convertBtn')
                )}
              </button>
            </div>
          </div>
        </form>

        {error && (
          <div className="mt-4 p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 rounded-2xl text-xs uppercase tracking-wider font-bold">
            {error}
          </div>
        )}
      </div>

      {result && (
        <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 relative overflow-hidden shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              {result.isAddressOnly || !result.lat ? 'Navegação por Morada' : 'Navegação GPS'}
            </span>
            <span className={`text-[10px] font-bold px-2 py-1 rounded ${
              result.isAddressOnly || !result.lat 
                ? 'bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400'
                : 'bg-cyan-100 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-500'
            }`}>
              {result.isAddressOnly || !result.lat ? 'MORADA WAZE' : 'GPS WAZE'}
            </span>
          </div>

          <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 mb-4 flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Destino</span>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">
                {result.title}
              </p>
            </div>
            {onSelectLocation && (
              <button
                onClick={() => onSelectLocation({
                  id: 'temp-' + Date.now(),
                  title: result.title,
                  originalUrl: result.originalUrl,
                  wazeUrl: result.wazeUrl,
                  lat: result.lat,
                  lng: result.lng,
                  timestamp: Date.now(),
                  fullAddress: result.fullAddress,
                  road: result.road,
                  houseNumber: result.houseNumber,
                  postcode: result.postcode,
                  city: result.city,
                  isAddressOnly: result.isAddressOnly,
                })}
                className="shrink-0 px-3 py-1.5 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 rounded-xl text-xs font-bold hover:bg-cyan-500/20 transition-colors flex items-center gap-1.5"
              >
                <Info className="w-3.5 h-3.5" />
                <span>{t('viewFullAddress')}</span>
              </button>
            )}
          </div>

          <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 mb-6">
            <code className="text-cyan-600 dark:text-cyan-400 font-mono text-xs break-all leading-relaxed">{result.wazeUrl}</code>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <a
              href={result.wazeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-cyan-600 text-white py-3 rounded-2xl font-bold hover:bg-cyan-500 transition-colors shadow-lg shadow-cyan-900/20 text-xs uppercase"
            >
              <Navigation className="w-4 h-4" />
              {t('openWaze')}
            </a>

            <button
              onClick={handleShare}
              className="flex items-center justify-center gap-2 bg-emerald-600 text-white py-3 rounded-2xl font-bold hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-900/20 text-xs uppercase"
            >
              <Share2 className="w-4 h-4" />
              {t('share')}
            </button>
            
            <button
              onClick={handleCopy}
              className="flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 py-3 rounded-2xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-xs uppercase"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-500" />
                  {t('copied')}
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  {t('copy')}
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

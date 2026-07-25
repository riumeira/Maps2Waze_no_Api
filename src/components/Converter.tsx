import React, { useState } from 'react';
import { Copy, Navigation, Star, Search, MapPin } from 'lucide-react';
import { LocationItem } from '../types';

interface ConverterProps {
  onConvert: (item: Omit<LocationItem, 'id' | 'timestamp'>) => void;
  loading: boolean;
}

export function Converter({ onConvert, loading }: ConverterProps) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState<Omit<LocationItem, 'id' | 'timestamp'> | null>(null);
  const [localLoading, setLocalLoading] = useState(false);

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
        try {
          const decoded = decodeURIComponent(urlStr);
          
          // 1. Check for high-precision !3d / !4d coordinates (actual pinned location)
          // E.g. !3d41.1468351!4d-8.6148317
          const internalRegex = /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/i;
          let internalMatch = decoded.match(internalRegex);
          if (!internalMatch) {
            const laxInternalRegex = /!3d(-?\d+\.\d+)[^!]*!4d(-?\d+\.\d+)/i;
            internalMatch = decoded.match(laxInternalRegex);
          }
          if (internalMatch) {
            const lat = parseFloat(internalMatch[1]);
            const lng = parseFloat(internalMatch[2]);
            if (!isNaN(lat) && !isNaN(lng)) {
              return { lat, lng };
            }
          }

          // 2. Directions coordinates in path (e.g. /dir/origin/destination)
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

          // 3. Standard coordinates in query or path (explicitly defined coordinates)
          // E.g. q=38.7436214,-9.1602037 or query=38.7436214,-9.1602037 or destination=38.7436214,-9.1602037
          const queryCoordsRegex = /(?:q=|query=|destination=|ll=|search\/|place\/)(-?\d+\.\d+)[,%](-?\d+\.\d+)/i;
          const queryCoordsMatch = decoded.match(queryCoordsRegex);
          if (queryCoordsMatch) {
            const lat = parseFloat(queryCoordsMatch[1]);
            const lng = parseFloat(queryCoordsMatch[2]);
            if (!isNaN(lat) && !isNaN(lng)) {
              return { lat, lng };
            }
          }

          // 4. Fallback to @ camera coordinates (only if we didn't find !3d/!4d pinned ones first!)
          // E.g. @41.3409151,-8.7062402,17z
          const cameraRegex = /@(-?\d+\.\d+)[,%](-?\d+\.\d+)/i;
          const cameraMatch = decoded.match(cameraRegex);
          if (cameraMatch) {
            const lat = parseFloat(cameraMatch[1]);
            const lng = parseFloat(cameraMatch[2]);
            if (!isNaN(lat) && !isNaN(lng)) {
              return { lat, lng };
            }
          }

          // 5. Any comma/percent separated float pair as a last resort
          const simpleRegex = /(?:^|[^-\d])(-?\d+\.\d+)[,%](-?\d+\.\d+)(?:$|[^-\d])/;
          const simpleMatch = decoded.match(simpleRegex);
          if (simpleMatch) {
            const lat = parseFloat(simpleMatch[1]);
            const lng = parseFloat(simpleMatch[2]);
            if (!isNaN(lat) && !isNaN(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
              return { lat, lng };
            }
          }
        } catch (e) {
          console.error("Error extracting coordinates:", e);
        }
        return null;
      };

      // 1. Try to extract coordinates directly client-side first to avoid any network requests
      const directCoords = extractCoordinates(url);
      if (directCoords) {
        const wazeUrl = `https://waze.com/ul?ll=${directCoords.lat},${directCoords.lng}&navigate=yes`;
        
        const newItem = {
          title: 'Localização',
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

      // Retrieve the custom Gemini API key from localStorage if it exists
      let storedKey = '';
      try {
        const item = localStorage.getItem('maps2waze_gemini_api_key');
        if (item) {
          storedKey = JSON.parse(item);
        }
      } catch (e) {
        console.error('Error reading Gemini API key for conversion:', e);
      }

      let data: any = null;
      let callBackendSuccessful = false;

      // 2. Try calling the backend conversion API
      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        if (storedKey) {
          headers['X-Gemini-API-Key'] = storedKey;
        }

        const res = await fetch('/api/convert', {
          method: 'POST',
          headers,
          body: JSON.stringify({ url }),
        });

        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const json = await res.json();
          if (res.ok) {
            data = json;
            callBackendSuccessful = true;
          } else {
            const serverError = json.error || '';
            const isBillingOrQuota = 
              serverError.includes("esgotou") || 
              serverError.includes("créditos") || 
              serverError.includes("faturação") || 
              serverError.includes("credits") || 
              serverError.includes("depleted") ||
              res.status === 429;
              
            if (isBillingOrQuota) {
              throw new Error(serverError || "A sua Chave de API do Gemini esgotou os créditos grátis ou requer faturação ativa. Aceda ao Google AI Studio (https://aistudio.google.com/) para gerir o seu projeto e faturação.");
            }
          }
        }
      } catch (backendErr: any) {
        // If it's a specific billing error we threw above, pass it through
        if (
          backendErr.message && (
            backendErr.message.includes("esgotou") || 
            backendErr.message.includes("créditos") || 
            backendErr.message.includes("faturação") || 
            backendErr.message.includes("credits") || 
            backendErr.message.includes("depleted")
          )
        ) {
          throw backendErr;
        }
        console.warn('Backend API call failed or unavailable, attempting client-side fallback:', backendErr);
      }

      // 3. Resilient client-side fallback (works perfectly on static platforms like Vercel)
      if (!callBackendSuccessful) {
        let resolvedUrl = url;
        let htmlContents = '';

        // If it's a shortened URL, try resolving it using multiple CORS proxies sequentially
        if (url.includes('goo.gl') || url.includes('maps.app') || url.includes('g.co')) {
          const proxies = [
            // 1. AllOrigins (returns JSON with final redirected URL in status.url and body in contents)
            {
              url: `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
              type: 'allorigins'
            },
            // 2. Corsproxy.io (returns raw HTML of target, which we can parse for canonical or og:url meta tags)
            {
              url: `https://corsproxy.io/?${encodeURIComponent(url)}`,
              type: 'corsproxy'
            },
            // 3. CodeTabs proxy (returns raw text content of target as fallback)
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

                // If we got HTML contents, extract canonical or og:url
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

                // Check if we can successfully find coordinates using our precise hierarchy in either the resolved URL or the HTML contents
                const checkCoords = extractCoordinates(resolvedUrl) || (htmlContents ? extractCoordinates(htmlContents) : null);
                if (checkCoords) {
                  break; // Stop trying other proxies since we found valid coordinates!
                }
              }
            } catch (proxyErr) {
              console.error(`CORS proxy resolution via ${proxy.type} failed:`, proxyErr);
            }
          }
        }

        // Try extracting coordinates from the resolved URL
        let resolvedCoords = extractCoordinates(resolvedUrl);

        // If not in the resolved URL, search the HTML contents of the redirected page
        if (!resolvedCoords && htmlContents) {
          resolvedCoords = extractCoordinates(htmlContents);
        }

        if (resolvedCoords) {
          data = {
            lat: resolvedCoords.lat,
            lng: resolvedCoords.lng,
            title: 'Localização (Via Link)',
            finalUrl: resolvedUrl,
          };
        } else {
          // Free Nominatim Geocoding fallback client-side if place/search query exists
          let searchQuery = '';
          try {
            const decoded = decodeURIComponent(resolvedUrl);
            const placeMatch = decoded.match(/\/maps\/place\/([^/@?]+)/i);
            const searchMatch = decoded.match(/(?:q=|search\/)([^&/?]+)/i);
            if (placeMatch && placeMatch[1]) {
              searchQuery = placeMatch[1].replace(/\+/g, ' ');
            } else if (searchMatch && searchMatch[1]) {
              searchQuery = searchMatch[1].replace(/\+/g, ' ');
            }
          } catch (e) {
            console.error('Error parsing search query:', e);
          }

          if (searchQuery) {
            try {
              const nomRes = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=1`);
              if (nomRes.ok) {
                const nomData = await nomRes.json();
                if (Array.isArray(nomData) && nomData.length > 0) {
                  const lat = parseFloat(nomData[0].lat);
                  const lng = parseFloat(nomData[0].lon);
                  const title = nomData[0].display_name ? nomData[0].display_name.split(',')[0] : searchQuery;
                  if (!isNaN(lat) && !isNaN(lng)) {
                    data = {
                      lat,
                      lng,
                      title,
                      finalUrl: resolvedUrl,
                    };
                  }
                }
              }
            } catch (nomErr) {
              console.error('Nominatim client-side fallback error:', nomErr);
            }
          }

          if (!data) {
            throw new Error('Não foi possível extrair coordenadas diretamente deste link. Por favor, abra o link no seu navegador, copie o link completo da barra de endereços (com as coordenadas) e cole-o aqui.');
          }
        }
      }

      if (!data) {
        throw new Error('Falha ao processar a ligação ou obter as coordenadas.');
      }

      const wazeUrl = `https://waze.com/ul?ll=${data.lat},${data.lng}&navigate=yes`;

      const newItem = {
        title: data.title || 'Destino',
        originalUrl: url,
        wazeUrl,
        lat: data.lat,
        lng: data.lng,
      };

      setResult(newItem);
      onConvert(newItem);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLocalLoading(false);
    }
  };

  const handleCopy = async () => {
    if (result) {
      await navigator.clipboard.writeText(result.wazeUrl);
      alert('Ligação copiada!');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl">
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
          <Search className="w-4 h-4 text-cyan-600 dark:text-cyan-500" />
          Converter Link
        </h2>
        <form onSubmit={handleConvert} className="space-y-4">
          <div>
            <label htmlFor="url" className="block text-xs font-bold text-slate-500 uppercase mb-3 tracking-widest">
              Ligação do Google Maps
            </label>
            <div className="flex flex-col gap-3">
              <div className="relative">
                <input
                  id="url"
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="Cole a ligação aqui..."
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
                  'Converter'
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
          <div className="absolute top-0 right-0 p-3">
            <span className="bg-cyan-100 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-500 text-[10px] font-bold px-2 py-1 rounded">WAZE READY</span>
          </div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-3 tracking-widest">Resultado compatível</label>
          <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 mb-6">
            <code className="text-cyan-600 dark:text-cyan-400 font-mono text-xs break-all leading-relaxed">{result.wazeUrl}</code>
          </div>
          <div className="flex flex-col sm:grid sm:grid-cols-2 gap-3">
            <a
              href={result.wazeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-cyan-600 text-white py-3 sm:py-4 rounded-2xl font-bold hover:bg-cyan-500 transition-colors shadow-lg shadow-cyan-900/20 text-xs sm:text-sm uppercase"
            >
              <Navigation className="w-4 h-4" />
              Abrir Waze
            </a>
            
            <button
              onClick={handleCopy}
              className="flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-100 text-slate-900 py-3 sm:py-4 rounded-2xl font-bold hover:bg-slate-200 dark:hover:bg-white transition-colors text-xs sm:text-sm uppercase"
            >
              <Copy className="w-4 h-4" />
              Copiar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

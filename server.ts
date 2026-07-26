import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API to convert Google Maps URL to coordinates
  app.post("/api/convert", async (req, res) => {
    try {
      let { url } = req.body;
      if (!url) {
        return res.status(400).json({ error: "A ligação é obrigatória." });
      }

      let rawInput = (url || "").trim();
      let isHttpUrl = /^https?:\/\//i.test(rawInput);

      if (!isHttpUrl && /^(?:[a-z0-9-]+\.)+[a-z]{2,}(?:\/.*)?$/i.test(rawInput)) {
        url = "https://" + rawInput;
        isHttpUrl = true;
      } else {
        url = rawInput;
      }

      // Helper function to extract coordinates from Google Maps URLs or HTML text
      function extractCoordinates(str: string): { lat: number; lng: number } | null {
        if (!str) return null;
        try {
          let decoded = str;
          try {
            decoded = decodeURIComponent(str);
          } catch {
            decoded = str;
          }
          
          // 1. Check for high-precision !3d / !4d coordinates (actual pinned location)
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

          // 5. Standard coordinates in query or path
          const queryCoordsRegex = /(?:q=|query=|destination=|ll=|center=|sll=|search\/|place\/)(-?\d+\.\d+)[,%](-?\d+\.\d+)/i;
          const queryCoordsMatch = decoded.match(queryCoordsRegex);
          if (queryCoordsMatch) {
            const lat = parseFloat(queryCoordsMatch[1]);
            const lng = parseFloat(queryCoordsMatch[2]);
            if (!isNaN(lat) && !isNaN(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
              return { lat, lng };
            }
          }

          // 6. Camera coordinates (@lat,lng)
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

          // 8. Any comma-separated float pair as a fallback (ONLY for short input strings like URLs or raw coordinate inputs)
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
      }

      // Helper to extract Feature ID (ftid e.g. 0xc605f1e2b000001:0x8b8f15d6b71e59c4) from URL or HTML
      function extractFtid(urlStr: string, htmlStr?: string): string | null {
        const ftidRegex = /0x[0-9a-f]+:0x[0-9a-f]+/i;
        const matchUrl = urlStr ? urlStr.match(ftidRegex) : null;
        if (matchUrl) return matchUrl[0];

        if (htmlStr) {
          const matchHtml = htmlStr.match(ftidRegex);
          if (matchHtml) return matchHtml[0];
        }
        return null;
      }

      // Convert FTID (hex1:hex2) into Google Place ID (ChIJ...)
      function ftidToPlaceId(ftid: string): string | null {
        try {
          const parts = ftid.split(':');
          if (parts.length !== 2) return null;
          const h1 = BigInt(parts[0]);
          const h2 = BigInt(parts[1]);

          const buf = Buffer.alloc(17);
          buf.writeBigUInt64LE(h1, 0);
          buf[8] = 0x11;
          buf.writeBigUInt64LE(h2, 9);

          return 'ChIJ' + buf.toString('base64url');
        } catch {
          return null;
        }
      }

      // Helper to resolve location details directly from Google Maps Embed using FTID
      async function resolveFtidViaEmbed(ftid: string) {
        try {
          const pb = "!1m18!1m12!1m3!1d1000!2d0!3d0!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s" + ftid + "!2sLocation!5e0!3m2!1spt-PT!2spt";
          const embedUrl = "https://www.google.com/maps/embed?pb=" + pb;
          const res = await fetch(embedUrl, {
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
              "Accept-Language": "pt-PT,pt;q=0.9"
            }
          });
          if (!res.ok) return null;
          const html = await res.text();

          const detailsMatch = html.match(/\["0x[0-9a-f]+:0x[0-9a-f]+","([^"]+)",\[(-?\d+\.\d+),(-?\d+\.\d+)\]/i);
          if (detailsMatch) {
            const fullAddress = detailsMatch[1];
            const lat = parseFloat(detailsMatch[2]);
            const lng = parseFloat(detailsMatch[3]);
            const title = fullAddress.split(",")[0].trim() || fullAddress;
            return { lat, lng, title, fullAddress, ftid };
          }

          const coordsMatch = html.match(/\[(-?\d+\.\d{4,}),\s*(-?\d+\.\d{4,})\]/);
          if (coordsMatch) {
            const lat = parseFloat(coordsMatch[1]);
            const lng = parseFloat(coordsMatch[2]);
            return { lat, lng, title: "", fullAddress: "", ftid };
          }
        } catch (err) {
          console.error("Embed resolution error:", err);
        }
        return null;
      }

      // Helper function to extract place or address name from URL or HTML page title
      function extractPlaceFromUrl(urlStr: string, htmlStr?: string): string | null {
        try {
          if (htmlStr) {
            const ogTitleMatch = htmlStr.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i);
            if (ogTitleMatch && ogTitleMatch[1]) {
              const clean = ogTitleMatch[1].replace(/\s*-\s*Google Maps/i, '').trim();
              if (clean && !clean.toLowerCase().includes('google maps')) {
                return clean;
              }
            }
            const pageTitleMatch = htmlStr.match(/<title>([^<]+)<\/title>/i);
            if (pageTitleMatch && pageTitleMatch[1]) {
              const clean = pageTitleMatch[1].replace(/\s*-\s*Google Maps/i, '').trim();
              if (clean && !clean.toLowerCase().includes('google maps')) {
                return clean;
              }
            }
          }

          let decoded = urlStr;
          try {
            decoded = decodeURIComponent(urlStr);
          } catch {
            decoded = urlStr;
          }
          
          // 1. Check for /maps/place/Name
          const placeMatch = decoded.match(/\/maps\/place\/([^/@?]+)/i);
          if (placeMatch && placeMatch[1]) {
            const raw = placeMatch[1].replace(/\+/g, " ").trim();
            if (!/^-?\d+\.\d+[\s,%]+-?\d+\.\d+$/.test(raw)) {
              return raw;
            }
          }

          // 2. Check for search query parameters
          const queryMatch = decoded.match(/(?:q=|query=|search\/)([^&/?]+)/i);
          if (queryMatch && queryMatch[1]) {
            const raw = queryMatch[1].replace(/\+/g, " ").trim();
            if (!/^-?\d+\.\d+[\s,%]+-?\d+\.\d+$/.test(raw)) {
              return raw;
            }
          }
        } catch (e) {
          // Ignore
        }
        return null;
      }

      // Helper function to resolve location details (Store Name, Street Address with House Number, Postal Code, City)
      async function resolveLocationInfo(lat: number, lng: number, urlStr: string, htmlStr?: string) {
        const urlTitle = extractPlaceFromUrl(urlStr, htmlStr);
        let info = {
          title: urlTitle || '',
          fullAddress: '',
          road: '',
          houseNumber: '',
          postcode: '',
          city: '',
        };

        try {
          const revUrl = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=pt`;
          const res = await fetch(revUrl, {
            headers: { "User-Agent": "Maps2WazeConverter/1.0 (free-app)" },
          });
          if (res.ok) {
            const data = await res.json();
            const addr = data.address || {};
            
            const storeName = addr.shop || addr.amenity || addr.building || addr.company || addr.tourism || addr.leisure || addr.office;
            const road = addr.road || addr.pedestrian || addr.footway;
            const houseNumber = addr.house_number || addr.house_name;
            const postcode = addr.postcode;
            const city = addr.city || addr.town || addr.village || addr.municipality || addr.suburb || addr.county;

            info.fullAddress = data.display_name || '';
            info.road = road || '';
            info.houseNumber = houseNumber || '';
            info.postcode = postcode || '';
            info.city = city || '';

            if (storeName) {
              info.title = storeName;
            } else if (road) {
              const houseStr = houseNumber ? `, Nº ${houseNumber}` : '';
              const cityStr = city ? `, ${city}` : '';
              info.title = `${road}${houseStr}${cityStr}`;
            } else if (data.display_name) {
              info.title = data.display_name.split(',').slice(0, 2).join(',').trim();
            }
          }
        } catch (err) {
          console.error("Reverse geocoding error:", err);
        }

        if (!info.title) {
          info.title = urlTitle || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        }

        return info;
      }

      const googleHeaders = {
        "User-Agent":
          "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
        "Accept-Language": "pt-PT,pt;q=0.9,en-US;q=0.8,en;q=0.7",
        "Cookie": "CONSENT=YES+1; SOCS=CAISHAgBEhJnd3NfMjAyMzA4MTAtMF9SQzEaAmVuIAEaBgiA_LipBg",
      };

      let currentUrl = url;
      let finalUrl = url;
      let coords = extractCoordinates(currentUrl);
      let pageHtml = "";

      // Step A: Attempt standard automated follow redirect first
      if (isHttpUrl && !coords) {
        try {
          const resFollow = await fetch(currentUrl, {
            method: "GET",
            redirect: "follow",
            headers: googleHeaders,
          });
          finalUrl = resFollow.url || currentUrl;
          coords = extractCoordinates(finalUrl);

          pageHtml = await resFollow.text();
          if (!coords && pageHtml) {
            coords = extractCoordinates(pageHtml);
          }
        } catch (followErr) {
          console.warn("Follow redirect failed, falling back to manual hop loop:", followErr);
        }
      }

      // Step B: Manual hop loop ONLY if Step A failed to expand the short URL
      if (isHttpUrl && !coords && finalUrl === url) {
        currentUrl = url;
        let hops = 0;
        while (hops < 10 && !coords) {
          try {
            const response = await fetch(currentUrl, {
              method: "GET",
              redirect: "manual",
              headers: googleHeaders,
            });

            const location = response.headers.get("location");
            if (location) {
              let nextUrl = location;
              if (nextUrl.startsWith("/")) {
                const parsedUrl = new URL(currentUrl);
                nextUrl = parsedUrl.origin + nextUrl;
              }

              if (
                nextUrl.includes("consent.google.com") ||
                nextUrl.includes("accounts.google.com")
              ) {
                try {
                  const urlObj = new URL(nextUrl);
                  const continueUrl = urlObj.searchParams.get("continue");
                  if (continueUrl) {
                    nextUrl = continueUrl;
                  }
                } catch (err) {
                  // Ignore
                }
              }

              currentUrl = nextUrl;
              finalUrl = currentUrl;
              coords = extractCoordinates(currentUrl);
              hops++;
            } else {
              pageHtml = await response.text();
              coords = extractCoordinates(pageHtml);
              if (coords) break;

              const metaRefreshMatch = pageHtml.match(/content=["']\d+;\s*url=([^"'>]+)["']/i);
              const canonicalMatch = pageHtml.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i);
              const googleMapsHrefMatch = pageHtml.match(/href=["'](https?:\/\/(?:www\.)?google\.[a-z.]+\/maps\/[^"']+)["']/i);
              const anyUrlMatch = pageHtml.match(/(https:\/\/(?:maps\.app\.goo\.gl|goo\.gl\/maps|www\.google\.com\/maps)[^\s"'>]+)/i);

              const nextUrl = 
                (metaRefreshMatch && metaRefreshMatch[1]) ||
                (canonicalMatch && canonicalMatch[1]) ||
                (googleMapsHrefMatch && googleMapsHrefMatch[1]) ||
                (anyUrlMatch && anyUrlMatch[1]);

              if (nextUrl && nextUrl !== currentUrl) {
                currentUrl = nextUrl.replace(/&amp;/g, '&');
                finalUrl = currentUrl;
                coords = extractCoordinates(currentUrl);
                hops++;
              } else {
                break;
              }
            }
          } catch (fetchErr) {
            console.error("Error following redirect at hop", hops, fetchErr);
            break;
          }
        }
      }

      if (!coords) {
        coords = extractCoordinates(finalUrl);
      }

      // Check for FTID / Place ID in URL or HTML
      const ftid = extractFtid(finalUrl, pageHtml) || extractFtid(url, pageHtml);
      const computedPlaceId = ftid ? ftidToPlaceId(ftid) : null;

      // 1. If FTID exists, resolve directly via Google Embed API for 100% pinpoint accuracy
      if (ftid) {
        const embedRes = await resolveFtidViaEmbed(ftid);
        if (embedRes && embedRes.lat && embedRes.lng) {
          const info = await resolveLocationInfo(embedRes.lat, embedRes.lng, finalUrl, pageHtml);
          const finalTitle = embedRes.title || info.title;
          const finalAddr = embedRes.fullAddress || info.fullAddress;

          return res.json({
            lat: embedRes.lat,
            lng: embedRes.lng,
            title: finalTitle,
            fullAddress: finalAddr,
            road: info.road,
            houseNumber: info.houseNumber,
            postcode: info.postcode,
            city: info.city,
            wazeUrl: `https://waze.com/ul?ll=${embedRes.lat},${embedRes.lng}&navigate=yes`,
            finalUrl,
            method: "google_embed",
            ftid
          });
        }
      }

      const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY;

      if (apiKey && computedPlaceId) {
        try {
          const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${computedPlaceId}&key=${apiKey}&language=pt`;
          const detailsRes = await fetch(detailsUrl);
          if (detailsRes.ok) {
            const detailsData = await detailsRes.json();
            if (detailsData.status === "OK" && detailsData.result?.geometry?.location) {
              const placeLoc = detailsData.result.geometry.location;
              const placeName = detailsData.result.name || detailsData.result.formatted_address;
              const fullAddr = detailsData.result.formatted_address || placeName;
              return res.json({
                lat: placeLoc.lat,
                lng: placeLoc.lng,
                title: placeName,
                fullAddress: fullAddr,
                wazeUrl: `https://waze.com/ul?ll=${placeLoc.lat},${placeLoc.lng}&navigate=yes`,
                finalUrl,
                method: "google_places_api",
                placeId: computedPlaceId,
                ftid,
              });
            }
          }
        } catch (apiErr) {
          console.error("Google Places API call error:", apiErr);
        }
      }

      // If coordinates found directly from URL structure or HTML, return them with detailed info!
      if (coords) {
        const info = await resolveLocationInfo(coords.lat, coords.lng, finalUrl, pageHtml);
        return res.json({
          lat: coords.lat,
          lng: coords.lng,
          title: info.title,
          fullAddress: info.fullAddress,
          road: info.road,
          houseNumber: info.houseNumber,
          postcode: info.postcode,
          city: info.city,
          wazeUrl: `https://waze.com/ul?ll=${coords.lat},${coords.lng}&navigate=yes`,
          finalUrl,
          method: "direct"
        });
      }

      // 2. Extract address or place name from URL structure, HTML og:title or title
      let searchQuery = extractPlaceFromUrl(finalUrl, pageHtml) || "";
      if (!searchQuery) {
        try {
          let decodedFinal = finalUrl;
          try { decodedFinal = decodeURIComponent(finalUrl); } catch { decodedFinal = finalUrl; }
          const placeMatch = decodedFinal.match(/\/maps\/place\/([^/@?]+)/i);
          const searchMatch = decodedFinal.match(/(?:q=|query=|search\/)([^&/?]+)/i);

          if (placeMatch && placeMatch[1]) {
            searchQuery = placeMatch[1].replace(/\+/g, " ").trim();
          } else if (searchMatch && searchMatch[1]) {
            searchQuery = searchMatch[1].replace(/\+/g, " ").trim();
          }
        } catch (err) {
          console.error("Error extracting search query:", err);
        }
      }

      // If the input was a plain text address rather than a URL
      if (!searchQuery && !url.toLowerCase().startsWith("http://") && !url.toLowerCase().startsWith("https://")) {
        searchQuery = url.trim();
      }

      // Clean up search query if it contains coordinates or generic Google Maps titles
      if (searchQuery && /^-?\d+\.\d+[\s,%]+-?\d+\.\d+$/.test(searchQuery)) {
        searchQuery = "";
      }

      console.log("DEBUG searchQuery:", searchQuery);

      // 3. Free Geocoding Fallback (OpenStreetMap Nominatim with Multi-Stage Candidates)
      if (searchQuery) {
        const parts = searchQuery.split(',').map(s => s.trim()).filter(Boolean);
        const candidates: string[] = [
          searchQuery,
          searchQuery.toLowerCase().includes("portugal") ? null : `${searchQuery}, Portugal`,
        ].filter(Boolean) as string[];

        if (parts.length > 1) {
          const withoutPoi = parts.slice(1).join(', ');
          candidates.push(withoutPoi);
          if (!withoutPoi.toLowerCase().includes("portugal")) {
            candidates.push(`${withoutPoi}, Portugal`);
          }
        }

        if (parts.length > 2) {
          const streetAndCity = parts.slice(1, parts.length - 1).join(', ');
          candidates.push(streetAndCity);
          if (!streetAndCity.toLowerCase().includes("portugal")) {
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

            for (const nomUrl of urlsToTry) {
              const nomRes = await fetch(nomUrl, {
                headers: {
                  "User-Agent": "Maps2WazeConverter/1.0 (free-app)",
                },
              });
              if (nomRes.ok) {
                const nomData = await nomRes.json();
                if (Array.isArray(nomData) && nomData.length > 0) {
                  const lat = parseFloat(nomData[0].lat);
                  const lng = parseFloat(nomData[0].lon);
                  const title = parts[0] ? parts[0] : (nomData[0].display_name ? nomData[0].display_name.split(',')[0] : searchQuery);
                  if (!isNaN(lat) && !isNaN(lng)) {
                    return res.json({
                      lat,
                      lng,
                      title,
                      fullAddress: nomData[0].display_name || searchQuery,
                      wazeUrl: `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`,
                      finalUrl,
                      method: "nominatim_free",
                    });
                  }
                }
              }
            }
          } catch (nomErr) {
            console.error("Nominatim free geocode failed:", nomErr);
          }
        }

        // 4. ADDRESS FALLBACK: If coordinates could not be geocoded, return a Waze Link by Address!
        const wazeAddressUrl = `https://waze.com/ul?q=${encodeURIComponent(searchQuery)}&navigate=yes`;
        return res.json({
          title: parts[0] || searchQuery,
          fullAddress: searchQuery,
          wazeUrl: wazeAddressUrl,
          finalUrl,
          method: "address_query_fallback",
          isAddressOnly: true,
        });
      }

      res.status(400).json({
        error:
          "Não foi possível extrair as coordenadas nem a morada deste link. Por favor, verifique o link ou introduza a morada diretamente.",
      });
    } catch (error) {
      console.error("Error expanding URL:", error);
      res.status(500).json({
        error: "Falha ao processar a ligação. Pode estar inacessível ou ser inválida.",
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();

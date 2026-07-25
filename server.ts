import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

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

      if (!url.startsWith("http")) {
        url = "https://" + url;
      }

      // Helper function to extract coordinates from Google Maps URLs
      function extractCoordinates(urlStr: string): { lat: number; lng: number } | null {
        try {
          const decoded = decodeURIComponent(urlStr);
          
          // 1. Check for high-precision !3d / !4d coordinates (actual pinned location)
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

          // 3. Standard coordinates in query or path
          const queryCoordsRegex = /(?:q=|query=|destination=|ll=|search\/|place\/)(-?\d+\.\d+)[,%](-?\d+\.\d+)/i;
          const queryCoordsMatch = decoded.match(queryCoordsRegex);
          if (queryCoordsMatch) {
            const lat = parseFloat(queryCoordsMatch[1]);
            const lng = parseFloat(queryCoordsMatch[2]);
            if (!isNaN(lat) && !isNaN(lng)) {
              return { lat, lng };
            }
          }

          // 4. Camera coordinates (@lat,lng)
          const cameraRegex = /@(-?\d+\.\d+)[,%](-?\d+\.\d+)/i;
          const cameraMatch = decoded.match(cameraRegex);
          if (cameraMatch) {
            const lat = parseFloat(cameraMatch[1]);
            const lng = parseFloat(cameraMatch[2]);
            if (!isNaN(lat) && !isNaN(lng)) {
              return { lat, lng };
            }
          }

          // 5. Any comma-separated float pair as a last resort
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
      }

      // 1. Resolve redirects manually to capture final URL with coordinates
      let currentUrl = url;
      let hops = 0;
      let finalUrl = url;
      let coords = extractCoordinates(currentUrl);

      while (hops < 10) {
        if (coords) {
          break;
        }

        try {
          const response = await fetch(currentUrl, {
            method: "GET",
            redirect: "manual",
            headers: {
              "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            },
          });

          const location = response.headers.get("location");
          if (!location) {
            finalUrl = currentUrl;
            break;
          }

          // Handle Google's Consent Wall / Login Redirection
          if (
            location.includes("consent.google.com") ||
            location.includes("accounts.google.com")
          ) {
            try {
              const urlObj = new URL(location);
              const continueUrl = urlObj.searchParams.get("continue");
              if (continueUrl) {
                currentUrl = continueUrl;
                finalUrl = continueUrl;
                coords = extractCoordinates(continueUrl);
                if (coords) {
                  break;
                }
              }
            } catch (err) {
              // Ignore
            }
            finalUrl = currentUrl;
            break;
          }

          if (location.startsWith("/")) {
            const parsedUrl = new URL(currentUrl);
            currentUrl = parsedUrl.origin + location;
          } else {
            currentUrl = location;
          }

          finalUrl = currentUrl;
          coords = extractCoordinates(currentUrl);
          hops++;
        } catch (fetchErr) {
          console.error("Error following redirect at hop", hops, fetchErr);
          break;
        }
      }

      if (!coords) {
        coords = extractCoordinates(finalUrl);
      }

      // If coordinates found directly from URL structure, return them!
      if (coords) {
        return res.json({ lat: coords.lat, lng: coords.lng, finalUrl, method: "direct" });
      }

      // 2. Free Geocoding Fallback (OpenStreetMap Nominatim) - NO API KEY REQUIRED!
      // Extract place name or query from the URL path or search query
      let searchQuery = "";
      try {
        const decodedFinal = decodeURIComponent(finalUrl);
        const placeMatch = decodedFinal.match(/\/maps\/place\/([^/@?]+)/i);
        const searchMatch = decodedFinal.match(/(?:q=|search\/)([^&/?]+)/i);

        if (placeMatch && placeMatch[1]) {
          searchQuery = placeMatch[1].replace(/\+/g, " ");
        } else if (searchMatch && searchMatch[1]) {
          searchQuery = searchMatch[1].replace(/\+/g, " ");
        }
      } catch (err) {
        console.error("Error extracting search query:", err);
      }

      if (searchQuery) {
        try {
          const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=1`;
          const nomRes = await fetch(nominatimUrl, {
            headers: {
              "User-Agent": "Maps2WazeConverter/1.0 (free-app)",
            },
          });
          if (nomRes.ok) {
            const nomData = await nomRes.json();
            if (Array.isArray(nomData) && nomData.length > 0) {
              const lat = parseFloat(nomData[0].lat);
              const lng = parseFloat(nomData[0].lon);
              const title = nomData[0].display_name ? nomData[0].display_name.split(',')[0] : searchQuery;
              if (!isNaN(lat) && !isNaN(lng)) {
                return res.json({
                  lat,
                  lng,
                  title,
                  finalUrl,
                  method: "nominatim_free",
                });
              }
            }
          }
        } catch (nomErr) {
          console.error("Nominatim free geocode failed:", nomErr);
        }
      }

      res.status(400).json({
        error:
          "Não foi possível extrair as coordenadas automaticamente deste link. Por favor, abra o link no seu navegador, copie o link completo da barra de endereços (que contém as coordenadas) e cole-o aqui.",
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

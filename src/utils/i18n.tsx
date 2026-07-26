import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'pt' | 'fr' | 'en' | 'es';

export const LANGUAGES: { code: Language; name: string; nativeName: string; flag: string }[] = [
  { code: 'pt', name: 'Português', nativeName: 'Português', flag: '🇵🇹' },
  { code: 'fr', name: 'Francês', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'en', name: 'Inglês', nativeName: 'English', flag: '🇬🇧' },
  { code: 'es', name: 'Espanhol', nativeName: 'Español', flag: '🇪🇸' },
];

export function getDeviceLanguage(): Language {
  if (typeof window === 'undefined' || !navigator) return 'pt';
  const lang = (navigator.language || (navigator as any).userLanguage || 'pt').toLowerCase();
  if (lang.startsWith('pt')) return 'pt';
  if (lang.startsWith('fr')) return 'fr';
  if (lang.startsWith('es')) return 'es';
  if (lang.startsWith('en')) return 'en';
  return 'pt';
}

export const translations = {
  pt: {
    // Header & Settings
    settings: "Definições",
    theme: "Tema da Aplicação",
    light: "Claro",
    dark: "Escuro",
    language: "Língua / Idioma",
    deviceLanguage: "Detetado automaticamente",
    close: "Fechar",
    
    // Nav
    tabConvert: "Converter",
    tabFavorites: "Favoritos",
    tabHistory: "Histórico",
    tabHelp: "Ajuda",
    
    // Converter
    inputLabel: "Cole o link do Google Maps",
    inputPlaceholder: "Cole aqui o link do Google Maps (ex: https://maps.app.goo.gl/...)",
    convertBtn: "CONVERTER",
    converting: "A CONVERTER...",
    openWaze: "ABRIR",
    share: "PARTILHAR",
    copy: "COPIAR",
    copied: "COPIADO",
    invalidUrl: "Por favor insira um URL válido do Google Maps",
    
    // Address card
    addressDetailsTitle: "Detalhes do Endereço",
    viewFullAddress: "Ver Morada Completa",
    
    // Geolocation
    currentLocation: "Localização atual",
    getLocation: "Obter a minha localização",
    gettingLocation: "A obter...",
    save: "GUARDAR",

    // Location details modal
    locationDetails: "Detalhes do Local",
    fullAddress: "Morada Completa",
    street: "Rua",
    number: "Número de Porta",
    postcode: "Código Postal",
    city: "Cidade",
    coordinates: "Coordenadas GPS",
    navigateWaze: "Navegar no Waze",
    googleMaps: "Maps",
    linkCopied: "Link Copiado",

    // Save modal
    saveLocationTitle: "Guardar localização",
    locationNameLabel: "Nome do local",
    locationNamePlaceholder: "Ex: Casa, Trabalho...",
    saveSuccess: "Guardado com sucesso!",
    cancel: "Cancelar",

    // Favorites
    myFavorites: "Os Meus Favoritos",
    emptyFavorites: "Sem favoritos guardados",
    sortBy: "Ordenar por",
    sortByDate: "Data",
    sortByName: "Nome",

    // History
    historyTitle: "Histórico de Conversões",
    clearHistory: "Limpar histórico",
    emptyHistory: "O seu histórico está vazio",

    // Help
    helpTitle: "Ajuda e Como Funciona",
    helpSubtitle: "Guia rápido das funcionalidades da aplicação",
    help1Title: "1. Converter Links",
    help1Desc: "Cole qualquer link do Google Maps (mesmo encurtado do telemóvel) e clique em Converter para obter a rota direta no Waze.",
    help2Title: "2. Morada Completa e Nº de Porta",
    help2Desc: "Ao clicar em qualquer local ou no botão Morada Completa, veja o nome da rua, número da porta, código postal e cidade.",
    help3Title: "3. Partilhar Links",
    help3Desc: "Utilize o botão Partilhar para enviar a rota gerada para amigos ou familiares via WhatsApp, SMS ou outras aplicações.",
    help4Title: "4. Locais Favoritos",
    help4Desc: "Guarde os seus destinos frequentes clicando na estrela para aceder e navegar com apenas um clique a qualquer momento.",
    help5Title: "5. Histórico",
    help5Desc: "Todas as conversões ficam guardadas no histórico. Pode rever detalhes, voltar a abrir no Waze ou apagar itens individualmente.",
    help6Title: "6. A Minha Localização GPS",
    help6Desc: "Converta instantaneamente a sua posição GPS atual num ponto de navegação Waze para partilhar onde se encontra.",

    // Support / Beer
    supportTitle: "Apoie o Projeto!",
    supportText: "Se gostas da app e a achas útil, partilha com os teus amigos! E se quiseres, podes pagar-me uma cerveja 🍻",
    revolut: "Revolut me",
    shareApp: "Partilhar a App",
    sendSuggestion: "Enviar Sugestão",
    shareAppText: "Olha esta app fantástica para converter links do Google Maps para o Waze!",
  },
  fr: {
    // Header & Settings
    settings: "Paramètres",
    theme: "Thème de l'application",
    light: "Clair",
    dark: "Sombre",
    language: "Langue",
    deviceLanguage: "Détecté automatiquement",
    close: "Fermer",

    // Nav
    tabConvert: "Convertir",
    tabFavorites: "Favoris",
    tabHistory: "Historique",
    tabHelp: "Aide",

    // Converter
    inputLabel: "Collez le lien Google Maps",
    inputPlaceholder: "Collez le lien Google Maps ici (ex : https://maps.app.goo.gl/...)",
    convertBtn: "CONVERTIR",
    converting: "CONVERSION...",
    openWaze: "OUVRIR",
    share: "PARTAGER",
    copy: "COPIER",
    copied: "COPIÉ",
    invalidUrl: "Veuillez entrer une URL Google Maps valide",

    // Address card
    addressDetailsTitle: "Détails de l'adresse",
    viewFullAddress: "Voir l'adresse complète",

    // Geolocation
    currentLocation: "Position actuelle",
    getLocation: "Obtenir ma position",
    gettingLocation: "Obtention...",
    save: "ENREGISTRER",

    // Location details modal
    locationDetails: "Détails du lieu",
    fullAddress: "Adresse complète",
    street: "Rue",
    number: "Numéro de porte",
    postcode: "Code postal",
    city: "Ville",
    coordinates: "Coordonnées GPS",
    navigateWaze: "Naviguer avec Waze",
    googleMaps: "Maps",
    linkCopied: "Lien copié",

    // Save modal
    saveLocationTitle: "Enregistrer l'emplacement",
    locationNameLabel: "Nom du lieu",
    locationNamePlaceholder: "Ex : Maison, Travail...",
    saveSuccess: "Enregistré avec succès !",
    cancel: "Annuler",

    // Favorites
    myFavorites: "Mes Favoris",
    emptyFavorites: "Aucun favori enregistré",
    sortBy: "Trier par",
    sortByDate: "Date",
    sortByName: "Nom",

    // History
    historyTitle: "Historique des conversions",
    clearHistory: "Effacer l'historique",
    emptyHistory: "Votre historique est vide",

    // Help
    helpTitle: "Aide et Fonctionnement",
    helpSubtitle: "Guide rapide des fonctionnalités de l'application",
    help1Title: "1. Convertir des liens",
    help1Desc: "Collez n'importe quel lien Google Maps et cliquez sur Convertir pour obtenir l'itinéraire direct dans Waze.",
    help2Title: "2. Adresse complète et N° de porte",
    help2Desc: "Consultez le nom de la rue, le numéro de porte, le code postal et la ville de chaque emplacement.",
    help3Title: "3. Partager des liens",
    help3Desc: "Utilisez le bouton Partager pour envoyer l'itinéraire généré à vos proches via WhatsApp, SMS ou autres applications.",
    help4Title: "4. Lieux Favoris",
    help4Desc: "Enregistrez vos destinations fréquentes en cliquant sur l'étoile pour y accéder rapidement à tout moment.",
    help5Title: "5. Historique",
    help5Desc: "Toutes vos conversions sont conservées dans l'historique pour les consulter ou les rouvrir dans Waze.",
    help6Title: "6. Ma Position GPS",
    help6Desc: "Convertissez instantanément votre position GPS actuelle en point de navigation Waze à partager.",

    // Support / Beer
    supportTitle: "Soutenez le Projet !",
    supportText: "Si vous aimez l'application et la trouvez utile, partagez-la avec vos amis ! Et si vous le souhaitez, payez-moi une bière 🍻",
    revolut: "Revolut me",
    shareApp: "Partager l'application",
    sendSuggestion: "Envoyer une suggestion",
    shareAppText: "Découvrez cette super application pour convertir les liens Google Maps vers Waze !",
  },
  en: {
    // Header & Settings
    settings: "Settings",
    theme: "App Theme",
    light: "Light",
    dark: "Dark",
    language: "Language",
    deviceLanguage: "Automatically detected",
    close: "Close",

    // Nav
    tabConvert: "Convert",
    tabFavorites: "Favorites",
    tabHistory: "History",
    tabHelp: "Help",

    // Converter
    inputLabel: "Paste Google Maps link",
    inputPlaceholder: "Paste Google Maps link here (e.g. https://maps.app.goo.gl/...)",
    convertBtn: "CONVERT",
    converting: "CONVERTING...",
    openWaze: "OPEN",
    share: "SHARE",
    copy: "COPY",
    copied: "COPIED",
    invalidUrl: "Please enter a valid Google Maps URL",

    // Address card
    addressDetailsTitle: "Address Details",
    viewFullAddress: "View Full Address",

    // Geolocation
    currentLocation: "Current Location",
    getLocation: "Get my location",
    gettingLocation: "Getting location...",
    save: "SAVE",

    // Location details modal
    locationDetails: "Location Details",
    fullAddress: "Full Address",
    street: "Street",
    number: "Door Number",
    postcode: "Postcode",
    city: "City",
    coordinates: "GPS Coordinates",
    navigateWaze: "Navigate in Waze",
    googleMaps: "Maps",
    linkCopied: "Link Copied",

    // Save modal
    saveLocationTitle: "Save location",
    locationNameLabel: "Location name",
    locationNamePlaceholder: "E.g. Home, Work...",
    saveSuccess: "Saved successfully!",
    cancel: "Cancel",

    // Favorites
    myFavorites: "My Favorites",
    emptyFavorites: "No saved favorites",
    sortBy: "Sort by",
    sortByDate: "Date",
    sortByName: "Name",

    // History
    historyTitle: "Conversion History",
    clearHistory: "Clear history",
    emptyHistory: "Your history is empty",

    // Help
    helpTitle: "Help & How It Works",
    helpSubtitle: "Quick guide to application features",
    help1Title: "1. Convert Links",
    help1Desc: "Paste any Google Maps link and click Convert to get the direct Waze route.",
    help2Title: "2. Full Address & Door No.",
    help2Desc: "Click any location or 'View Full Address' to see street name, door number, postcode and city.",
    help3Title: "3. Share Links",
    help3Desc: "Use the Share button to send the generated route to friends via WhatsApp, SMS, or other apps.",
    help4Title: "4. Favorite Places",
    help4Desc: "Save your frequent destinations by clicking the star for quick access anytime.",
    help5Title: "5. History",
    help5Desc: "All conversions are kept in your history to review or reopen in Waze at any time.",
    help6Title: "6. My GPS Location",
    help6Desc: "Instantly convert your current GPS position into a Waze waypoint to share where you are.",

    // Support / Beer
    supportTitle: "Support the Project!",
    supportText: "If you like the app and find it useful, share it with your friends! And if you want, buy me a beer 🍻",
    revolut: "Revolut me",
    shareApp: "Share the App",
    sendSuggestion: "Send Suggestion",
    shareAppText: "Check out this awesome app to convert Google Maps links to Waze!",
  },
  es: {
    // Header & Settings
    settings: "Configuración",
    theme: "Tema de la aplicación",
    light: "Claro",
    dark: "Oscuro",
    language: "Idioma",
    deviceLanguage: "Detectado automáticamente",
    close: "Cerrar",

    // Nav
    tabConvert: "Convertir",
    tabFavorites: "Favoritos",
    tabHistory: "Historial",
    tabHelp: "Ayuda",

    // Converter
    inputLabel: "Pega el enlace de Google Maps",
    inputPlaceholder: "Pega aquí el enlace de Google Maps (ej: https://maps.app.goo.gl/...)",
    convertBtn: "CONVERTIR",
    converting: "CONVIRTIENDO...",
    openWaze: "ABRIR",
    share: "COMPARTIR",
    copy: "COPIAR",
    copied: "COPIADO",
    invalidUrl: "Por favor introduce un URL válido de Google Maps",

    // Address card
    addressDetailsTitle: "Detalles de la Dirección",
    viewFullAddress: "Ver Dirección Completa",

    // Geolocation
    currentLocation: "Ubicación actual",
    getLocation: "Obtener mi ubicación",
    gettingLocation: "Obteniendo...",
    save: "GUARDAR",

    // Location details modal
    locationDetails: "Detalles del Lugar",
    fullAddress: "Dirección Completa",
    street: "Calle",
    number: "Número de Puerta",
    postcode: "Código Postal",
    city: "Ciudad",
    coordinates: "Coordenadas GPS",
    navigateWaze: "Navegar en Waze",
    googleMaps: "Maps",
    linkCopied: "Enlace Copiado",

    // Save modal
    saveLocationTitle: "Guardar ubicación",
    locationNameLabel: "Nombre del lugar",
    locationNamePlaceholder: "Ej: Casa, Trabajo...",
    saveSuccess: "¡Guardado con éxito!",
    cancel: "Cancelar",

    // Favorites
    myFavorites: "Mis Favoritos",
    emptyFavorites: "Sin favoritos guardados",
    sortBy: "Ordenar por",
    sortByDate: "Fecha",
    sortByName: "Nombre",

    // History
    historyTitle: "Historial de Conversiones",
    clearHistory: "Limpiar historial",
    emptyHistory: "Tu historial está vacío",

    // Help
    helpTitle: "Ayuda y Cómo Funciona",
    helpSubtitle: "Guía rápida de funciones de la aplicación",
    help1Title: "1. Convertir Enlaces",
    help1Desc: "Pega cualquier enlace de Google Maps y haz clic en Convertir para obtener la ruta directa en Waze.",
    help2Title: "2. Dirección Completa y N° de Puerta",
    help2Desc: "Consulta el nombre de la calle, número de puerta, código postal y ciudad de cada lugar.",
    help3Title: "3. Compartir Enlaces",
    help3Desc: "Usa el botón Compartir para enviar la ruta generada a tus amigos por WhatsApp, SMS u otras aplicaciones.",
    help4Title: "4. Lugares Favoritos",
    help4Desc: "Guarda tus destinos frecuentes haciendo clic en la estrella para acceder rápidamente.",
    help5Title: "5. Historial",
    help5Desc: "Todas las conversiones se guardan en el historial para revisarlas o volver a abrirlas en Waze.",
    help6Title: "6. Mi Ubicación GPS",
    help6Desc: "Convierte al instante tu posición GPS actual en un punto de navegación de Waze para compartir tu ubicación.",

    // Support / Beer
    supportTitle: "¡Apoya el Proyecto!",
    supportText: "Si te gusta la app y te resulta útil, ¡compártela con tus amigos! Y si quieres, invítame a una cerveza 🍻",
    revolut: "Revolut me",
    shareApp: "Compartir la App",
    sendSuggestion: "Enviar Sugerencia",
    shareAppText: "¡Mira esta fantástica aplicación para convertir enlaces de Google Maps a Waze!",
  }
};

export type TranslationKeys = keyof typeof translations['pt'];

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  detectedLanguage: Language;
  t: (key: TranslationKeys) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const detectedLanguage = getDeviceLanguage();
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('maps2waze_language');
        if (saved && ['pt', 'fr', 'en', 'es'].includes(JSON.parse(saved))) {
          return JSON.parse(saved) as Language;
        }
      } catch (e) {
        // Ignore read error
      }
    }
    return detectedLanguage;
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('maps2waze_language', JSON.stringify(lang));
      } catch (e) {
        // Ignore write error
      }
    }
  };

  const t = (key: TranslationKeys): string => {
    const langDict = translations[language] || translations['pt'];
    return langDict[key] || translations['pt'][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, detectedLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

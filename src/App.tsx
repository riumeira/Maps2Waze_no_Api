import React, { useState, useEffect } from 'react';
import { Map, Moon, Sun, MapPin, Navigation, Clock, Star, HelpCircle, Settings, X, Share2, Beer, Mail, Globe } from 'lucide-react';
import { Converter } from './components/Converter';
import { History } from './components/History';
import { Favorites } from './components/Favorites';
import { InstallPrompt } from './components/InstallPrompt';
import { Help } from './components/Help';
import { LocationModal } from './components/LocationModal';
import { useHistory, useFavorites, useStorage } from './utils/storage';
import { useGeolocation } from './hooks/useGeolocation';
import { LocationItem } from './types';
import { useLanguage, LANGUAGES, Language } from './utils/i18n';

export default function App() {
  const { language, setLanguage, detectedLanguage, t } = useLanguage();
  const [theme, setTheme] = useStorage<'light' | 'dark'>('maps2waze_theme', 'light');
  const [activeTab, setActiveTab] = useState<'convert' | 'favorites' | 'history' | 'help'>('convert');
  const [loading, setLoading] = useState(false);
  
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [locationName, setLocationName] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [selectedLocation, setSelectedLocation] = useState<LocationItem | null>(null);

  const { history, addHistory, removeHistoryItem, clearHistory } = useHistory();
  const { favorites, addFavorite, removeFavorite } = useFavorites();
  const geo = useGeolocation();

  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showBeerModal, setShowBeerModal] = useState(false);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const handleConvert = (item: Omit<LocationItem, 'id' | 'timestamp'>) => {
    addHistory(item);
  };

  const openSaveModal = () => {
    setLocationName(t('currentLocation'));
    setShowSaveModal(true);
    setSaveSuccess(false);
  };

  const confirmSaveLocation = () => {
    if (geo.lat && geo.lng && locationName.trim()) {
      const newItem = {
        id: crypto.randomUUID(),
        title: locationName.trim(),
        originalUrl: '',
        wazeUrl: `https://waze.com/ul?ll=${geo.lat},${geo.lng}&navigate=yes`,
        lat: geo.lat,
        lng: geo.lng,
        timestamp: Date.now()
      };
      addFavorite(newItem);
      setSaveSuccess(true);
      setTimeout(() => {
        setShowSaveModal(false);
        setSaveSuccess(false);
      }, 1500);
    }
  };

  const isSelectedFavorite = selectedLocation
    ? favorites.some(f => f.id === selectedLocation.id || (f.lat === selectedLocation.lat && f.lng === selectedLocation.lng && f.title === selectedLocation.title))
    : false;

  const toggleSelectedFavorite = () => {
    if (!selectedLocation) return;
    if (isSelectedFavorite) {
      const found = favorites.find(f => f.id === selectedLocation.id || (f.lat === selectedLocation.lat && f.lng === selectedLocation.lng && f.title === selectedLocation.title));
      if (found) removeFavorite(found.id);
      else removeFavorite(selectedLocation.id);
    } else {
      addFavorite(selectedLocation);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0F1115] text-slate-900 dark:text-[#E2E8F0] font-sans transition-colors">
      <div className="max-w-md mx-auto min-h-screen flex flex-col shadow-2xl bg-slate-50 dark:bg-[#0F1115] box-border">
        
        {/* Header */}
        <header className="px-6 py-5 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 sticky top-0 bg-slate-50/90 dark:bg-[#0F1115]/90 backdrop-blur-md z-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-cyan-500 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.4)]">
              <Map className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight uppercase text-slate-900 dark:text-white">Maps<span className="text-cyan-600 dark:text-cyan-400">2</span>Waze</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowSettingsModal(true)}
              className="p-2 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors shadow-sm text-slate-600 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-400"
              title={t('settings')}
            >
              <Settings className="w-5 h-5" />
            </button>
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors shadow-sm"
              title={theme === 'dark' ? t('light') : t('dark')}
            >
              {theme === 'dark' ? <Sun className="w-5 h-5 text-cyan-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-6 pb-28 overflow-y-auto">
          {activeTab === 'convert' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <Converter 
                onConvert={handleConvert} 
                loading={loading} 
                onSelectLocation={setSelectedLocation}
              />
              
              {/* Geolocation Section */}
              <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <MapPin className="w-4 h-4" /> {t('currentLocation')}
                </h3>
                
                <button
                  onClick={geo.getLocation}
                  disabled={geo.loading}
                  className="w-full bg-slate-100 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 hover:border-cyan-500 text-slate-700 dark:text-slate-300 font-bold py-4 px-4 rounded-2xl transition-colors flex justify-center items-center gap-2 uppercase tracking-widest text-xs shadow-sm"
                >
                  {geo.loading ? t('gettingLocation') : t('getLocation')}
                </button>
                
                {geo.error && <p className="text-xs text-red-500 mt-2">{geo.error}</p>}
                
                {geo.lat && geo.lng && (
                  <div className="mt-4 space-y-4">
                    <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                      <code className="text-cyan-600 dark:text-cyan-400 font-mono text-xs break-all leading-relaxed">
                        https://waze.com/ul?ll={geo.lat},{geo.lng}&navigate=yes
                      </code>
                    </div>
                    <div className="flex flex-col sm:grid sm:grid-cols-2 gap-3">
                      <button
                        onClick={() => {
                          const url = `https://waze.com/ul?ll=${geo.lat},${geo.lng}&navigate=yes`;
                          if (navigator.share) {
                            navigator.share({
                              title: t('currentLocation'),
                              url: url
                            }).catch(() => {});
                          } else {
                            navigator.clipboard.writeText(url);
                            alert(t('linkCopied'));
                          }
                        }}
                        className="flex-1 bg-cyan-600 text-white font-bold py-3 px-3 rounded-2xl flex justify-center items-center gap-2 text-xs hover:bg-cyan-500 transition-colors shadow-lg shadow-cyan-900/20"
                      >
                        <Share2 className="w-4 h-4" />
                        {t('share')}
                      </button>
                      <button
                        onClick={openSaveModal}
                        className="flex-1 bg-slate-200 dark:bg-slate-100 text-slate-900 font-bold py-3 px-3 rounded-2xl flex justify-center items-center gap-2 text-xs hover:bg-slate-300 dark:hover:bg-white transition-colors"
                      >
                        {t('save')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'favorites' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
              <Favorites 
                favorites={favorites} 
                onRemove={removeFavorite} 
                onSelectLocation={setSelectedLocation}
              />
            </div>
          )}

          {activeTab === 'history' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
              <History 
                history={history} 
                favorites={favorites}
                onClear={clearHistory} 
                onRemoveItem={removeHistoryItem}
                onAddFavorite={addFavorite}
                onRemoveFavorite={removeFavorite}
                onSelectLocation={setSelectedLocation}
              />
            </div>
          )}

          {activeTab === 'help' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
              <Help />
            </div>
          )}
        </main>
        
        <InstallPrompt />

        {/* Location Details Modal */}
        <LocationModal 
          item={selectedLocation} 
          onClose={() => setSelectedLocation(null)}
          isFavorite={isSelectedFavorite}
          onToggleFavorite={toggleSelectedFavorite}
        />

        {/* Settings Modal */}
        {showSettingsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 dark:bg-[#0F1115]/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl w-full max-w-sm animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-300 uppercase tracking-widest flex items-center gap-2">
                  <Settings className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  {t('settings')}
                </h3>
                <button 
                  onClick={() => setShowSettingsModal(false)}
                  className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 mb-6">
                {/* Language Selection Section */}
                <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                      {t('language')}
                    </label>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {LANGUAGES.map((lang) => {
                      const isSelected = language === lang.code;
                      const isDetected = detectedLanguage === lang.code;
                      return (
                        <button
                          key={lang.code}
                          onClick={() => setLanguage(lang.code)}
                          className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all text-left flex items-center justify-between gap-1.5 ${
                            isSelected
                              ? 'bg-cyan-600 text-white shadow-md shadow-cyan-900/20'
                              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-cyan-500'
                          }`}
                        >
                          <span className="flex items-center gap-1.5 truncate">
                            <span className="text-base leading-none">{lang.flag}</span>
                            <span className="truncate">{lang.nativeName}</span>
                          </span>
                          {isDetected && (
                            <span 
                              className={`text-[9px] px-1.5 py-0.5 rounded-md font-extrabold uppercase shrink-0 ${
                                isSelected 
                                  ? 'bg-white/20 text-white' 
                                  : 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400'
                              }`}
                              title={t('deviceLanguage')}
                            >
                              AUTO
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2 text-center italic">
                    {t('deviceLanguage')}: <span className="font-bold uppercase">{LANGUAGES.find(l => l.code === detectedLanguage)?.nativeName}</span>
                  </p>
                </div>

                {/* App Theme Section */}
                <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-3 tracking-widest">
                    {t('theme')}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setTheme('light')}
                      className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 ${
                        theme === 'light'
                          ? 'bg-cyan-600 text-white'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <Sun className="w-4 h-4" />
                      {t('light')}
                    </button>
                    <button
                      onClick={() => setTheme('dark')}
                      className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 ${
                        theme === 'dark'
                          ? 'bg-cyan-600 text-white'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <Moon className="w-4 h-4" />
                      {t('dark')}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-4 rounded-2xl text-xs uppercase tracking-widest transition-colors flex items-center justify-center gap-1.5"
                >
                  {t('close')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Save Modal */}
        {showSaveModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 dark:bg-[#0F1115]/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl w-full max-w-sm animate-in zoom-in-95 duration-200">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-300 uppercase tracking-widest mb-4">{t('saveLocationTitle')}</h3>
              
              <div className="mb-6">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-widest">
                  {t('locationNameLabel')}
                </label>
                <input
                  type="text"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  placeholder={t('locationNamePlaceholder')}
                  className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 text-sm focus:outline-none focus:border-cyan-500 transition-colors text-slate-800 dark:text-slate-300 placeholder-slate-400 dark:placeholder-slate-700 shadow-inner"
                  autoFocus
                />
              </div>

              {saveSuccess ? (
                <div className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 py-3 rounded-2xl text-center text-xs font-bold uppercase tracking-widest flex justify-center items-center gap-2">
                  <Star className="w-4 h-4" />
                  {t('saveSuccess')}
                </div>
              ) : (
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowSaveModal(false)}
                    className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-white font-bold py-3 px-4 rounded-2xl text-xs uppercase tracking-widest transition-colors"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    onClick={confirmSaveLocation}
                    disabled={!locationName.trim()}
                    className="flex-1 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-2xl text-xs uppercase tracking-widest transition-colors"
                  >
                    {t('save')}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Bottom Navigation - Fixed Footer */}
        <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto z-30 flex items-center justify-around p-3 border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-[#0F1115]/95 backdrop-blur-md pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.08)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.5)]">
          <button
            onClick={() => setActiveTab('convert')}
            className={`flex flex-col items-center gap-1 p-2 transition-colors ${
              activeTab === 'convert' ? 'text-cyan-600 dark:text-cyan-400' : 'text-slate-400 dark:text-slate-600'
            }`}
          >
            <Map className="w-6 h-6" />
            <span className="text-[10px] font-bold uppercase tracking-widest mt-1 hidden sm:block">{t('tabConvert')}</span>
          </button>
          
          <button
            onClick={() => setActiveTab('favorites')}
            className={`flex flex-col items-center gap-1 p-2 transition-colors ${
              activeTab === 'favorites' ? 'text-cyan-600 dark:text-cyan-400' : 'text-slate-400 dark:text-slate-600'
            }`}
          >
            <Star className="w-6 h-6" />
            <span className="text-[10px] font-bold uppercase tracking-widest mt-1 hidden sm:block">{t('tabFavorites')}</span>
          </button>

          <div className="relative -top-6">
            <button
              onClick={() => setShowBeerModal(true)}
              className="flex items-center justify-center w-14 h-14 bg-gradient-to-tr from-amber-400 to-amber-600 rounded-full shadow-lg shadow-amber-500/40 text-white hover:scale-110 transition-transform border-4 border-white dark:border-[#0F1115]"
            >
              <Beer className="w-6 h-6" />
            </button>
          </div>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex flex-col items-center gap-1 p-2 transition-colors ${
              activeTab === 'history' ? 'text-cyan-600 dark:text-cyan-400' : 'text-slate-400 dark:text-slate-600'
            }`}
          >
            <Clock className="w-6 h-6" />
            <span className="text-[10px] font-bold uppercase tracking-widest mt-1 hidden sm:block">{t('tabHistory')}</span>
          </button>

          <button
            onClick={() => setActiveTab('help')}
            className={`flex flex-col items-center gap-1 p-2 transition-colors ${
              activeTab === 'help' ? 'text-cyan-600 dark:text-cyan-400' : 'text-slate-400 dark:text-slate-600'
            }`}
          >
            <HelpCircle className="w-6 h-6" />
            <span className="text-[10px] font-bold uppercase tracking-widest mt-1 hidden sm:block">{t('tabHelp')}</span>
          </button>
        </nav>

        {/* Beer Modal */}
        {showBeerModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 dark:bg-[#0F1115]/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl w-full max-w-sm animate-in zoom-in-95 duration-200 text-center relative overflow-hidden">
              
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-amber-400/20 rounded-full blur-2xl pointer-events-none" />
              
              <div className="flex justify-end">
                <button 
                  onClick={() => setShowBeerModal(false)}
                  className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors relative z-10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex justify-center mb-4 relative z-10">
                <div className="w-20 h-20 bg-amber-100 dark:bg-amber-500/20 rounded-full flex items-center justify-center shadow-inner">
                  <Beer className="w-10 h-10 text-amber-500" />
                </div>
              </div>
              
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-2 relative z-10">{t('supportTitle')}</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed relative z-10">
                {t('supportText')}
              </p>
              
              <div className="space-y-3 relative z-10">
                <a
                  href="https://revolut.me/rui3aqa"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-[#1c1c1c] dark:bg-white text-white dark:text-black font-bold py-3.5 px-4 rounded-2xl flex items-center justify-center gap-3 transition-transform hover:scale-[1.02] shadow-md"
                >
                  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.55 3.39L13.78 12h3.43l3.65-8.61h-3.31zM11.66 3.39H4.34v17.22h3.81V12h3.51l4.47 8.61h4.15L15.34 12c1.99-.44 3.29-2.02 3.29-4.31 0-2.85-2.05-4.3-5.28-4.3h-1.69zM8.15 9.17V6.2h3.29c1.07 0 1.76.5 1.76 1.48 0 .99-.69 1.49-1.76 1.49H8.15z"/>
                  </svg>
                  {t('revolut')}
                </a>

                <button
                  onClick={() => {
                    const url = 'https://maps2waze-pt.ai.studio';
                    if (navigator.share) {
                      navigator.share({
                        title: 'Maps2Waze',
                        text: t('shareAppText'),
                        url: url
                      }).catch(() => {});
                    } else {
                          navigator.clipboard.writeText(url);
                          alert(t('linkCopied'));
                    }
                  }}
                  className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3.5 px-4 rounded-2xl flex items-center justify-center gap-3 transition-transform hover:scale-[1.02] shadow-md"
                >
                  <Share2 className="w-5 h-5" />
                  {t('shareApp')}
                </button>

                <a
                  href="mailto:riumeira@gmail.com?subject=Sugestão para o Maps2Waze"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold py-3.5 px-4 rounded-2xl flex items-center justify-center gap-3 transition-transform hover:scale-[1.02]"
                >
                  <Mail className="w-5 h-5" />
                  {t('sendSuggestion')}
                </a>
              </div>
              
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

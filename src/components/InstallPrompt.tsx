import React, { useState, useEffect } from 'react';
import { Download, X, Share } from 'lucide-react';
import { useStorage } from '../utils/storage';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showPrompt, setShowPrompt] = useState(true);

  useEffect(() => {
    // Check if already installed / standalone
    const isStandAloneMatch = window.matchMedia('(display-mode: standalone)').matches;
    const nav: any = window.navigator;
    const isIOSStandAlone = nav.standalone === true;
    
    if (isStandAloneMatch || isIOSStandAlone) {
      setIsStandalone(true);
      return;
    }

    // Check if iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    }
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
  };

  if (isStandalone || !showPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 animate-in fade-in slide-in-from-bottom-8 duration-500">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl dark:shadow-cyan-900/20 rounded-2xl p-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-3">
          <button 
            onClick={handleDismiss}
            className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-cyan-100 dark:bg-cyan-500/20 rounded-xl flex items-center justify-center text-cyan-600 dark:text-cyan-400 shrink-0">
            <Download className="w-6 h-6" />
          </div>
          <div className="flex-1 pr-6">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Instalar aplicação</h3>
            {isIOS ? (
              <div className="text-xs text-slate-600 dark:text-slate-400">
                <p className="mb-2">Para instalar no seu iPhone ou iPad:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Toque no botão <Share className="w-3 h-3 inline mx-1" /> Partilhar</li>
                  <li>Selecione <span className="font-bold text-slate-800 dark:text-slate-300">"Adicionar ao ecrã principal"</span></li>
                </ol>
              </div>
            ) : (
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">
                Instale o Maps2Waze para acesso rápido e offline diretamente a partir do ecrã principal.
              </p>
            )}
            
            {!isIOS && deferredPrompt && (
              <button
                onClick={handleInstallClick}
                className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-4 rounded-xl text-xs uppercase tracking-widest transition-colors mt-2"
              >
                Instalar agora
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

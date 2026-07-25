import React from 'react';

export function Help() {
  return (
    <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 flex flex-col shadow-xl">
      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6 text-center">Ajuda / Instruções</h3>
      
      <div className="flex flex-col gap-4">
        <a 
          href="https://youtube.com/shorts/uUaNTYSiNSI?feature=share" 
          target="_blank" 
          rel="noopener noreferrer"
          className="bg-slate-50 dark:bg-slate-950 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center gap-4 hover:border-cyan-400 dark:hover:border-cyan-500 transition-colors group shadow-inner"
        >
          <svg className="w-12 h-12 text-slate-700 dark:text-slate-300 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors" viewBox="0 0 384 512" fill="currentColor">
            <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/>
          </svg>
          <span className="text-sm font-bold uppercase tracking-widest text-slate-900 dark:text-slate-200">Apple (iPhone)</span>
        </a>

        <a 
          href="https://youtube.com/shorts/8Nimj-Kalr8?feature=share" 
          target="_blank" 
          rel="noopener noreferrer"
          className="bg-slate-50 dark:bg-slate-950 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center gap-4 hover:border-emerald-400 dark:hover:border-emerald-500 transition-colors group shadow-inner"
        >
          <svg className="w-12 h-12 text-slate-700 dark:text-slate-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors" viewBox="0 0 512 512" fill="currentColor">
            <path d="M325.3 234.3c-15 0-27-12-27-27s12-27 27-27 27 12 27 27-12 27-27 27zm-138.7 0c-15 0-27-12-27-27s12-27 27-27 27 12 27 27-12 27-27 27zm233-102l44.3-76.7c3.4-5.9 1.4-13.4-4.5-16.9-5.9-3.4-13.4-1.4-16.9 4.5l-45.3 78.4c-41.6-18.7-88.1-29.2-137.2-29.2-49 0-95.6 10.5-137.2 29.2L77.4 43.1c-3.4-5.9-10.9-7.9-16.9-4.5-5.9 3.4-7.9 10.9-4.5 16.9l44.3 76.7C39.1 176 0 252 0 341.3h512c0-89.3-39.1-165.3-100.4-209z"/>
          </svg>
          <span className="text-sm font-bold uppercase tracking-widest text-slate-900 dark:text-slate-200">Android</span>
        </a>

        <div className="bg-slate-50 dark:bg-slate-950 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center gap-2 shadow-inner text-center">
          <div className="text-cyan-600 dark:text-cyan-400 font-bold text-xs uppercase tracking-widest">
            Sem necessidade de Chave API
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Esta versão extrai coordenadas e moradas diretamente dos links do Google Maps e utiliza geocodificação aberta gratuita (OpenStreetMap), tornando a aplicação 100% autónoma.
          </p>
        </div>
      </div>
    </div>
  );
}

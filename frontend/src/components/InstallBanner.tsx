import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useInstall } from '../context/InstallContext';
import { X, Download } from 'lucide-react';

const InstallBanner: React.FC = () => {
  const { deferredPrompt, setDeferredPrompt, showInstallBanner, setShowInstallBanner } = useInstall();

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log('User response to the install prompt:', outcome);
    setDeferredPrompt(null);
    setShowInstallBanner(false);
    localStorage.setItem('install_dismissed', 'true');
  };

  const handleDismiss = () => {
    setShowInstallBanner(false);
    localStorage.setItem('install_dismissed', 'true');
  };

  useEffect(() => {
    if (localStorage.getItem('install_dismissed') === 'true') {
      setShowInstallBanner(false);
    }
    if (!('serviceWorker' in navigator) || !('BeforeInstallPromptEvent' in window)) {
      setShowInstallBanner(false);
    }
  }, [showInstallBanner]);

  if (!showInstallBanner || localStorage.getItem('install_dismissed') === 'true') return null;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        className="fixed bottom-6 left-4 right-4 z-[90] bg-black text-white rounded-2xl shadow-2xl shadow-black/40 overflow-hidden"
      >
        <div className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-jungle rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-jungle/40">
            <Download size={24} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-black tracking-tight mb-0.5">Install Jungle Chama</h4>
            <p className="text-xs text-white/60 font-medium">Add the app to your home screen for quick access to your savings.</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={handleDismiss} className="p-2 text-white/40 hover:text-white transition-colors" aria-label="Dismiss">
              <X size={18} />
            </button>
            <button onClick={handleInstall} className="px-5 py-2.5 bg-jungle text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-jungle-dark transition-all shadow-lg shadow-jungle/30">
              Install
            </button>
          </div>
        </div>
        <div className="h-1.5 bg-jungle/30">
          <div className="h-full bg-jungle w-0 animate-install-progress" style={{ animationDuration: '15s' }}></div>
        </div>
      </motion.div>
    </>
  );
};

export default InstallBanner;
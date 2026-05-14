import React, { createContext, useContext, useState, useEffect } from 'react';

interface InstallContextType {
  deferredPrompt: any;
  setDeferredPrompt: (prompt: any) => void;
  showInstallBanner: boolean;
  setShowInstallBanner: (show: boolean) => void;
}

const InstallContext = createContext<InstallContextType | undefined>(undefined);

export const InstallProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  return (
    <InstallContext.Provider value={{ deferredPrompt, setDeferredPrompt, showInstallBanner, setShowInstallBanner }}>
      {children}
    </InstallContext.Provider>
  );
};

export const useInstall = () => {
  const context = useContext(InstallContext);
  if (context === undefined) {
    throw new Error('useInstall must be used within an InstallProvider');
  }
  return context;
};
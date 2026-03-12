import React, { useState, useEffect } from 'react';

const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showButton, setShowButton] = useState(true);

  useEffect(() => {
    // Check if already installed - hide button completely
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    if (isStandalone || window.navigator.standalone) {
      console.log('✅ App is already installed');
      setShowButton(false);
      return;
    }

    // Listen for beforeinstallprompt
    const handleBeforeInstallPrompt = (e) => {
      console.log('📲 beforeinstallprompt event fired!', e);
      e.preventDefault();
      setDeferredPrompt(e);
      setShowButton(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for app installed - hide button immediately
    const handleAppInstalled = () => {
      console.log('✅ App was installed');
      setDeferredPrompt(null);
      setShowButton(false);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    console.log('Install button clicked');
    
    if (!deferredPrompt) {
      console.log('No deferred prompt available');
      
      // Show instructions
      alert(
        'To install this app:\n\n' +
        '1. Click the browser menu (⋮) in the top-right\n' +
        '2. Select "Install App" or "Add to Home screen"'
      );
      return;
    }

    try {
      // Show the install prompt
      console.log('Showing install prompt...');
      await deferredPrompt.prompt();
      
      const { outcome } = await deferredPrompt.userChoice;
      console.log('User choice:', outcome);
      
      if (outcome === 'accepted') {
        console.log('User accepted install');
        setDeferredPrompt(null);
        setShowButton(false); // Hide button immediately after install
      }
    } catch (error) {
      console.error('Install prompt error:', error);
      alert('Install prompt failed. Try using the browser menu to install.');
    }
  };

  // Don't show button if we shouldn't show it
  if (!showButton) return null;

  return (
    <button
      onClick={handleInstallClick}
      className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 bg-green-600 hover:bg-green-700 text-white px-3 py-2 sm:px-4 sm:py-2.5 rounded-full shadow-lg transition-all z-50 flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm"
    >
      <span className="text-base sm:text-lg">📱</span>
      <span className="font-medium">Install</span>
    </button>
  );
};

export default InstallPrompt;
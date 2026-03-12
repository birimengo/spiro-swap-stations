import React, { useState, useEffect } from 'react';

const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showButton, setShowButton] = useState(false); // Start with false, show only when prompt is ready

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
      setShowButton(true); // Show button only when prompt is ready
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for app installed - hide button immediately
    const handleAppInstalled = () => {
      console.log('✅ App was installed');
      setDeferredPrompt(null);
      setShowButton(false);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    // Check if the browser supports PWA installation
    const isPWAInstallable = 'onbeforeinstallprompt' in window;
    console.log('📱 PWA installable:', isPWAInstallable);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    console.log('Install button clicked');
    
    if (!deferredPrompt) {
      console.log('No deferred prompt available - trying to trigger manually');
      
      // Try to trigger the prompt manually for browsers that support it
      if ('onbeforeinstallprompt' in window) {
        // Some browsers might need a page reload to trigger the prompt
        console.log('Waiting for beforeinstallprompt event...');
        
        // Show a message that installation is preparing
        alert('Preparing installation... Please click Install again in a moment.');
        
        // Force a re-check for the prompt
        setTimeout(() => {
          if (!deferredPrompt) {
            // If still no prompt, show browser instructions
            alert(
              'To install this app:\n\n' +
              'Chrome/Edge/Brave:\n' +
              'Click the menu (⋮) → "Install App" or "Add to Home screen"\n\n' +
              'Safari (iPhone/iPad):\n' +
              'Share button (📤) → "Add to Home Screen"'
            );
          }
        }, 3000);
      } else {
        // Browser doesn't support PWA installation
        alert(
          'To install this app:\n\n' +
          'Chrome/Edge/Brave:\n' +
          'Click the menu (⋮) → "Install App" or "Add to Home screen"\n\n' +
          'Safari (iPhone/iPad):\n' +
          'Share button (📤) → "Add to Home Screen"'
        );
      }
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
      
      // Fallback instructions
      alert(
        'Install prompt failed. Please use browser menu:\n\n' +
        'Chrome/Edge/Brave:\n' +
        'Click the menu (⋮) → "Install App"\n\n' +
        'Safari (iPhone/iPad):\n' +
        'Share button (📤) → "Add to Home Screen"'
      );
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
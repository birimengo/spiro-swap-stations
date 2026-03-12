import React, { useState, useEffect } from 'react';

const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [debugInfo, setDebugInfo] = useState('Initializing...');

  useEffect(() => {
    // Check if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    if (isStandalone || window.navigator.standalone) {
      console.log('✅ App is already installed');
      setIsInstalled(true);
      setDebugInfo('App installed');
      return;
    }

    setDebugInfo('Checking PWA status...');

    // Listen for beforeinstallprompt
    const handleBeforeInstallPrompt = (e) => {
      console.log('📲 beforeinstallprompt event fired!', e);
      e.preventDefault();
      setDeferredPrompt(e);
      setDebugInfo('Install ready! Click button');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for app installed
    const handleAppInstalled = () => {
      console.log('✅ App was installed');
      setDeferredPrompt(null);
      setIsInstalled(true);
      setDebugInfo('Installed');
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    // Check service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then(reg => {
        if (reg) {
          console.log('✅ Service Worker registered');
          setDebugInfo(prev => prev + ' | SW OK');
        } else {
          console.log('❌ No Service Worker');
          setDebugInfo(prev => prev + ' | No SW');
        }
      });
    }

    // Check manifest
    fetch('/manifest.json')
      .then(res => {
        if (res.ok) {
          console.log('✅ Manifest found');
          setDebugInfo(prev => prev + ' | Manifest OK');
        } else {
          console.log('❌ Manifest not found');
          setDebugInfo(prev => prev + ' | No manifest');
        }
      })
      .catch(err => {
        console.log('❌ Manifest error:', err);
      });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    console.log('Install button clicked');
    
    if (!deferredPrompt) {
      console.log('No deferred prompt available');
      
      // Try to trigger it manually
      const event = new Event('beforeinstallprompt');
      window.dispatchEvent(event);
      
      // Show instructions
      alert(
        'To install this app:\n\n' +
        '1. Click the browser menu (⋮) in the top-right\n' +
        '2. Select "Install App" or "Add to Home screen"\n\n' +
        'If you don\'t see this option, make sure you have icons in the public/icons/ folder'
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
      }
    } catch (error) {
      console.error('Install prompt error:', error);
      alert('Install prompt failed. Try using the browser menu to install.');
    }
  };

  // Don't show if already installed
  if (isInstalled) {
    return (
      <div className="fixed bottom-4 right-4 bg-green-100 text-green-800 px-4 py-2 rounded-lg shadow-lg text-sm z-50">
        ✅ App Installed
      </div>
    );
  }

  return (
    <>
      {/* Debug info */}
      <div className="fixed top-16 left-4 bg-black text-white px-3 py-2 rounded text-xs z-50 opacity-90">
        📱 {debugInfo}
      </div>

      {/* Install Button */}
      <button
        onClick={handleInstallClick}
        className="fixed bottom-6 right-6 bg-green-600 hover:bg-green-700 text-white px-6 py-4 rounded-full shadow-2xl transition-all z-50 flex items-center gap-3"
      >
        <span className="text-2xl">📱</span>
        <div className="flex flex-col items-start">
          <span className="font-bold text-base">Install App</span>
          <span className="text-xs opacity-90">Add to home screen</span>
        </div>
      </button>
    </>
  );
};

export default InstallPrompt;
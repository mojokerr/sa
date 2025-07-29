'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { X, Download, Smartphone } from 'lucide-react';
import { toast } from 'sonner';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function PWAInstaller() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Register Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered:', registration);
          
          // Check for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  toast.success('تحديث جديد متاح!', {
                    action: {
                      label: 'إعادة تحميل',
                      onClick: () => window.location.reload(),
                    },
                  });
                }
              });
            }
          });
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });
    }

    // Detect iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Check if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isInAppBrowser = (window.navigator as any).standalone;
    setIsInstalled(isStandalone || isInAppBrowser);

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for appinstalled event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
      toast.success('تم تثبيت التطبيق بنجاح!');
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        toast.success('جاري تثبيت التطبيق...');
      } else {
        toast.info('تم إلغاء التثبيت');
      }
      
      setDeferredPrompt(null);
      setShowInstallPrompt(false);
    } catch (error) {
      console.error('Install failed:', error);
      toast.error('فشل في تثبيت التطبيق');
    }
  };

  // Don't show if already installed
  if (isInstalled) return null;

  // iOS Install Instructions
  if (isIOS && !showInstallPrompt) {
    return (
      <Card className="fixed bottom-4 left-4 right-4 z-50 border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3 rtl:space-x-reverse">
            <Smartphone className="h-6 w-6 text-blue-600 mt-1" />
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                ثبت التطبيق على جهازك
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                اضغط على زر المشاركة في Safari ثم "أضف إلى الشاشة الرئيسية"
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowInstallPrompt(false)}
              className="text-blue-600 hover:text-blue-800"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // PWA Install Prompt
  if (showInstallPrompt && deferredPrompt) {
    return (
      <Card className="fixed bottom-4 left-4 right-4 z-50 border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3 rtl:space-x-reverse">
            <Download className="h-6 w-6 text-green-600 mt-1" />
            <div className="flex-1">
              <h3 className="font-semibold text-green-900 dark:text-green-100">
                ثبت BoostGram AI
              </h3>
              <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                احصل على تجربة أفضل مع التطبيق المثبت
              </p>
              <div className="flex space-x-2 rtl:space-x-reverse mt-3">
                <Button
                  onClick={handleInstall}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  تثبيت
                </Button>
                <Button
                  onClick={() => setShowInstallPrompt(false)}
                  variant="outline"
                  size="sm"
                  className="border-green-300 text-green-700"
                >
                  لاحقاً
                </Button>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowInstallPrompt(false)}
              className="text-green-600 hover:text-green-800"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}

// Hook for PWA features
export function usePWA() {
  const [isOnline, setIsOnline] = useState(true);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check online status
    setIsOnline(navigator.onLine);
    
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check if installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isInAppBrowser = (window.navigator as any).standalone;
    setIsInstalled(isStandalone || isInAppBrowser);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  };

  const showNotification = (title: string, options?: NotificationOptions) => {
    if ('serviceWorker' in navigator && 'Notification' in window) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification(title, {
          icon: '/icon-192x192.png',
          badge: '/badge-72x72.png',
          ...options,
        });
      });
    }
  };

  return {
    isOnline,
    isInstalled,
    requestNotificationPermission,
    showNotification,
  };
}

import { useEffect, useState } from 'react'
import { Button } from '../ui/button'
import { Download, X } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    // Detect device type
    const userAgent = window.navigator.userAgent.toLowerCase()
    const ios = /iphone|ipad|ipod/.test(userAgent)
    
    setIsIOS(ios)

    // Check if app is already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    const isIOSStandalone = (window.navigator as any).standalone === true
    
    if (isStandalone || isIOSStandalone) {
      setIsInstalled(true)
      return
    }

    // Check if user previously dismissed the prompt
    const dismissed = localStorage.getItem('pwa-install-dismissed')
    if (dismissed === 'true') {
      return
    }

    // For iOS, show banner with manual instructions (Apple doesn't support programmatic install)
    if (ios && !isIOSStandalone) {
      setTimeout(() => {
        setShowInstallPrompt(true)
      }, 2000)
      return
    }

    // Listen for the beforeinstallprompt event (Android/Desktop Chrome)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault() // Prevent the default browser install prompt
      
      const installEvent = e as BeforeInstallPromptEvent
      setDeferredPrompt(installEvent)
      
      // Show custom install prompt after a short delay
      setTimeout(() => {
        setShowInstallPrompt(true)
      }, 2000)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // Listen for successful installation
    window.addEventListener('appinstalled', () => {
      setShowInstallPrompt(false)
      setIsInstalled(true)
      localStorage.removeItem('pwa-install-dismissed')
    })

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = async () => {
    if (isIOS || !deferredPrompt) {
      return
    }

    try {
      await deferredPrompt.prompt()
      await deferredPrompt.userChoice
      
      // Clear the prompt regardless of outcome
      setDeferredPrompt(null)
      setShowInstallPrompt(false)
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error showing install prompt:', error)
      }
    }
  }

  const handleDismiss = () => {
    setShowInstallPrompt(false)
    localStorage.setItem('pwa-install-dismissed', 'true')
    
    // Allow showing again after 7 days
    setTimeout(() => {
      localStorage.removeItem('pwa-install-dismissed')
    }, 7 * 24 * 60 * 60 * 1000)
  }

  // Don't show if already installed
  if (isInstalled) {
    return null
  }

  // For Android/Chrome: need the deferred prompt
  // For iOS: show regardless (manual instructions)
  if (!showInstallPrompt || (!isIOS && !deferredPrompt)) {
    return null
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md animate-in slide-in-from-bottom-5">
      <div className="rounded-lg border bg-gradient-to-r from-purple-600 to-indigo-600 p-4 shadow-lg">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 rounded-full bg-white/20 p-2">
            <Download className="h-5 w-5 text-white" />
          </div>
          
          <div className="flex-1">
            <h3 className="font-semibold text-white">Install Bookaroo Admin</h3>
            
            {isIOS ? (
              <p className="text-sm text-white/90 mt-1">
                Tap the Share button <span className="inline-block">↗️</span> then "Add to Home Screen"
              </p>
            ) : (
              <p className="text-sm text-white/90 mt-1">
                Install our app for quick access and offline functionality
              </p>
            )}
            
            {!isIOS && (
              <div className="flex gap-2 mt-3">
                <Button
                  size="sm"
                  onClick={handleInstallClick}
                  className="bg-white text-purple-600 hover:bg-white/90 flex-1"
                >
                  Install Now
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleDismiss}
                  className="text-white hover:bg-white/20"
                >
                  Not Now
                </Button>
              </div>
            )}
            
            {isIOS && (
              <div className="mt-3">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleDismiss}
                  className="w-full text-white hover:bg-white/20"
                >
                  Got it
                </Button>
              </div>
            )}
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 flex-shrink-0 text-white hover:bg-white/20"
            onClick={handleDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}


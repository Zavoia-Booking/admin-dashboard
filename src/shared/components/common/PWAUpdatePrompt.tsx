import { useRegisterSW } from 'virtual:pwa-register/react'
import { Button } from '../ui/button'
import { X } from 'lucide-react'
import { useEffect, useState } from 'react'

export function PWAUpdatePrompt() {
  const [isVisible, setIsVisible] = useState(false)
  
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      if (import.meta.env.DEV) {
        console.log('✅ Service Worker registered:', r)
      }
    },
    onRegisterError(error) {
      console.error('❌ Service Worker registration error:', error)
    },
  })

  useEffect(() => {
    if (offlineReady || needRefresh) {
      setIsVisible(true)
    }
  }, [offlineReady, needRefresh])

  const close = () => {
    setOfflineReady(false)
    setNeedRefresh(false)
    setIsVisible(false)
  }

  if (!isVisible) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md rounded-lg border bg-background p-4 shadow-lg animate-in slide-in-from-bottom-5">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          {offlineReady ? (
            <>
              <h3 className="font-semibold">App ready to work offline</h3>
              <p className="text-sm text-muted-foreground mt-1">
                You can now use this app without an internet connection.
              </p>
            </>
          ) : (
            <>
              <h3 className="font-semibold">Update available</h3>
              <p className="text-sm text-muted-foreground mt-1">
                A new version of the app is available. Reload to update.
              </p>
            </>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={close}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      {needRefresh && (
        <div className="flex gap-2 mt-3">
          <Button
            size="sm"
            onClick={() => updateServiceWorker(true)}
            className="flex-1"
          >
            Reload
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={close}
            className="flex-1"
          >
            Later
          </Button>
        </div>
      )}
      
      {offlineReady && (
        <Button
          size="sm"
          onClick={close}
          className="w-full mt-3"
        >
          Got it
        </Button>
      )}
    </div>
  )
}


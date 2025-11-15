import * as React from "react"
import { Building2 } from "lucide-react"
import { Skeleton } from "../ui/skeleton"

// Module-level cache to track loaded images across component instances
const loadedImagesCache = new Set<string>()

interface CompanyLogoProps {
  logoUrl?: string | null
  companyName?: string | null
  isLoading?: boolean
}

export const CompanyLogo = React.memo(function CompanyLogo({ 
  logoUrl, 
  companyName, 
  isLoading = false 
}: CompanyLogoProps) {
  const [imageError, setImageError] = React.useState(false)
  const imageRef = React.useRef<HTMLImageElement>(null)
  const previousLogoUrlRef = React.useRef<string | null | undefined>(undefined)
  // Use ref to track loaded state to persist across re-renders
  // Initialize from cache if available
  const imageLoadedRef = React.useRef(logoUrl ? loadedImagesCache.has(logoUrl) : false)
  const [, forceUpdate] = React.useReducer(x => x + 1, 0)

  // Check if image is already loaded/cached - only when logoUrl actually changes
  React.useLayoutEffect(() => {
    // Only reset state if logoUrl actually changed
    if (previousLogoUrlRef.current === logoUrl) {
      // Logo URL hasn't changed, preserve existing loaded state
      // Just verify the image is still loaded (in case of re-render)
      if (!imageLoadedRef.current && imageRef.current?.complete && imageRef.current?.naturalHeight !== 0) {
        imageLoadedRef.current = true
        if (logoUrl) {
          loadedImagesCache.add(logoUrl)
        }
        forceUpdate()
      }
      return
    }
    
    // Logo URL changed, check cache first
    if (logoUrl && loadedImagesCache.has(logoUrl)) {
      imageLoadedRef.current = true
      previousLogoUrlRef.current = logoUrl
      forceUpdate()
      return
    }
    
    // Logo URL changed and not in cache, reset state
    previousLogoUrlRef.current = logoUrl
    imageLoadedRef.current = false
    setImageError(false)
    
    if (!logoUrl) {
      return
    }
    
    // Check if image is already loaded (cached) - use setTimeout to ensure DOM is ready
    const checkImage = () => {
      if (imageRef.current?.complete && imageRef.current?.naturalHeight !== 0) {
        imageLoadedRef.current = true
        loadedImagesCache.add(logoUrl)
        forceUpdate()
      }
    }
    
    // Check immediately and also after a microtask to catch cases where ref isn't ready yet
    checkImage()
    setTimeout(checkImage, 0)
  }, [logoUrl])

  // Handle image load event
  const handleImageLoad = React.useCallback(() => {
    imageLoadedRef.current = true
    if (logoUrl) {
      loadedImagesCache.add(logoUrl)
    }
    forceUpdate()
  }, [logoUrl])

  // Handle image error event
  const handleImageError = React.useCallback(() => {
    setImageError(true)
    imageLoadedRef.current = false
  }, [])

  const shouldShowDefaultLogo = !logoUrl || imageError
  const displayName = companyName || "Bookaroo"

  // Show skeleton while loading
  if (isLoading) {
    return (
      <div className="flex items-center gap-3 p-4">
        <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
        <Skeleton className="h-5 w-32 flex-1" />
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3 p-4 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-2">
      <div className="relative h-10 w-10 flex-shrink-0 rounded-full bg-sidebar-accent flex items-center justify-center overflow-hidden">
        {shouldShowDefaultLogo ? (
          // Default logo with Building icon - shown when /me is done but no logo uploaded
          <Building2 className="h-6 w-6 text-sidebar-primary" />
        ) : (
          <>
            {/* Show skeleton only while image is loading for the first time */}
            {!imageLoadedRef.current && (
              <Skeleton className="absolute inset-0 rounded-full" />
            )}
            <img
              ref={imageRef}
              src={logoUrl}
              alt={`${displayName} logo`}
              className={`h-full w-full object-contain transition-opacity duration-200 ${
                imageLoadedRef.current ? 'opacity-100' : 'opacity-0'
              }`}
              onLoad={handleImageLoad}
              onError={handleImageError}
            />
          </>
        )}
      </div>
      
      {/* Company name - hidden when sidebar is collapsed */}
      {/* Shows "Bookaroo" if /me is done but wizard not completed (no company name) */}
      <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
        <p className="text-sm font-semibold text-sidebar-foreground truncate">
          {displayName}
        </p>
      </div>
    </div>
  )
})


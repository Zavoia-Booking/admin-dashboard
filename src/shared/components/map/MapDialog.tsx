import React, { useState } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import {
  Dialog,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogPortal,
  DialogOverlay,
} from '../ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '../ui/drawer';
import { MapView } from './MapView';
import AddressAutocomplete from '../address/AddressAutocomplete';
import type { AddressAutocompleteChange } from '../../types/geo';
import { AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useIsMobile } from '../../hooks/use-mobile';

export interface MapDialogProps {
  /**
   * Mapbox access token
   */
  accessToken: string;
  /**
   * Whether the dialog is open
   */
  isOpen: boolean;
  /**
   * Callback when dialog close is requested
   */
  onClose: () => void;
  /**
   * Title of the dialog
   */
  title?: string;
  /**
   * Description text below the title
   */
  description?: string;
  /**
   * Initial center coordinates [longitude, latitude]
   */
  center?: [number, number];
  /**
   * Initial zoom level (0-22)
   */
  zoom?: number;
  /**
   * Map style - Mapbox style URL or preset name
   */
  style?: string;
  /**
   * Height of the map in the dialog
   */
  mapHeight?: string;
  /**
   * Optional marker to display on the map
   */
  marker?: {
    coordinates: [number, number];
    color?: string;
    draggable?: boolean;
  };
  /**
   * Optional footer actions to display below the map
   */
  footerActions?: React.ReactNode;
  /**
   * Callback when marker is dragged to a new position
   */
  onMarkerDragEnd?: (coordinates: [number, number]) => void;
  /**
   * Callback when map is clicked (for click-to-place)
   */
  onMapClick?: (coordinates: [number, number]) => void;
  /**
   * Allow clicking on the map to move the marker
   */
  clickToPlace?: boolean;
  /**
   * Whether to show navigation controls (zoom, rotate)
   */
  showControls?: boolean;
  /**
   * Callback when map is loaded
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onMapLoad?: (map: any) => void;
  /**
   * Show search bar for address autocomplete
   */
  showSearch?: boolean;
  /**
   * Callback when an address is selected from autocomplete
   */
  onSearchSelect?: (coordinates: [number, number], suggestion: any) => void;
  /**
   * Show warning about pin position not updating address
   */
  showAddressWarning?: boolean;
  /**
   * Additional CSS classes for the dialog content
   */
  className?: string;
  /**
   * Additional CSS classes for the dialog overlay
   */
  overlayClassName?: string;
}

/**
 * Dialog component that displays a map using MapLibre GL JS
 * 
 * @example
 * ```tsx
 * <MapDialog
 *   isOpen={isMapOpen}
 *   onClose={() => setIsMapOpen(false)}
 *   title="Location Map"
 *   description="View the location on the map"
 *   accessToken="your-mapbox-access-token"
 *   center={[-0.1276, 51.5074]}
 *   zoom={14}
 *   marker={{ coordinates: [-0.1276, 51.5074] }}
 * />
 * ```
 */
export const MapDialog: React.FC<MapDialogProps> = ({
  isOpen,
  onClose,
  title = 'Map',
  description,
  footerActions,
  onMarkerDragEnd,
  onMapClick,
  showSearch = false,
  onSearchSelect,
  showAddressWarning = false,
  className,
  overlayClassName,
  ...mapProps
}) => {
  const [searchValue, setSearchValue] = useState('');
  const isMobile = useIsMobile();

  const handleAddressSelect = (change: AddressAutocompleteChange) => {
    if (change.suggestion && onSearchSelect) {
      const suggestion = change.suggestion as any;
      const lat = Number(suggestion.lat);
      const lng = Number(suggestion.lng || suggestion.lon);
      
      if (!isNaN(lat) && !isNaN(lng)) {
        // Pass coordinates and the full suggestion data
        onSearchSelect([lng, lat], suggestion);
      }
    }
    setSearchValue(change.address);
  };

  // Map component (reusable)
  const mapElement = (
    <div className={cn(isMobile ? "mt-0" : "mt-4", "focus:outline-none focus-visible:outline-none border-0 outline-none")}>
      <MapView
        {...mapProps}
        width="100%"
        zoom={17}
        onMarkerDragEnd={onMarkerDragEnd}
        onMapClick={onMapClick}
      />
    </div>
  );

  // Search component (reusable)
  const searchElement = showSearch && onSearchSelect && (
    <div className="mt-4">
      <AddressAutocomplete
        value={searchValue}
        onChange={handleAddressSelect}
        placeholder="Search for the correct address..."
        countryCodes={['ro', 'gb', 'us', 'fr', 'de', 'it', 'es']}
        limit={8}
      />
    </div>
  );

  // Info card component (reusable)
  const infoCardElement = showAddressWarning && (
    <div className="mt-4 flex items-start gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
      <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
      <div className="flex-1 text-sm">
        <p className="font-medium text-blue-900 dark:text-foreground-1 mb-1">
          Confirm Pin Location
        </p>
        <p className="text-blue-800 dark:text-foreground-2">
          We've attempted to place the pin based on your address. If it's correct, simply click "Confirm Location". 
          If not, you can search for the correct address, click on the map, or drag the pin to adjust. 
          <strong className="text-blue-900 dark:text-foreground-1"> Customers will find your business based on the pin location.</strong>
        </p>
      </div>
    </div>
  );

  // Footer actions component (reusable)
  const footerElement = footerActions && (
    <div className="mt-4 flex flex-col sm:flex-row justify-end gap-3">
      {footerActions}
    </div>
  );

  // Desktop content: search, info, map, footer
  const desktopContentElement = (
    <>
      {searchElement}
      {infoCardElement}
      {mapElement}
      {footerElement}
    </>
  );

  // Mobile content: map, search, info, footer
  const mobileContentElement = (
    <>
      {mapElement}
      {searchElement}
      {infoCardElement}
      {footerElement}
    </>
  );

  // Use Drawer on mobile, Dialog on desktop
  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={onClose}>
        <DrawerContent className={cn("max-h-[95vh] bg-white dark:bg-surface border-border focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0", className)} overlayClassName={overlayClassName}>
          <DrawerHeader className="text-left">
            <DrawerTitle className="text-foreground-1">{title}</DrawerTitle>
            {description && (
              <DrawerDescription className="text-foreground-3 dark:text-foreground-2">{description}</DrawerDescription>
            )}
          </DrawerHeader>
          <div className="overflow-y-auto px-4 pb-4">
            {mobileContentElement}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogPortal data-slot="dialog-portal">
        <DialogOverlay className={overlayClassName} />
        <DialogPrimitive.Content
          data-slot="dialog-content"
          className={cn(
            "bg-white dark:bg-surface data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-2xl border border-border p-6 shadow-lg hover:border-border-strong duration-200 sm:max-w-lg",
            "max-w-4xl",
            "focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0",
            className
          )}
        >
          <DialogHeader>
            <DialogTitle className="text-foreground-1">{title}</DialogTitle>
            <DialogDescription className={cn(
              !description && "sr-only",
              "text-foreground-3 dark:text-foreground-2"
            )}>
              {description || title}
            </DialogDescription>
          </DialogHeader>
          
          {desktopContentElement}
          
          <DialogPrimitive.Close className="flex items-center !min-h-0 !h-9 !min-w-0 !w-9 justify-center ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4">
            <X className="!h-5 !w-5" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
};


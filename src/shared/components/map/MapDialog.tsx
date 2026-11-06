import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
import { BaseSlider } from '../common/BaseSlider';
import { MapView } from './MapView';
import AddressAutocomplete from '../address/AddressAutocomplete';
import type { AddressAutocompleteChange } from '../../types/geo';
import { AlertCircle, Info } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useIsMobile } from '../../hooks/use-mobile';
import { useKeyboardVisible } from '../../hooks/useKeyboardVisible';

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
   * Callback when the map fails to initialize (e.g. WebGL unavailable).
   */
  onMapError?: (error: Error) => void;
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
  /**
   * ISO country codes to restrict address search (e.g., ['ro', 'de'])
   */
  countryCodes?: string[];
}

/**
 * Dialog component that displays a map using Mapbox GL JS.
 *
 * Desktop: a centered dialog with search, the address note, a map with a
 * draggable marker, and the footer actions.
 *
 * Mobile: a full-screen panel. Search sits on top and its results fill the map
 * area (so the keyboard can't cover them); the pin is fixed at the map's
 * center and the user moves the map under it (a tap eases that spot to the
 * center). Moves report through onMarkerDragEnd, taps through onMapClick, so
 * callers handle both layouts the same way.
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
  countryCodes,
  onMapError,
  mapHeight = '280px',
  ...mapProps
}) => {
  const { t } = useTranslation(['locations', 'common']);
  const [searchValue, setSearchValue] = useState('');
  const isMobile = useIsMobile();
  // Mobile: the hint under the map gives its room to the results while typing.
  const keyboardVisible = useKeyboardVisible();
  // Mobile: the map area, which the search results fill while searching.
  const [mapArea, setMapArea] = useState<HTMLDivElement | null>(null);
  // Mobile: a pin placed by a search pick or a tap when the caller had no
  // coordinates to start from (its `marker` is then undefined). Reset on close.
  const [pinPlaced, setPinPlaced] = useState(false);
  const [wasOpen, setWasOpen] = useState(isOpen);
  if (isOpen !== wasOpen) {
    setWasOpen(isOpen);
    if (!isOpen) setPinPlaced(false);
  }

  const handleAddressSelect = (change: AddressAutocompleteChange) => {
    if (change.suggestion && onSearchSelect) {
      const suggestion = change.suggestion as any;
      const lat = Number(suggestion.lat);
      const lng = Number(suggestion.lng || suggestion.lon);

      if (!isNaN(lat) && !isNaN(lng)) {
        // Pass coordinates and the full suggestion data
        setPinPlaced(true);
        onSearchSelect([lng, lat], suggestion);
      }
    }
    setSearchValue(change.address);
  };

  // Map component (desktop). data-vaul-no-drag keeps panning the map and
  // dragging the pin from being read as a drag on a surrounding drawer. The
  // requested height is capped so the dialog still fits short laptop screens.
  const mapElement = (
    <div
      data-vaul-no-drag=""
      className="mt-4 focus:outline-none focus-visible:outline-none border-0 outline-none"
    >
      <MapView
        {...mapProps}
        height={`min(${mapHeight}, 55vh)`}
        width="100%"
        onMarkerDragEnd={onMarkerDragEnd}
        onMapClick={onMapClick}
        onError={onMapError}
      />
    </div>
  );

  // Search component (reusable)
  const searchElement = showSearch && onSearchSelect && (
    <div className="mt-4">
      <AddressAutocomplete
        value={searchValue}
        onChange={handleAddressSelect}
        placeholder={t('locations:mapDialogShared.searchPlaceholder')}
        limit={8}
        countryCodes={countryCodes}
      />
    </div>
  );

  // Info card component (reusable)
  const infoCardElement = showAddressWarning && (
    <div className="mt-4 flex items-start gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
      <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
      <div className="flex-1 text-sm">
        <p className="font-medium text-blue-900 dark:text-foreground-1 mb-1">
          {t('locations:mapDialogShared.addressWarningTitle')}
        </p>
        <p className="text-blue-800 dark:text-foreground-2">
          {t('locations:mapDialogShared.addressWarningDescription')}
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

  // Mobile: full-screen panel (BaseSlider: back button, footer hidden while the
  // keyboard is up, iOS keyboard inset). Search on top, the map fills the rest.
  if (isMobile) {
    const pinVisible = !!mapProps.marker || pinPlaced;
    const handleMapTap = (coordinates: [number, number]) => {
      setPinPlaced(true);
      onMapClick?.(coordinates);
    };

    return (
      <BaseSlider
        isOpen={isOpen}
        onClose={onClose}
        title={title}
        panelClassName={className}
        backdropClassName={overlayClassName}
        // Edge-to-edge map: no body padding or scroll; the body's inner wrapper
        // becomes a column so the map can take the remaining height.
        contentClassName="!p-0 !overflow-hidden [&>div]:flex [&>div]:min-h-0 [&>div]:flex-col"
        footer={footerActions && (
          <div className="flex gap-2 pt-3 [&>*]:h-11 [&>*]:flex-1">{footerActions}</div>
        )}
      >
        {showSearch && onSearchSelect && (
          <div className="shrink-0 px-3 pb-3">
            <AddressAutocomplete
              value={searchValue}
              onChange={handleAddressSelect}
              placeholder={t('locations:mapDialogShared.searchPlaceholder')}
              limit={8}
              countryCodes={countryCodes}
              listContainer={mapArea}
              blurOnSelect
            />
          </div>
        )}
        {/* data-vaul-no-drag: a pan here moves the map, never the panel. */}
        <div ref={setMapArea} data-vaul-no-drag="" className="relative min-h-0 flex-1">
          <MapView
            {...mapProps}
            height="100%"
            width="100%"
            className="!rounded-none"
            centerPinMode
            showCenterPin={pinVisible}
            pinColor={mapProps.marker?.color}
            onCenterChange={onMarkerDragEnd}
            onMapClick={handleMapTap}
            onError={onMapError}
          />
        </div>
        {showAddressWarning && !keyboardVisible && (
          <div className="flex shrink-0 items-start gap-2 px-4 pt-3 text-xs leading-relaxed text-foreground-2">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-foreground-3" aria-hidden />
            <span>
              {pinVisible
                ? t('locations:mapDialogShared.mobileHint')
                : t('locations:mapDialogShared.mobileSearchFirst')}
            </span>
          </div>
        )}
      </BaseSlider>
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
          
          <DialogPrimitive.Close className="flex items-center !min-h-0 !h-9 !min-w-0 !w-9 justify-center ring-offset-background focus-visible:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus-visible:ring-2 focus-visible:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4">
            <X className="!h-5 !w-5" />
            <span className="sr-only">{t('common:close')}</span>
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
};


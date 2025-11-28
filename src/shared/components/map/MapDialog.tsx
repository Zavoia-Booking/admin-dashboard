import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { MapView } from './MapView';
import type { MapViewProps } from './MapView';
import AddressAutocomplete from '../address/AddressAutocomplete';
import type { AddressAutocompleteChange } from '../../types/geo';
import { AlertCircle } from 'lucide-react';

export interface MapDialogProps extends Omit<MapViewProps, 'height' | 'width' | 'onMarkerDragEnd' | 'onMapClick'> {
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
   * Height of the map in the dialog
   */
  mapHeight?: string;
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
 *   apiKey="your-maptiler-api-key"
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
  mapHeight = '500px',
  footerActions,
  onMarkerDragEnd,
  onMapClick,
  showSearch = false,
  onSearchSelect,
  showAddressWarning = false,
  ...mapProps
}) => {
  const [searchValue, setSearchValue] = useState('');

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && (
            <DialogDescription>{description}</DialogDescription>
          )}
        </DialogHeader>
        
        {/* Address search using LocationIQ */}
        {showSearch && onSearchSelect && (
          <div className="mt-4">
            <AddressAutocomplete
              value={searchValue}
              onChange={handleAddressSelect}
              placeholder="Search for the correct address..."
              countryCodes={['ro', 'gb', 'us', 'fr', 'de', 'it', 'es']} // Add more countries as needed
              limit={5}
            />
          </div>
        )}
        
        {/* Info about address and pin placement */}
        {showAddressWarning && (
          <div className="mt-4 flex items-start gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50">
            <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-500 shrink-0 mt-0.5" />
            <div className="flex-1 text-sm">
              <p className="font-medium text-blue-900 dark:text-blue-200 mb-1">
                Confirm Pin Location
              </p>
              <p className="text-blue-800 dark:text-blue-300">
                We've attempted to place the pin based on your address. If it's correct, simply click "Confirm Location". 
                If not, you can search for the correct address, click on the map, or drag the pin to adjust. 
                <strong> Customers will find your business based on the pin location.</strong>
              </p>
            </div>
          </div>
        )}
        
        <div className="mt-4">
          <MapView
            {...mapProps}
            height={mapHeight}
            width="100%"
            onMarkerDragEnd={onMarkerDragEnd}
            onMapClick={onMapClick}
          />
        </div>
        {footerActions && (
          <div className="mt-4 flex justify-end gap-3">
            {footerActions}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};


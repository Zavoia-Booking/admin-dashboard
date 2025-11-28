import React, { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

export interface MapViewProps {
  /**
   * MapTiler API key
   */
  apiKey: string;
  /**
   * Initial center coordinates [longitude, latitude]
   */
  center?: [number, number];
  /**
   * Initial zoom level (0-22)
   */
  zoom?: number;
  /**
   * Map style - MapTiler style URL or custom style
   * Examples: 'streets-v2', 'satellite', 'hybrid', 'topo-v2', 'winter-v2'
   */
  style?: string;
  /**
   * Height of the map container
   */
  height?: string;
  /**
   * Width of the map container
   */
  width?: string;
  /**
   * Optional marker to display on the map
   */
  marker?: {
    coordinates: [number, number];
    color?: string;
    draggable?: boolean;
  };
  /**
   * Callback when marker is dragged to a new position
   */
  onMarkerDragEnd?: (coordinates: [number, number]) => void;
  /**
   * Allow clicking on the map to move the marker
   */
  clickToPlace?: boolean;
  /**
   * Callback when map is clicked (to place marker at new location)
   */
  onMapClick?: (coordinates: [number, number]) => void;
  /**
   * Whether to show navigation controls (zoom, rotate)
   */
  showControls?: boolean;
  /**
   * Callback when map is loaded
   */
  onMapLoad?: (map: maplibregl.Map) => void;
  /**
   * Additional CSS classes for the container
   */
  className?: string;
}

/**
 * Reusable Map component using MapLibre GL JS with MapTiler tiles
 * 
 * @example
 * ```tsx
 * <MapView
 *   apiKey="your-maptiler-api-key"
 *   center={[-0.1276, 51.5074]} // London
 *   zoom={12}
 *   style="streets-v2"
 *   marker={{ coordinates: [-0.1276, 51.5074], color: '#FF0000' }}
 *   showControls
 * />
 * ```
 */
export const MapView: React.FC<MapViewProps> = ({
  apiKey,
  center = [0, 0],
  zoom = 9,
  style = 'streets-v2',
  height = '400px',
  width = '100%',
  marker,
  showControls = true,
  onMapLoad,
  onMarkerDragEnd,
  clickToPlace = false,
  onMapClick,
  className = '',
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const initializedRef = useRef(false);
  
  // Capture initial values - these should not change after first render
  const initialValuesRef = useRef({
    apiKey,
    center,
    zoom,
    style,
    showControls,
    onMapLoad,
    clickToPlace,
    onMapClick
  });

  // Initialize map once
  useEffect(() => {
    if (!mapContainer.current || initializedRef.current) return;

    const { apiKey: initApiKey, center: initCenter, zoom: initZoom, style: initStyle, showControls: initShowControls, onMapLoad: initOnMapLoad, clickToPlace: initClickToPlace, onMapClick: initOnMapClick } = initialValuesRef.current;

    // Build MapTiler style URL
    const styleUrl = initStyle.startsWith('http') 
      ? initStyle 
      : `https://api.maptiler.com/maps/${initStyle}/style.json?key=${initApiKey}`;

    // Initialize map
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: styleUrl,
      center: initCenter,
      zoom: initZoom,
    });
    
    initializedRef.current = true;

    // Add navigation controls
    if (initShowControls) {
      map.current.addControl(
        new maplibregl.NavigationControl({
          visualizePitch: true,
        }),
        'top-right'
      );
    }

    // Call onMapLoad callback
    map.current.on('load', () => {
      if (map.current && initOnMapLoad) {
        initOnMapLoad(map.current);
      }
    });

    // Add click-to-place functionality
    if (initClickToPlace && initOnMapClick) {
      map.current.on('click', (e) => {
        const { lng, lat } = e.lngLat;
        initOnMapClick([lng, lat]);
      });
      
      // Change cursor to crosshair when click-to-place is enabled
      if (map.current.getCanvas()) {
        map.current.getCanvas().style.cursor = 'crosshair';
      }
    }

    // Cleanup only when component unmounts
    return () => {
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
      initializedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update marker separately
  useEffect(() => {
    if (!map.current || !marker) return;

    // Remove existing marker if it exists
    if (markerRef.current) {
      markerRef.current.remove();
    }

    // Add new marker
    markerRef.current = new maplibregl.Marker({
      color: marker.color || '#FF0000',
      draggable: marker.draggable || false,
    })
      .setLngLat(marker.coordinates)
      .addTo(map.current);

    // Add dragend event listener if marker is draggable
    if (marker.draggable && onMarkerDragEnd) {
      markerRef.current.on('dragend', () => {
        if (markerRef.current) {
          const lngLat = markerRef.current.getLngLat();
          onMarkerDragEnd([lngLat.lng, lngLat.lat]);
        }
      });
    }

    return () => {
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
    };
  }, [marker, onMarkerDragEnd]);

  return (
    <div
      ref={mapContainer}
      className={`rounded-lg overflow-hidden ${className}`}
      style={{ height, width }}
    />
  );
};


import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

export interface MapViewProps {
  /**
   * Mapbox access token
   */
  accessToken: string;
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
   * Examples: 'streets-v12', 'satellite-v9', 'satellite-streets-v12', 'outdoors-v12', 'light-v11', 'dark-v11'
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onMapLoad?: (map: any) => void;
  /**
   * Callback when the map fails to initialize (e.g. the browser/GPU can't
   * provide a WebGL context). Fired instead of the constructor throw bubbling
   * up and crashing the whole route.
   */
  onError?: (error: Error) => void;
  /**
   * Additional CSS classes for the container
   */
  className?: string;
}

/**
 * Reusable Map component using Mapbox GL JS
 * 
 * @example
 * ```tsx
 * <MapView
 *   accessToken="your-mapbox-access-token"
 *   center={[-0.1276, 51.5074]} // London
 *   zoom={12}
 *   style="streets-v12"
 *   marker={{ coordinates: [-0.1276, 51.5074], color: '#FF0000' }}
 *   showControls
 * />
 * ```
 */
export const MapView: React.FC<MapViewProps> = ({
  accessToken,
  center = [0, 0],
  zoom = 9,
  style = 'mapbox://styles/zavoia/cmphvlj8p002c01sgdl3q3kpb',
  height = '280px',
  width = '100%',
  marker,
  showControls = true,
  onMapLoad,
  onMarkerDragEnd,
  clickToPlace = false,
  onMapClick,
  onError,
  className = '',
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const initializedRef = useRef(false);
  const [hasError, setHasError] = useState(false);

  // Keep the latest onError callback reachable from the init effect (which
  // only runs once and captures its dependencies via a ref).
  const onErrorRef = useRef(onError);
  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);
  const reportError = (err: unknown) => {
    const error = err instanceof Error ? err : new Error('Failed to initialize map');
    setHasError(true);
    onErrorRef.current?.(error);
  };
  
  // Capture initial values - these should not change after first render
  const initialValuesRef = useRef({
    accessToken,
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

    const { accessToken: initToken, center: initCenter, zoom: initZoom, style: initStyle, showControls: initShowControls, onMapLoad: initOnMapLoad, clickToPlace: initClickToPlace, onMapClick: initOnMapClick } = initialValuesRef.current;

    // Set Mapbox access token
    mapboxgl.accessToken = initToken;

    // Build Mapbox style URL
    const styleUrl = initStyle.startsWith('mapbox://') || initStyle.startsWith('http') 
      ? initStyle 
      : `mapbox://styles/mapbox/${initStyle}`;

    // Initialize map. Mapbox throws synchronously ("Failed to initialize
    // WebGL") when the browser/GPU can't give it a WebGL context — catch it
    // so a headless/GPU-less environment can't take down the whole route.
    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: styleUrl,
        center: initCenter,
        zoom: initZoom,
      });
    } catch (err) {
      // Recording a one-time terminal init failure — not a cascading render.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      reportError(err);
      return;
    }

    initializedRef.current = true;

    // Async failures (e.g. WebGL context lost after creation) surface here.
    map.current.on('error', (e) => {
      const message = (e as { error?: { message?: string } })?.error?.message ?? '';
      if (/webgl|context/i.test(message)) {
        reportError((e as { error?: unknown })?.error ?? message);
      }
    });

    // Add navigation controls
    if (initShowControls) {
      map.current.addControl(
        new mapboxgl.NavigationControl({
          visualizePitch: true,
        }),
        'top-right'
      );
    }

    // Call onMapLoad callback and enforce our center/zoom (style JSON can override with its own center/zoom when it loads)
    map.current.on('load', () => {
      if (map.current) {
        map.current.setCenter(initCenter);
        map.current.setZoom(initZoom);
        if (initOnMapLoad) {
          initOnMapLoad(map.current);
        }
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

  // Update marker separately – add when map is ready so marker shows when opening from geocode (async)
  useEffect(() => {
    if (!map.current || !marker) return;

    const addMarker = () => {
      if (!map.current) return;
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
      markerRef.current = new mapboxgl.Marker({
        // Mapbox sets this color as an SVG fill attribute, which doesn't resolve
        // CSS variables — keep it as a literal hex matching --brand-accent.
        color: marker.color || '#C94A2A',
        draggable: marker.draggable || false,
      })
        .setLngLat(marker.coordinates)
        .addTo(map.current);

      if (marker.draggable && onMarkerDragEnd) {
        markerRef.current.on('dragend', () => {
          if (markerRef.current) {
            const lngLat = markerRef.current.getLngLat();
            onMarkerDragEnd([lngLat.lng, lngLat.lat]);
          }
        });
      }
    };

    if (map.current.isStyleLoaded && map.current.isStyleLoaded()) {
      addMarker();
    } else {
      map.current.once('load', addMarker);
    }

    return () => {
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
    };
  }, [marker, onMarkerDragEnd]);

  if (hasError) {
    return (
      <div
        className={`rounded-lg overflow-hidden flex items-center justify-center bg-surface-2 border border-border ${className}`}
        style={{ height, width }}
      >
        <span className="px-4 text-center text-sm text-foreground-3">
          The map couldn&apos;t be loaded on this device.
        </span>
      </div>
    );
  }

  return (
    <div
      ref={mapContainer}
      className={`rounded-lg overflow-hidden focus:outline-none focus-visible:outline-none border-0 outline-none [&_canvas]:outline-none [&_canvas]:border-0 ${className}`}
      style={{ height, width }}
      tabIndex={-1}
    />
  );
};

import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MapPin } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';

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
  // Skeleton stays up until the first 'idle' event — style, tiles and any
  // pending renders (marker included) are all done by then.
  const [isReady, setIsReady] = useState(false);

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

    // Reveal the map only once everything is drawn. 'idle' fires after 'load'
    // (where the marker is added), when all visible tiles have rendered — so
    // the user goes straight from skeleton to a finished map with the marker
    // on it. The timeout is a safety net for very slow tile servers: better a
    // partially-drawn map than a skeleton that never resolves.
    map.current.once('idle', () => setIsReady(true));
    const readyFallback = window.setTimeout(() => setIsReady(true), 15000);

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
      window.clearTimeout(readyFallback);
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
      className={`relative rounded-lg overflow-hidden ${className}`}
      style={{ height, width }}
    >
      <div
        ref={mapContainer}
        className="h-full w-full focus:outline-none focus-visible:outline-none border-0 outline-none [&_canvas]:outline-none [&_canvas]:border-0"
        tabIndex={-1}
      />
      {/* Ghost layout mirroring the loaded map: street strokes, center pin,
          nav controls top-right, Mapbox badge bottom-left, info bottom-right. */}
      <Skeleton
        aria-hidden
        className={`absolute inset-0 z-10 rounded-lg transition-opacity duration-500 ${
          isReady ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
      >
        <div className="absolute -left-[10%] top-[30%] h-3.5 w-[120%] -rotate-6 rounded-full bg-surface/50" />
        <div className="absolute -left-[10%] top-[70%] h-2.5 w-[120%] rotate-3 rounded-full bg-surface/35" />
        <div className="absolute -top-[10%] left-[63%] h-[120%] w-2.5 rotate-12 rounded-full bg-surface/35" />
        <div className="absolute inset-0 flex items-center justify-center">
          <MapPin className="h-8 w-8 text-foreground-3 opacity-50" />
        </div>
        {showControls && (
          <div className="absolute top-3 right-3 flex flex-col gap-px overflow-hidden rounded-lg shadow-sm">
            <div className="h-8 w-8 bg-surface/90" />
            <div className="h-8 w-8 bg-surface/90" />
            <div className="h-8 w-8 bg-surface/90" />
          </div>
        )}
        <div className="absolute bottom-2 left-2 h-5 w-20 rounded-full bg-surface/70" />
        <div className="absolute right-2 bottom-2 h-6 w-6 rounded-full bg-surface/70" />
      </Skeleton>
    </div>
  );
};

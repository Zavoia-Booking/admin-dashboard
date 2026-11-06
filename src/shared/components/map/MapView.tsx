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
   * Fixed center pin ("move the map, not the pin"), read once at mount. The
   * pin is drawn at the container's center and `marker` is ignored; the user
   * pans the map under it, a tap eases that point to the center (and reports
   * it through onMapClick when clickToPlace is on), rotation and pitch are off,
   * and zoom stays around the center so it never moves the pin's spot.
   */
  centerPinMode?: boolean;
  /** Center pin mode: whether the pin is shown (and pans are reported). */
  showCenterPin?: boolean;
  /** Center pin mode: the new center after the user moves the map. */
  onCenterChange?: (coordinates: [number, number]) => void;
  /** Center pin mode: pin color. */
  pinColor?: string;
  /**
   * Center pin mode: where the pin should be (the last search pick, tap or
   * reported pan). After any programmatic move or resize the map snaps its
   * center back here, so the pin never ends up off the point being saved.
   */
  pinTarget?: [number, number] | null;
  /**
   * Center pin mode: asked on every tap before it moves the pin; return true
   * to ignore the tap (e.g. the tap that only closes the keyboard).
   */
  shouldIgnoreTap?: () => boolean;
  /**
   * Additional CSS classes for the container
   */
  className?: string;
}

/** originalEvent types Mapbox attaches to moves that no finger made. */
const NON_GESTURE_EVENTS = new Set(['resize', 'orientationchange', 'fullscreenchange', 'webkitfullscreenchange']);

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
  centerPinMode = false,
  showCenterPin = false,
  onCenterChange,
  pinColor = '#C94A2A',
  pinTarget = null,
  shouldIgnoreTap,
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const initializedRef = useRef(false);
  const [hasError, setHasError] = useState(false);
  // Skeleton stays up until the first 'idle' event — style, tiles and any
  // pending renders (marker included) are all done by then.
  const [isReady, setIsReady] = useState(false);
  // Center pin mode: lifts the pin while the map moves under it.
  const [isMoving, setIsMoving] = useState(false);

  // Keep the latest callbacks reachable from the init effect (which only runs
  // once and captures its dependencies via a ref).
  const onErrorRef = useRef(onError);
  const onCenterChangeRef = useRef(onCenterChange);
  const onMapClickRef = useRef(onMapClick);
  const showCenterPinRef = useRef(showCenterPin);
  const pinTargetRef = useRef(pinTarget);
  const shouldIgnoreTapRef = useRef(shouldIgnoreTap);
  useEffect(() => {
    onErrorRef.current = onError;
    onCenterChangeRef.current = onCenterChange;
    onMapClickRef.current = onMapClick;
    showCenterPinRef.current = showCenterPin;
    pinTargetRef.current = pinTarget;
    shouldIgnoreTapRef.current = shouldIgnoreTap;
  }, [onError, onCenterChange, onMapClick, showCenterPin, pinTarget, shouldIgnoreTap]);
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
    onMapClick,
    centerPinMode,
  });

  // Initialize map once
  useEffect(() => {
    if (!mapContainer.current || initializedRef.current) return;

    const { accessToken: initToken, center: initCenter, zoom: initZoom, style: initStyle, showControls: initShowControls, onMapLoad: initOnMapLoad, clickToPlace: initClickToPlace, onMapClick: initOnMapClick, centerPinMode: initCenterPinMode } = initialValuesRef.current;

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
        // Center pin mode resizes from the ResizeObserver below: Mapbox's own
        // window-resize handler tags its move events like a user gesture.
        trackResize: !initCenterPinMode,
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

    // Add navigation controls (zoom only in center pin mode: no rotate/pitch there)
    if (initShowControls) {
      map.current.addControl(
        new mapboxgl.NavigationControl(
          initCenterPinMode ? { showCompass: false } : { visualizePitch: true },
        ),
        'top-right'
      );
    }

    if (initCenterPinMode) {
      const m = map.current;
      // North-up and flat; zoom gestures keep the center (= the pin's spot)
      // put while the fingers are down (a flicked pinch's inertia can still
      // drift it a little, which then reports like a pan).
      m.dragRotate.disable();
      m.touchZoomRotate.disableRotation();
      m.touchPitch.disable();
      m.touchZoomRotate.enable({ around: 'center' });
      m.scrollZoom.enable({ around: 'center' });
      // A tap moves the pin; a double-tap would zoom around the tap point instead.
      m.doubleClickZoom.disable();

      // Keeps the map's center on the pin's point after programmatic moves: a
      // flyTo started before the layout changed (keyboard closing) lands off
      // it, and a pick made before 'load' is undone by the initial setCenter.
      const snapToPinTarget = () => {
        const target = pinTargetRef.current;
        if (!target || !showCenterPinRef.current || m.isMoving()) return;
        const at = m.project(target);
        const center = m.project(m.getCenter());
        if (Math.hypot(at.x - center.x, at.y - center.y) > 1) m.jumpTo({ center: target });
      };

      m.on('movestart', (e) => {
        if (e.originalEvent) setIsMoving(true);
      });
      m.on('moveend', (e) => {
        setIsMoving(false);
        // Only gestures (pan, inertia, pinch) move the pin. Not programmatic
        // moves (setCenter, a caller's flyTo, resize), not resize-type events,
        // and not while an ease runs - a tap's own easeTo, which a slightly
        // sloppy tap's micro-pan would otherwise override.
        const type = (e.originalEvent as Event | undefined)?.type;
        const byGesture = !!type && !NON_GESTURE_EVENTS.has(type) && !m.isEasing();
        if (!byGesture) {
          snapToPinTarget();
          return;
        }
        if (!showCenterPinRef.current) return;
        const { lng, lat } = m.getCenter();
        onCenterChangeRef.current?.([lng, lat]);
      });
      if (initClickToPlace) {
        m.on('click', (e) => {
          if (shouldIgnoreTapRef.current?.()) return;
          const { lng, lat } = e.lngLat;
          m.easeTo({ center: [lng, lat] });
          onMapClickRef.current?.([lng, lat]);
        });
      }
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
    if (!initCenterPinMode && initClickToPlace && initOnMapClick) {
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

  // Mapbox only follows window resizes. Keep the canvas matched to the
  // container (e.g. a full-screen panel padding itself for the iOS keyboard),
  // or a center pin drifts off the real center. Once the size settles: a
  // resize clears the canvas until the next frame, so resizing on every frame
  // of a keyboard animation would flicker. resize() keeps the center, and its
  // moveend snaps a center pin back onto its point.
  useEffect(() => {
    const el = mapContainer.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    let timer = 0;
    const observer = new ResizeObserver(() => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => map.current?.resize(), 120);
    });
    observer.observe(el);
    return () => {
      window.clearTimeout(timer);
      observer.disconnect();
    };
  }, []);

  // Update marker separately – add when map is ready so marker shows when opening from geocode (async)
  useEffect(() => {
    if (centerPinMode || !map.current || !marker) return;

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
  }, [centerPinMode, marker, onMarkerDragEnd]);

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
      {/* Center pin: its tip sits on the container's center (= the map's
          center), lifted while the map moves; the dot marks the exact spot. */}
      {centerPinMode && showCenterPin && (
        <div aria-hidden className="pointer-events-none absolute inset-0 z-[3]">
          <span className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-black/40" />
          <svg
            viewBox="0 0 32 44"
            className="absolute left-1/2 top-1/2 h-11 w-8 drop-shadow-md transition-transform duration-150 ease-out"
            style={{ transform: `translate(-50%, ${isMoving ? 'calc(-100% - 8px)' : '-100%'})` }}
          >
            <path
              d="M16 0C7.16 0 0 7.16 0 16c0 11 16 28 16 28s16-17 16-28C32 7.16 24.84 0 16 0z"
              fill={pinColor}
            />
            <circle cx="16" cy="16" r="6" fill="#fff" />
          </svg>
        </div>
      )}
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

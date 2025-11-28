# Map Components

Interactive map components using MapLibre GL JS with MapTiler tiles.

## Installation

First, install the required dependency:

```bash
npm install maplibre-gl
```

## Setup

1. **Get a MapTiler API Key**
   - Sign up at [maptiler.com](https://www.maptiler.com/cloud/)
   - Create a new API key
   - Add it to your environment variables:

```env
VITE_MAPTILER_API_KEY=your_api_key_here
```

2. **Access the API key in your code:**

```typescript
const apiKey = import.meta.env.VITE_MAPTILER_API_KEY;
```

## Components

### `MapView`

A standalone map component that can be embedded anywhere.

**Props:**
- `apiKey` (required): Your MapTiler API key
- `center`: Initial center coordinates `[longitude, latitude]` (default: `[0, 0]`)
- `zoom`: Initial zoom level 0-22 (default: `9`)
- `style`: Map style name or URL (default: `'streets-v2'`)
- `height`: Map container height (default: `'400px'`)
- `width`: Map container width (default: `'100%'`)
- `marker`: Optional marker object `{ coordinates: [lng, lat], color: '#FF0000' }`
- `showControls`: Show navigation controls (default: `true`)
- `onMapLoad`: Callback when map is loaded
- `className`: Additional CSS classes

**Example:**

```tsx
import { MapView } from '@/shared/components/map';

<MapView
  apiKey={import.meta.env.VITE_MAPTILER_API_KEY}
  center={[-0.1276, 51.5074]} // London
  zoom={12}
  style="streets-v2"
  marker={{ 
    coordinates: [-0.1276, 51.5074],
    color: '#3b82f6' 
  }}
  showControls
  height="500px"
/>
```

### `MapDialog`

A dialog/popup that displays a map.

**Props:**
- All `MapView` props (except `height` and `width`)
- `isOpen` (required): Whether the dialog is open
- `onClose` (required): Callback when dialog should close
- `title`: Dialog title (default: `'Map'`)
- `description`: Optional description text
- `mapHeight`: Height of the map in the dialog (default: `'500px'`)

**Example:**

```tsx
import { MapDialog } from '@/shared/components/map';
import { useState } from 'react';

function MyComponent() {
  const [isMapOpen, setIsMapOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setIsMapOpen(true)}>
        View on Map
      </Button>

      <MapDialog
        isOpen={isMapOpen}
        onClose={() => setIsMapOpen(false)}
        title="Location Map"
        description="View the location details"
        apiKey={import.meta.env.VITE_MAPTILER_API_KEY}
        center={[-0.1276, 51.5074]}
        zoom={14}
        marker={{
          coordinates: [-0.1276, 51.5074],
          color: '#3b82f6'
        }}
        style="streets-v2"
        showControls
      />
    </>
  );
}
```

## Available Map Styles

MapTiler provides several built-in styles:

- `streets-v2` - Default street map (recommended)
- `satellite` - Satellite imagery
- `hybrid` - Satellite with street labels
- `topo-v2` - Topographic map
- `outdoor-v2` - Outdoor/hiking map
- `winter-v2` - Winter themed map
- `basic-v2` - Simple, minimal style

You can also use a custom style URL:

```tsx
style="https://api.maptiler.com/maps/your-custom-style/style.json?key=YOUR_KEY"
```

## Advanced Usage

### Custom Marker Interactions

```tsx
<MapView
  apiKey={apiKey}
  center={coordinates}
  zoom={14}
  onMapLoad={(map) => {
    // Add custom layers, markers, or interactions
    map.on('click', (e) => {
      console.log('Map clicked at:', e.lngLat);
    });
  }}
/>
```

### Multiple Markers

```tsx
<MapView
  apiKey={apiKey}
  center={[0, 0]}
  zoom={2}
  onMapLoad={(map) => {
    locations.forEach(location => {
      new maplibregl.Marker({ color: location.color })
        .setLngLat(location.coordinates)
        .setPopup(
          new maplibregl.Popup().setHTML(`<h3>${location.name}</h3>`)
        )
        .addTo(map);
    });
  }}
/>
```

## Integration Examples

### With Location Form

```tsx
import { MapDialog } from '@/shared/components/map';

function LocationForm() {
  const [showMap, setShowMap] = useState(false);
  const [coordinates, setCoordinates] = useState<[number, number]>([0, 0]);

  return (
    <>
      <TextField label="Address" />
      <Button onClick={() => setShowMap(true)}>
        View on Map
      </Button>

      <MapDialog
        isOpen={showMap}
        onClose={() => setShowMap(false)}
        title="Location Preview"
        apiKey={import.meta.env.VITE_MAPTILER_API_KEY}
        center={coordinates}
        marker={{ coordinates }}
      />
    </>
  );
}
```

## Troubleshooting

**Map not displaying:**
- Ensure you've installed `maplibre-gl`
- Check that your API key is valid
- Verify the API key is correctly loaded from environment variables

**Marker not appearing:**
- Ensure coordinates are in `[longitude, latitude]` format (not lat/lng)
- Check that coordinates are valid numbers

**Styling issues:**
- Make sure `maplibre-gl.css` is imported
- Check z-index if map is behind other elements

## Resources

- [MapLibre GL JS Documentation](https://maplibre.org/maplibre-gl-js-docs/api/)
- [MapTiler Cloud](https://www.maptiler.com/cloud/)
- [MapTiler Styles](https://www.maptiler.com/maps/)


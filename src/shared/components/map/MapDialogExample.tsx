import React, { useState } from 'react';
import { Button } from '../ui/button';
import { MapDialog } from './MapDialog';
import { MapPin } from 'lucide-react';

/**
 * Example component demonstrating how to use MapDialog
 * 
 * This is a demo component - you can delete this file once you've 
 * integrated the map into your own components.
 */
export const MapDialogExample: React.FC = () => {
  const [isMapOpen, setIsMapOpen] = useState(false);

  // Get your MapTiler API key from: https://www.maptiler.com/cloud/
  const MAPTILER_API_KEY = 'YOUR_MAPTILER_API_KEY'; // Replace with your actual key

  // Example locations
  const locations = {
    london: {
      name: 'London, UK',
      coordinates: [-0.1276, 51.5074] as [number, number],
    },
    newYork: {
      name: 'New York, USA',
      coordinates: [-74.006, 40.7128] as [number, number],
    },
    tokyo: {
      name: 'Tokyo, Japan',
      coordinates: [139.6917, 35.6895] as [number, number],
    },
  };

  const [selectedLocation, setSelectedLocation] = useState(locations.london);

  return (
    <div className="p-8 space-y-4">
      <h2 className="text-2xl font-bold">Map Dialog Example</h2>
      
      <div className="space-y-2">
        <p className="text-sm text-foreground-3">
          Select a location and click "Open Map" to view it in a dialog
        </p>
        
        <div className="flex gap-2">
          {Object.entries(locations).map(([key, location]) => (
            <Button
              key={key}
              variant={selectedLocation.name === location.name ? 'default' : 'outline'}
              onClick={() => setSelectedLocation(location)}
            >
              {location.name}
            </Button>
          ))}
        </div>
      </div>

      <Button 
        onClick={() => setIsMapOpen(true)}
        className="gap-2"
      >
        <MapPin className="h-4 w-4" />
        Open Map
      </Button>

      <MapDialog
        isOpen={isMapOpen}
        onClose={() => setIsMapOpen(false)}
        title={`Map - ${selectedLocation.name}`}
        description="View the location on an interactive map"
        apiKey={MAPTILER_API_KEY}
        center={selectedLocation.coordinates}
        zoom={12}
        style="streets-v2" // Options: streets-v2, satellite, hybrid, topo-v2, winter-v2, etc.
        marker={{
          coordinates: selectedLocation.coordinates,
          color: '#3b82f6', // Blue marker
        }}
        showControls
        mapHeight="500px"
      />

      <div className="mt-8 p-4 bg-surface-2 rounded-lg border">
        <h3 className="font-semibold mb-2">Available Map Styles:</h3>
        <ul className="list-disc list-inside space-y-1 text-sm text-foreground-2">
          <li><code>streets-v2</code> - Default street map</li>
          <li><code>satellite</code> - Satellite imagery</li>
          <li><code>hybrid</code> - Satellite with labels</li>
          <li><code>topo-v2</code> - Topographic map</li>
          <li><code>winter-v2</code> - Winter themed map</li>
          <li><code>outdoor-v2</code> - Outdoor/hiking map</li>
        </ul>
      </div>
    </div>
  );
};

export default MapDialogExample;


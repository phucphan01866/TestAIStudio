import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Navigation, Trash2, X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Fix for default marker icon issue in React-Leaflet
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIconRetina from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIconRetina,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface Pin {
  id: string;
  lat: number;
  lng: number;
  timestamp: number;
}

export default function MapComponent() {
  const [pins, setPins] = useState<Pin[]>([]);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [pendingLocation, setPendingLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        setUserLocation([position.coords.latitude, position.coords.longitude]);
      });
    }
  }, []);

  const MapEvents = () => {
    useMapEvents({
      click(e) {
        if (showConfirmDialog) return;
        
        setPendingLocation({
          lat: e.latlng.lat,
          lng: e.latlng.lng,
        });
        setShowConfirmDialog(true);
      },
    });
    return null;
  };

  const confirmPin = () => {
    if (pendingLocation) {
      const newPin: Pin = {
        id: Math.random().toString(36).substr(2, 9),
        lat: pendingLocation.lat,
        lng: pendingLocation.lng,
        timestamp: Date.now(),
      };
      setPins((prev) => [...prev, newPin]);
      setPendingLocation(null);
      setShowConfirmDialog(false);
    }
  };

  const cancelPin = () => {
    setPendingLocation(null);
    setShowConfirmDialog(false);
  };

  const removePin = (id: string) => {
    setPins((prev) => prev.filter((pin) => pin.id !== id));
  };

  const HCMC_COORDINATES: [number, number] = [10.762622, 106.660172];
  const VIETNAM_BOUNDS: L.LatLngBoundsExpression = [
    [8.179066, 102.14441], // South-West
    [23.393395, 109.464639] // North-East
  ];
  const center = userLocation || HCMC_COORDINATES;

  return (
    <div className="flex flex-col h-screen bg-stone-50">
      <header className="p-6 border-b border-black/5 flex justify-between items-center bg-white">
        <div>
          <h1 className="text-2xl font-sans font-medium tracking-tight text-gray-900 flex items-center gap-2">
            <MapPin className="w-6 h-6 text-emerald-600" />
            Interactive Map
          </h1>
          <p className="text-sm text-gray-500 font-sans mt-1">Click anywhere on the map to drop a pin</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="px-4 py-2 bg-emerald-50 rounded-full border border-emerald-100">
            <span className="text-xs font-mono text-emerald-700 font-medium uppercase tracking-wider">
              {pins.length} Pins Dropped
            </span>
          </div>
        </div>
      </header>

      <div className="flex-1 relative">
        <MapContainer
          center={center as L.LatLngExpression}
          zoom={13}
          minZoom={5}
          maxBounds={VIETNAM_BOUNDS}
          maxBoundsViscosity={1.0}
          scrollWheelZoom={true}
          className="h-full w-full z-0"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapEvents />
          
          {pins.map((pin) => (
            <Marker key={pin.id} position={[pin.lat, pin.lng]}>
              <Popup>
                <div className="p-2 font-sans min-w-[150px]">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-mono text-gray-400">
                      {new Date(pin.timestamp).toLocaleTimeString()}
                    </span>
                    <button 
                      onClick={() => removePin(pin.id)}
                      className="text-red-500 hover:text-red-700 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="text-sm font-medium text-gray-900">
                    Lat: {pin.lat.toFixed(4)}
                  </div>
                  <div className="text-sm font-medium text-gray-900">
                    Lng: {pin.lng.toFixed(4)}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

          {userLocation && (
            <Marker position={userLocation}>
              <Popup>
                <div className="font-sans font-medium text-emerald-600 flex items-center gap-1">
                  <Navigation className="w-4 h-4" />
                  Your Location
                </div>
              </Popup>
            </Marker>
          )}
        </MapContainer>

        {/* Confirmation Dialog */}
        <AnimatePresence>
          {showConfirmDialog && pendingLocation && (
            <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-black/20 backdrop-blur-[2px]">
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-white rounded-3xl shadow-2xl border border-black/5 p-8 max-w-sm w-full mx-4"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-6">
                    <MapPin className="w-8 h-8 text-emerald-600" />
                  </div>
                  <h2 className="text-xl font-sans font-semibold text-gray-900 mb-2">Mark this location?</h2>
                  <p className="text-sm text-gray-500 font-sans mb-8">
                    Do you want to drop a pin at these coordinates?
                    <br />
                    <span className="font-mono text-xs mt-2 block bg-gray-50 p-2 rounded-lg border border-gray-100">
                      {pendingLocation.lat.toFixed(6)}, {pendingLocation.lng.toFixed(6)}
                    </span>
                  </p>
                  
                  <div className="flex gap-3 w-full">
                    <button
                      onClick={cancelPin}
                      className="flex-1 px-6 py-3 rounded-2xl border border-gray-200 text-gray-600 font-sans font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </button>
                    <button
                      onClick={confirmPin}
                      className="flex-1 px-6 py-3 rounded-2xl bg-emerald-600 text-white font-sans font-medium hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all flex items-center justify-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      Confirm
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Sidebar overlay for pin list */}
        {pins.length > 0 && (
          <div className="absolute top-4 right-4 z-10 w-64 max-h-[calc(100%-2rem)] overflow-y-auto bg-white/90 backdrop-blur-md rounded-2xl shadow-lg border border-white/20 p-4">
            <h3 className="text-xs font-mono font-bold text-gray-400 uppercase tracking-widest mb-4">Saved Pins</h3>
            <div className="space-y-3">
              {pins.map((pin) => (
                <div key={pin.id} className="p-3 bg-white rounded-xl border border-black/5 shadow-sm hover:border-emerald-200 transition-all group">
                  <div className="flex justify-between items-center">
                    <div className="text-[10px] font-mono text-gray-400">
                      {new Date(pin.timestamp).toLocaleDateString()}
                    </div>
                    <button 
                      onClick={() => removePin(pin.id)}
                      className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition-all"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="text-xs font-medium text-gray-700 mt-1">
                    {pin.lat.toFixed(4)}, {pin.lng.toFixed(4)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { SdamRegion, Coordinates } from '../types/sdam';
import { determineRegion, checkAdjacentRegions } from '../utils/geoUtils';
import { MapPin, Navigation, Info, AlertTriangle, CheckCircle2 } from 'lucide-react';
import L from 'leaflet';

interface Step1Props {
  selectedRegion: SdamRegion | null;
  onSelectRegion: (region: SdamRegion | null) => void;
  coordinates: Coordinates;
  onCoordinatesChange: (coords: Coordinates) => void;
  adjacentRegions: SdamRegion[];
  onAdjacentRegionsChange: (adj: SdamRegion[]) => void;
  onProceedToStep2: () => void;
}

const REGION_OPTIONS: SdamRegion[] = [
  'Arid West',
  'Western Mountains',
  'Great Plains',
  'Pacific Northwest',
  'Northeast',
  'Southeast',
];

export const Step1Location: React.FC<Step1Props> = ({
  selectedRegion,
  onSelectRegion,
  coordinates,
  onCoordinatesChange,
  adjacentRegions,
  onAdjacentRegionsChange,
  onProceedToStep2,
}) => {
  const [inputMode, setInputMode] = useState<'Enter coordinates' | 'Select region' | 'Select location on map'>('Enter coordinates');
  const [latInput, setLatInput] = useState<string>(coordinates.lat ? coordinates.lat.toString() : '40');
  const [lonInput, setLonInput] = useState<string>(coordinates.lon ? coordinates.lon.toString() : '-98');
  const [hasAssessed, setHasAssessed] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Leaflet map setup
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const assessLocation = (lat: number, lon: number) => {
    if (isNaN(lat) || isNaN(lon)) {
      setErrorMessage('Please enter valid numeric latitude and longitude coordinates.');
      return;
    }

    const reg = determineRegion(lat, lon);
    setHasAssessed(true);

    if (reg === 'Outside Study Area') {
      setErrorMessage('The location of your site is outside of the SDAM Study areas. Please check your latitude and longitude coordinates to ensure they are entered correctly in decimal degrees (WGS84).');
      onSelectRegion(null);
      onAdjacentRegionsChange([]);
    } else {
      setErrorMessage(null);
      onSelectRegion(reg);
      const adj = checkAdjacentRegions(lat, lon, reg, 10);
      onAdjacentRegionsChange(adj);
    }
  };

  const handleAssessClick = () => {
    const lat = parseFloat(latInput);
    const lon = parseFloat(lonInput);
    onCoordinatesChange({ lat, lon });
    assessLocation(lat, lon);
  };

  // Initialize or update Leaflet map when map mode is active
  useEffect(() => {
    if (inputMode !== 'Select location on map') {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      return;
    }

    if (mapContainerRef.current && !mapInstanceRef.current) {
      // Fix default Leaflet icon paths
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      const initialLat = coordinates.lat || 39.5;
      const initialLon = coordinates.lon || -98.35;

      const map = L.map(mapContainerRef.current).setView([initialLat, initialLon], 4);
      mapInstanceRef.current = map;

      // EPA / USGS Topo or OpenStreetMap Tile Layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | US EPA SDAM',
        maxZoom: 18,
      }).addTo(map);

      // Add clickable marker
      const marker = L.marker([initialLat, initialLon], { draggable: true }).addTo(map);
      markerRef.current = marker;

      const updateFromLatLng = (lat: number, lng: number) => {
        const roundedLat = Math.round(lat * 10000) / 10000;
        const roundedLon = Math.round(lng * 10000) / 10000;
        setLatInput(roundedLat.toString());
        setLonInput(roundedLon.toString());
        onCoordinatesChange({ lat: roundedLat, lon: roundedLon });
        assessLocation(roundedLat, roundedLon);
      };

      map.on('click', (e: L.LeafletMouseEvent) => {
        marker.setLatLng(e.latlng);
        updateFromLatLng(e.latlng.lat, e.latlng.lng);
      });

      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        updateFromLatLng(pos.lat, pos.lng);
      });
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [inputMode]);

  return (
    <div className="bg-white border border-gray-300 rounded shadow-sm p-6 mb-8">
      {/* EPA Info banner */}
      <div className="bg-[#005ea2] text-white p-3.5 rounded mb-4 text-center">
        <h3 className="font-semibold text-base">
          <a
            href="https://www.epa.gov/streamflow-duration-assessment/materials-support-application-regional-sdams"
            target="_blank"
            rel="noreferrer"
            className="hover:underline flex items-center justify-center space-x-1.5"
          >
            <span>Supporting SDAM materials including user manuals, field assessment forms, and training videos</span>
            <Info className="w-4 h-4 inline" />
          </a>
        </h3>
      </div>

      <div className="bg-amber-50 border border-amber-300 text-amber-900 p-3 rounded mb-6 text-sm text-center font-medium">
        This web application is an analysis tool; it does not store data on remote servers. All calculations and report downloads occur directly in your session.
      </div>

      <div className="flex items-center space-x-2 mb-4">
        <span className="step-badge">Step 1</span>
        <h2 className="text-xl font-bold text-gray-900">Document reach location and select regional SDAM</h2>
      </div>

      <div className="border border-gray-300 rounded p-4 mb-6 bg-white">
        {/* Method selection dropdown */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-800 mb-1.5">
            Select method to specify location or SDAM region:
          </label>
          <select
            value={inputMode}
            onChange={(e) => {
              setInputMode(e.target.value as any);
              setErrorMessage(null);
            }}
            className="w-full md:w-2/3 border border-gray-400 p-2.5 rounded text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#005ea2]"
          >
            <option value="Enter coordinates">Enter coordinates</option>
            <option value="Select region">Select region</option>
            <option value="Select location on map">Select location on map</option>
          </select>
        </div>

        <hr className="my-4 border-gray-300" />

        {/* Mode 1: Enter coordinates */}
        {inputMode === 'Enter coordinates' && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            <div className="md:col-span-7">
              <p className="text-sm font-medium italic text-gray-700 mb-3">
                Enter coordinates in decimal degrees to determine if the site is in an SDAM study area:
              </p>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Latitude (°N)</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={latInput}
                    onChange={(e) => setLatInput(e.target.value)}
                    className="w-44 border border-gray-400 p-2 rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#005ea2]"
                    placeholder="e.g. 40.0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Longitude (°W)</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={lonInput}
                    onChange={(e) => setLonInput(e.target.value)}
                    className="w-44 border border-gray-400 p-2 rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#005ea2]"
                    placeholder="e.g. -98.0"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAssessClick}
                  className="epa-btn-primary mt-2 flex items-center space-x-1.5 cursor-pointer"
                >
                  <Navigation className="w-4 h-4" />
                  <span>Assess reach location</span>
                </button>
              </div>
            </div>

            <div className="md:col-span-5">
              {hasAssessed && selectedRegion && (
                <div className="border-my-text rounded shadow-sm animate-fade-in">
                  <h4 className="text-xs uppercase tracking-wider text-blue-200">SDAM Region Determined</h4>
                  <div className="text-2xl font-bold my-1 flex items-center justify-center space-x-1.5">
                    <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                    <span>{selectedRegion}</span>
                  </div>
                  <p className="text-xs text-blue-100 mt-1">
                    Latitude: {coordinates.lat}°, Longitude: {coordinates.lon}°
                  </p>
                </div>
              )}

              {errorMessage && (
                <div className="bg-red-50 border-2 border-red-400 text-red-900 p-3 rounded text-sm flex items-start space-x-2">
                  <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Notice:</span> {errorMessage}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Mode 2: Select region from dropdown */}
        {inputMode === 'Select region' && (
          <div className="space-y-4 max-w-xl">
            <p className="text-sm font-medium italic text-gray-700">
              Select SDAM Region if not entering coordinates:
            </p>
            <select
              value={selectedRegion || ''}
              onChange={(e) => {
                const val = e.target.value as SdamRegion;
                onSelectRegion(val || null);
                setHasAssessed(!!val);
                setErrorMessage(null);
              }}
              className="w-full border border-gray-400 p-2.5 rounded text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#005ea2]"
            >
              <option value="">-- No region selected --</option>
              {REGION_OPTIONS.map((reg) => (
                <option key={reg} value={reg}>
                  {reg}
                </option>
              ))}
            </select>

            {selectedRegion && (
              <div className="p-3 bg-blue-50 border border-blue-200 text-blue-900 rounded text-sm">
                Active Regional SDAM: <strong>{selectedRegion}</strong>
              </div>
            )}
          </div>
        )}

        {/* Mode 3: Interactive Leaflet Map */}
        {inputMode === 'Select location on map' && (
          <div className="space-y-3">
            <p className="text-sm text-gray-700 font-medium">
              Click anywhere on the map or drag the marker to specify the site reach location.
            </p>
            <div
              ref={mapContainerRef}
              className="w-full h-96 border border-gray-400 rounded shadow-inner"
              style={{ minHeight: '380px' }}
            />
            {selectedRegion && (
              <div className="p-3 bg-blue-50 border border-blue-200 text-blue-900 rounded text-sm flex items-center justify-between">
                <div>
                  Detected Region: <strong>{selectedRegion}</strong> (Lat: {coordinates.lat}°, Lon: {coordinates.lon}°)
                </div>
              </div>
            )}
          </div>
        )}

        {/* 10-mile proximity alert */}
        {adjacentRegions.length > 0 && selectedRegion && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-300 rounded text-sm text-yellow-900 flex items-start space-x-2">
            <AlertTriangle className="w-4 h-4 text-yellow-700 shrink-0 mt-0.5" />
            <div>
              <strong>10-mile Distance Alert:</strong> This site is located within approximately 10 miles of adjacent SDAM region(s):{' '}
              <span className="font-semibold">{adjacentRegions.join(', ')}</span>. Refer to the regional user manuals if boundary classification differences arise.
            </div>
          </div>
        )}
      </div>

      {/* Advance button */}
      <div className="text-center mt-6">
        <button
          type="button"
          onClick={() => {
            if (!selectedRegion) {
              setErrorMessage('No SDAM region selected. Please select a region or assess coordinates before proceeding.');
              return;
            }
            onProceedToStep2();
          }}
          className="epa-btn-primary text-lg py-3 px-8 cursor-pointer shadow-md"
        >
          Enter Model Data
        </button>
      </div>
    </div>
  );
};

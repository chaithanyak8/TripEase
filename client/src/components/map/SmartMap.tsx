import React, { useState, useEffect, useMemo, useRef } from 'react';
import L from 'leaflet';
import { useApp } from '../../context/AppContext';
import { Destination } from '../../types';
import { apiUrl } from '../../utils/api';
import {
  Layers,
  MapPin,
  Search,
  Navigation,
  Plus,
  ShieldAlert,
  Hotel,
  UtensilsCrossed,
  Hospital,
  Shield,
  Fuel,
  CreditCard,
  Bus,
  Info,
  Check
} from 'lucide-react';

interface MapPoint {
  id: string;
  name: string;
  category: 'Attraction' | 'Hotel' | 'Restaurant' | 'Hospital' | 'Police' | 'Fuel' | 'ATM' | 'Transit';
  lat: number;
  lng: number;
  description: string;
  address: string;
  phone?: string;
  distanceFromUser?: string;
}

export const SmartMap: React.FC = () => {
  const { activeTrip, setActiveTab, showToast, selectedDestination, currentLocation } = useApp();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [key: string]: L.Marker }>({});
  const routeLineRef = useRef<L.Polyline | null>(null);

  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [selectedPoint, setSelectedPoint] = useState<MapPoint | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [resolvedDestination, setResolvedDestination] = useState<Destination | undefined>(activeTrip?.targetDestination || selectedDestination || undefined);

  useEffect(() => {
    if (activeTrip?.targetDestination) {
      setResolvedDestination(activeTrip.targetDestination);
      return;
    }
    if (!activeTrip?.destination) {
      setResolvedDestination(undefined);
      return;
    }

    setResolvedDestination(undefined);
    const controller = new AbortController();
    const params = new URLSearchParams({ search: activeTrip.destination });
    fetch(apiUrl(`/api/destinations?${params}`), { signal: controller.signal })
      .then(response => response.ok ? response.json() : Promise.reject(new Error('Destination lookup failed')))
      .then(data => {
        const match = data.destinations.find((item: Destination) =>
          item.id === activeTrip.targetDestination?.id ||
          item.name.toLowerCase() === activeTrip.destination.toLowerCase() ||
          item.state.toLowerCase() === activeTrip.destination.toLowerCase()
        ) || data.destinations[0];
        if (!controller.signal.aborted) setResolvedDestination(match);
      })
      .catch(error => {
        if (!controller.signal.aborted) console.error(error);
      });

    return () => controller.abort();
  }, [activeTrip?.id, activeTrip?.destination, activeTrip?.targetDestination]);

  const points = useMemo<MapPoint[]>(() => {
    const destination = activeTrip?.destination || selectedDestination?.name || resolvedDestination?.name;
    const tripDestination = activeTrip?.targetDestination || selectedDestination || resolvedDestination;
    const coordinates = tripDestination?.coordinates || (currentLocation ? { lat: currentLocation.latitude, lng: currentLocation.longitude } : undefined);
    if (!destination || !coordinates) return [];

    const offset = (index: number) => ({
      lat: coordinates.lat + ((index % 3) - 1) * 0.012,
      lng: coordinates.lng + (Math.floor(index / 3) - 1) * 0.014
    });
    const activities = tripDestination?.popularActivities || activeTrip?.days.map(day => day.title) || [];
    const attractionPoints: MapPoint[] = activities.map((name, index) => ({
      id: `trip-attraction-${index}`,
      name,
      category: 'Attraction',
      ...offset(index),
      description: `Suggested itinerary location for ${destination}. Map pin is approximate.`,
      address: destination,
      distanceFromUser: 'Approximate'
    }));
    const hotel = activeTrip?.hotel;
    const hotelPoint: MapPoint[] = hotel?.name ? [{
      id: `trip-hotel-${hotel.id || 'stay'}`,
      name: hotel.name,
      category: 'Hotel',
      ...offset(activities.length),
      description: `Recommended accommodation for ${destination}. Map pin is approximate.`,
      address: destination
    }] : [];
    const foodPoints: MapPoint[] = (activeTrip?.restaurants || []).map((food, index) => ({
      id: `trip-food-${food.id}`,
      name: food.iconicRestaurant,
      category: 'Restaurant',
      ...offset(activities.length + hotelPoint.length + index),
      description: `${food.dishName}. Map pin is approximate.`,
      address: destination
    }));

    return [...attractionPoints, ...hotelPoint, ...foodPoints];
  }, [activeTrip, selectedDestination, currentLocation, resolvedDestination]);

  useEffect(() => {
    setSelectedPoint(null);
  }, [activeTrip?.id]);

  const routeOrigins: Record<string, [number, number]> = {
    bengaluru: [12.9716, 77.5946],
    bangalore: [12.9716, 77.5946],
    hyderabad: [17.385, 78.4867],
    chennai: [13.0827, 80.2707],
    mumbai: [19.076, 72.8777],
    delhi: [28.6139, 77.209]
  };

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const destinationCenter = selectedDestination?.coordinates || resolvedDestination?.coordinates || (currentLocation ? { lat: currentLocation.latitude, lng: currentLocation.longitude } : undefined);
      const map = L.map(mapContainerRef.current).setView(destinationCenter ? [destinationCenter.lat, destinationCenter.lng] : [20.5937, 78.9629], destinationCenter ? 12 : 5);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;
    const center = selectedDestination?.coordinates || resolvedDestination?.coordinates || (currentLocation ? { lat: currentLocation.latitude, lng: currentLocation.longitude } : undefined);
    routeLineRef.current?.remove();
    const originPoint = routeOrigins[activeTrip?.origin.toLowerCase().replace(/\s+/g, '') || ''];
    if (center && originPoint) {
      map.fitBounds([originPoint, [center.lat, center.lng]], { padding: [36, 36], maxZoom: 7 });
      routeLineRef.current = L.polyline([originPoint, [center.lat, center.lng]], {
        color: '#0284c7',
        weight: 4,
        dashArray: '8 8'
      }).addTo(map);
    } else if (center) {
      map.setView([center.lat, center.lng], 12);
    }

    // Clear existing markers
    Object.values(markersRef.current).forEach(m => m.remove());
    markersRef.current = {};

    // Filter points
    const filteredPoints = points.filter(p => {
      if (activeCategory !== 'All' && p.category !== activeCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q);
      }
      return true;
    });

    // Add markers with category styling
    filteredPoints.forEach(p => {
      const color =
        p.category === 'Attraction' ? '#ea580c' :
        p.category === 'Hotel' ? '#8b5cf6' :
        p.category === 'Restaurant' ? '#f59e0b' :
        p.category === 'Hospital' ? '#ef4444' :
        p.category === 'Police' ? '#3b82f6' :
        p.category === 'Transit' ? '#10b981' : '#64748b';

      const customIcon = L.divIcon({
        className: 'custom-pin',
        html: `
          <div style="background-color: ${color}; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.3); color: white; font-size: 13px; font-weight: bold;">
            ${p.category[0]}
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });

      const marker = L.marker([p.lat, p.lng], { icon: customIcon }).addTo(map);
      marker.bindPopup(`
        <div style="font-family: inherit; max-width: 200px;">
          <strong style="color: #0f172a; font-size: 13px;">${p.name}</strong>
          <p style="margin: 4px 0; font-size: 11px; color: #475569;">${p.description}</p>
          <span style="font-size: 10px; font-weight: bold; color: ${color};">${p.category}</span>
        </div>
      `);

      marker.on('click', () => {
        setSelectedPoint(p);
      });

      markersRef.current[p.id] = marker;
    });

    return () => {
      // Cleanup on unmount handled gracefully
    };
  }, [activeCategory, searchQuery, points, activeTrip?.id, selectedDestination, currentLocation, resolvedDestination]);

  const handleAddToItinerary = (point: MapPoint) => {
    showToast(`Added ${point.name} to active itinerary plan!`);
  };

  const categories = [
    { label: 'All Layers', value: 'All', icon: Layers },
    { label: 'Attractions', value: 'Attraction', icon: MapPin },
    { label: 'Stays', value: 'Hotel', icon: Hotel },
    { label: 'Food', value: 'Restaurant', icon: UtensilsCrossed },
    { label: 'Hospitals', value: 'Hospital', icon: Hospital },
    { label: 'Police', value: 'Police', icon: Shield },
    { label: 'Transit', value: 'Transit', icon: Bus },
    { label: 'Fuel & ATMs', value: 'Fuel', icon: Fuel }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full text-xs font-bold mb-1">
            <Layers className="w-3.5 h-3.5 text-emerald-600" />
            <span>Smart Interactive Tourism Map</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Explore Nearby Attractions & Critical Services
          </h1>
          <p className="text-xs text-slate-500">
            {activeTrip
              ? `${activeTrip.origin} → ${activeTrip.destination} · Approximate pins for active itinerary locations.`
              : 'Synthesize a trip to load its destination map and itinerary locations.'}
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search on map..."
            className="w-full pl-9 pr-3 py-2 bg-white text-xs rounded-xl border border-slate-200 outline-none focus:border-sky-500"
          />
        </div>
      </div>

      {/* Layer Filter Buttons */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {categories.map(c => {
          const Icon = c.icon;
          const isSelected = activeCategory === c.value;
          return (
            <button
              key={c.value}
              onClick={() => setActiveCategory(c.value)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                isSelected
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{c.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Map Container & Selected Card Side Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-[500px] sm:h-[580px] bg-slate-100 rounded-3xl overflow-hidden border border-slate-200 shadow-xs relative">
          <div ref={mapContainerRef} className="w-full h-full" />
        </div>

        {/* Selected Location / Nearby List */}
        <div className="space-y-4">
          {selectedPoint ? (
            <div className="bg-white p-5 rounded-3xl border border-sky-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full">
                  {selectedPoint.category}
                </span>
                <span className="text-xs font-bold text-slate-400">
                  {selectedPoint.distanceFromUser || "1.2 km away"}
                </span>
              </div>

              <div>
                <h3 className="text-base font-black text-slate-900">{selectedPoint.name}</h3>
                <p className="text-xs text-slate-500 mt-1">{selectedPoint.description}</p>
                <div className="text-xs text-slate-600 mt-2 font-medium">
                  📍 {selectedPoint.address}
                </div>
                {selectedPoint.phone && (
                  <div className="text-xs text-slate-600 font-medium">
                    📞 {selectedPoint.phone}
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
                <button
                  onClick={() => handleAddToItinerary(selectedPoint)}
                  className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs py-2 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add to My Itinerary</span>
                </button>

                <button
                  onClick={() => showToast(`Calculating driving navigation to ${selectedPoint.name}...`)}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs py-2 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Navigation className="w-3.5 h-3.5 text-blue-600" />
                  <span>Get Directions</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Select Any Pin on Map
              </h3>
              <p className="text-xs text-slate-500">
                Click on any colored marker on the map to view detailed descriptions, distances, emergency contact information, and one-tap itinerary integration.
              </p>
            </div>
          )}

          {/* Quick List of Nearby Locations */}
          <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs space-y-2">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Points in Active View
            </h4>
            <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto pr-1">
              {points.slice(0, 5).map(pt => (
                <button
                  key={pt.id}
                  onClick={() => {
                    setSelectedPoint(pt);
                    mapInstanceRef.current?.setView([pt.lat, pt.lng], 14);
                  }}
                  className="w-full text-left py-2.5 flex items-center justify-between text-xs hover:text-sky-600 cursor-pointer group"
                >
                  <div>
                    <div className="font-bold text-slate-800 group-hover:text-sky-600">
                      {pt.name}
                    </div>
                    <div className="text-[10px] text-slate-400">{pt.category}</div>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-400 group-hover:text-sky-500">
                    {pt.distanceFromUser}
                  </span>
                </button>
              ))}
              {points.length === 0 && <p className="py-2 text-xs text-slate-500">No active trip locations.</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

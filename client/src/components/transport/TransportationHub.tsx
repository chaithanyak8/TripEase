import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useListingDestination } from '../../hooks/useListingDestination';
import { TransportOption } from '../../types';
import {
  Bus,
  Train,
  Car,
  Bike,
  Clock,
  MapPin,
  Check,
  ShieldCheck,
  Plus,
  Plane,
  Sparkles
} from 'lucide-react';

export const TransportationHub: React.FC = () => {
  const { activeTrip, addBooking } = useApp();
  const { destination: tripDestination } = useListingDestination();
  const [options, setOptions] = useState<TransportOption[]>([]);
  const [origin, setOrigin] = useState(activeTrip?.origin || (tripDestination ? `${tripDestination} City` : ''));
  const [destination, setDestination] = useState(tripDestination);
  const [loading, setLoading] = useState(false);
  const [listingNotice, setListingNotice] = useState('');

  useEffect(() => {
    setOrigin(activeTrip?.origin || (tripDestination ? `${tripDestination} City` : ''));
    setDestination(tripDestination);
  }, [activeTrip?.id, activeTrip?.origin, tripDestination]);

  useEffect(() => {
    const controller = new AbortController();
    fetchTransport(controller.signal);
    return () => controller.abort();
  }, [origin, destination]);

  const fetchTransport = async (signal: AbortSignal) => {
    setOptions([]);
    setListingNotice('');
    if (!origin.trim() || !destination.trim()) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams({ origin, destination });
      const res = await fetch(`http://localhost:5000/api/transport?${params}`, { signal });
      if (res.ok) {
        const data = await res.json();
        if (!signal.aborted && Array.isArray(data.options) && data.options.length > 0) {
          setOptions(data.options);
        } else if (!signal.aborted) {
          setOptions([buildDemoRoute(origin, destination)]);
          setListingNotice('Showing a TripEase demo route estimate; confirm current schedules and fares.');
        }
      } else {
        throw new Error('Transport request failed');
      }
    } catch {
      if (!signal.aborted) {
        setOptions([buildDemoRoute(origin, destination)]);
        setListingNotice('Unable to load live routes right now. Showing a TripEase demo estimate.');
      }
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  };

  const buildDemoRoute = (routeOrigin: string, routeDestination: string): TransportOption => ({
    id: `demo-route-${routeOrigin}-${routeDestination}`,
    origin: routeOrigin,
    destination: routeDestination,
    route: `${routeOrigin} → ${routeDestination}`,
    type: `Local and intercity transport around ${routeDestination}`,
    duration: 'Route-dependent',
    distanceKm: 'Check route details',
    estimatedCost: 500,
    frequency: 'Demo estimate · confirm with local operators',
    ecoRating: 'Compare shared public transport where available',
    badge: 'Demo route estimate',
    amenities: ['Local buses', 'Auto-rickshaws', 'Taxi and rail connections']
  });

  const handleBookTransport = (opt: TransportOption) => {
    addBooking({
      id: `TR-${Date.now().toString().slice(-4)}`,
      itemType: "Transport",
      title: opt.type,
      destination: opt.destination,
      date: "Day 1 Departure",
      guests: activeTrip?.travelers || 1,
      amount: opt.estimatedCost * (activeTrip?.travelers || 1),
      status: "Confirmed",
      qrCode: `TE-TR-${opt.id}`
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8 animate-fadeIn">
      {/* Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 text-white rounded-3xl p-6 sm:p-10 shadow-xl space-y-3">
        <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-emerald-500/30">
          <Bus className="w-3.5 h-3.5" />
          <span>Integrated Multi-Modal Transportation Hub</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
          Seamless Intercity & Local Travel
        </h1>
        <p className="text-xs sm:text-sm text-emerald-100 max-w-2xl">
          Compare state-run AC buses (KSRTC Airavat), Indian Railways superfast trains, verified tourist cabs, meter-verified auto rickshaws, and bike rentals with transparent fare estimates.
        </p>

        {/* Route selector */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 max-w-lg text-xs">
          <div className="bg-white/10 p-2.5 rounded-xl border border-white/20">
            <span className="text-[10px] text-emerald-200 block font-bold">Origin</span>
            <input
              type="text"
              value={origin}
              onChange={e => setOrigin(e.target.value)}
              className="bg-transparent font-bold text-white outline-none w-full"
            />
          </div>
          <div className="bg-white/10 p-2.5 rounded-xl border border-white/20">
            <span className="text-[10px] text-emerald-200 block font-bold">Destination</span>
            <input
              type="text"
              value={destination}
              onChange={e => setDestination(e.target.value)}
              className="bg-transparent font-bold text-white outline-none w-full"
            />
          </div>
        </div>
      </div>

      {/* Transit Options List */}
      <div className="space-y-4">
        <h2 className="text-lg font-black text-slate-900 tracking-tight">
          Available Routes & Transport Modes ({origin} ➔ {destination})
        </h2>

        {loading && <p className="text-sm text-slate-500" role="status">Loading transport options...</p>}
        {listingNotice && <p className="text-xs text-slate-500" role="status">{listingNotice}</p>}
        {options.length === 0 && <p className="text-sm text-slate-500">Enter an origin and destination to see route estimates.</p>}

        <div className="grid grid-cols-1 gap-4">
          {options.map(opt => (
            <div
              key={opt.id}
              className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs hover:shadow-md transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {opt.badge}
                  </span>
                  <span className="text-xs font-bold text-slate-500">
                    🌱 {opt.ecoRating}
                  </span>
                </div>

                <h3 className="font-black text-base text-slate-900">{opt.type}</h3>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-sky-600" />
                    <span>Duration: <strong>{opt.duration}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-blue-500" />
                    <span>Distance: <strong>{opt.distanceKm}{typeof opt.distanceKm === 'number' ? ' km' : ''}</strong></span>
                  </div>
                  <div className="col-span-2 sm:col-span-1 text-slate-500 text-[11px]">
                    {opt.frequency}
                  </div>
                </div>

                {/* Amenities */}
                <div className="flex flex-wrap gap-1 pt-1">
                  {opt.amenities.map((am, i) => (
                    <span key={i} className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium">
                      {am}
                    </span>
                  ))}
                </div>
              </div>

              {/* Price & Action */}
              <div className="sm:text-right border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100 flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">Fare Estimate</span>
                  <strong className="text-xl font-black text-slate-900">₹{opt.estimatedCost}</strong>
                </div>

                <button
                  onClick={() => handleBookTransport(opt)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add to Itinerary</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

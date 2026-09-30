import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useListingDestination } from '../../hooks/useListingDestination';
import { ListingImage } from '../common/ListingImage';
import { getDemoListingData, loadListingCollection } from '../../data/listingData';
import { Hotel } from '../../types';
import { apiUrl } from '../../utils/api';
import {
  Hotel as HotelIcon,
  Star,
  MapPin,
  Check,
  Search,
  SlidersHorizontal,
  Bookmark,
  Calendar,
  ShieldCheck,
  ArrowRight,
  X,
  Scale
} from 'lucide-react';

export const HotelDiscovery: React.FC = () => {
  const { activeTrip, addBooking, setActiveTab, showToast } = useApp();
  const { destination, destinationId } = useListingDestination();
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [listingNotice, setListingNotice] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [maxPrice, setMaxPrice] = useState(5000);
  const [compareList, setCompareList] = useState<Hotel[]>([]);
  const [bookingHotel, setBookingHotel] = useState<Hotel | null>(null);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);

  // Booking form states
  const [checkIn, setCheckIn] = useState('2026-10-15');
  const [checkOut, setCheckOut] = useState('2026-10-18');
  const [guests, setGuests] = useState(activeTrip?.travelers || 1);
  const [guestName, setGuestName] = useState('Pooja Hegde');

  useEffect(() => {
    setGuests(activeTrip?.travelers || 1);
    setBookingHotel(null);
    setBookingConfirmed(false);
  }, [activeTrip?.id]);

  useEffect(() => {
    const controller = new AbortController();
    fetchHotels(controller.signal);
    return () => controller.abort();
  }, [maxPrice, destination, destinationId]);

  const fetchHotels = async (signal: AbortSignal) => {
    setLoading(true);
    setHotels([]);
    setCompareList([]);
    setListingNotice('');
    if (!destination) {
      setListingNotice('Choose a destination to browse stays.');
      setLoading(false);
      return;
    }

    const params = new URLSearchParams({ maxPrice: String(maxPrice), destination });
    if (destinationId) params.set('destinationId', destinationId);
    const fallback = getDemoListingData(destination).hotels;
    const result = await loadListingCollection<Hotel>(apiUrl(`/api/hotels?${params}`), 'hotels', fallback, signal);
    if (signal.aborted) return;
    setHotels(result.items);
    setListingNotice(result.requestFailed
      ? 'Unable to load live listings right now. Showing TripEase demo recommendations.'
      : result.usedFallback ? `Showing TripEase demo recommendations for ${destination}.` : '');
    setLoading(false);
  };

  const handleToggleCompare = (hotel: Hotel) => {
    if (compareList.some(h => h.id === hotel.id)) {
      setCompareList(compareList.filter(h => h.id !== hotel.id));
    } else {
      if (compareList.length >= 3) {
        showToast("You can compare up to 3 hotels side-by-side.");
        return;
      }
      setCompareList([...compareList, hotel]);
    }
  };

  const handleStartBooking = (hotel: Hotel) => {
    setBookingHotel(hotel);
    setBookingConfirmed(false);
  };

  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingHotel) return;

    try {
      const res = await fetch(apiUrl('/api/hotels/book'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hotelId: bookingHotel.id,
          guestName,
          dates: { checkIn, checkOut },
          guests
        })
      });

      if (res.ok) {
        const data = await res.json();
        addBooking(data.booking);
        setBookingConfirmed(true);
      }
    } catch (err) {
      console.error("Booking error:", err);
      showToast("Booking failed, please try again.");
    }
  };

  const filtered = hotels.filter(h => {
    if (h.pricePerNight > maxPrice) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        h.name.toLowerCase().includes(q) ||
        h.destinationName.toLowerCase().includes(q) ||
        (h.area || '').toLowerCase().includes(q) ||
        h.type.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8 animate-fadeIn">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-sky-600 via-teal-600 to-slate-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-white/20 text-white px-2.5 py-0.5 rounded-full text-xs font-bold mb-2">
            <HotelIcon className="w-3.5 h-3.5" />
            <span>Stays & Local Homestays</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Authentic Stays{destination ? ` in ${destination}` : ' Near Sights & Nature'}
          </h1>
          <p className="text-xs sm:text-sm text-sky-100 max-w-xl">
            From heritage stays and coastal retreats to locally run homestays. Demo rates and availability should be confirmed with each property.
          </p>
        </div>

        {compareList.length > 0 && (
          <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/20 flex items-center gap-3">
            <Scale className="w-5 h-5 text-sky-200" />
            <div className="text-xs">
              <strong className="block text-white">{compareList.length} Hotels Selected</strong>
              <span className="text-sky-200 text-[11px]">Compare side-by-side</span>
            </div>
            <button
              onClick={() => {}}
              className="bg-white text-slate-900 font-bold text-xs px-3 py-1.5 rounded-xl cursor-pointer"
            >
              Compare
            </button>
          </div>
        )}
      </div>

      {listingNotice && <p className="text-xs text-slate-500" role="status">{listingNotice}</p>}
      {loading && <p className="text-sm text-slate-500" role="status">Loading stays...</p>}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search hotel by name, destination, or type..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 text-xs rounded-xl border border-slate-200 outline-none focus:border-sky-500"
          />
        </div>

        <div className="flex items-center gap-4 text-xs font-semibold text-slate-700">
          <div className="flex items-center gap-2">
            <span>Max Price/Night:</span>
            <strong className="text-sky-600">₹{maxPrice}</strong>
            <input
              type="range"
              min="1500"
              max="6000"
              step="500"
              value={maxPrice}
              onChange={e => setMaxPrice(Number(e.target.value))}
              className="accent-sky-600 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Side-by-side Compare Drawer if active */}
      {compareList.length > 0 && (
        <div className="bg-slate-900 text-white rounded-3xl p-5 shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-xs uppercase tracking-wider text-sky-400 flex items-center gap-2">
              <Scale className="w-4 h-4" />
              <span>Side-by-Side Comparison ({compareList.length} of 3)</span>
            </h3>
            <button
              onClick={() => setCompareList([])}
              className="text-xs text-slate-400 hover:text-white cursor-pointer"
            >
              Clear Comparison
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            {compareList.map(h => (
              <div key={h.id} className="bg-slate-800 p-3.5 rounded-2xl border border-slate-700 space-y-2">
                <div className="font-bold text-sm text-white">{h.name}</div>
                <div className="text-sky-400 font-black">₹{h.pricePerNight}/night</div>
                <div className="text-slate-300 text-[11px]">⭐ {h.rating} ({h.reviewsCount} reviews)</div>
                <div className="text-slate-400 text-[11px]">📍 {h.distanceFromAttractions}</div>
                <div className="text-emerald-400 text-[11px] font-medium">✓ {h.cancellationPolicy}</div>
                <button
                  onClick={() => handleStartBooking(h)}
                  className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-1.5 rounded-lg transition cursor-pointer mt-2 text-xs"
                >
                  Book This
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hotel Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(hotel => {
          const isComparing = compareList.some(h => h.id === hotel.id);
          return (
            <div
              key={hotel.id}
              className="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-xs hover:shadow-elevated transition duration-200 flex flex-col justify-between group"
            >
              <div>
                <div className="relative h-48">
                  <ListingImage src={hotel.image} alt={hotel.name} className="h-full w-full group-hover:scale-105 transition-transform duration-300" />
                  <span className="absolute top-3 left-3 bg-slate-900/85 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {hotel.type}
                  </span>
                  <span className="absolute top-3 right-3 bg-white/95 text-slate-900 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <span>{hotel.rating}</span>
                  </span>
                </div>

                <div className="p-5 space-y-3">
                  <div>
                    <h3 className="font-black text-base text-slate-900 leading-snug">{hotel.name}</h3>
                    <div className="text-xs text-sky-600 font-semibold mt-0.5">
                      📍 {hotel.area ? `${hotel.area}, ` : ''}{hotel.destinationName}
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {hotel.description}
                  </p>

                  <div className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-100">
                    🚶 {hotel.distanceFromAttractions}
                  </div>

                  {/* Amenities */}
                  <div className="flex flex-wrap gap-1">
                    {hotel.amenities.map((am, i) => (
                      <span key={i} className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium">
                        {am}
                      </span>
                    ))}
                  </div>

                  <div className="text-[11px] text-emerald-700 font-medium">
                    🛡️ {hotel.cancellationPolicy}
                  </div>
                  {hotel.availability && <div className="text-[10px] text-slate-500">{hotel.availability}</div>}
                  {hotel.verified && <div className="text-[10px] text-emerald-700">Verified listing</div>}
                </div>
              </div>

              <div className="p-5 pt-0 border-t border-slate-100 flex items-center justify-between text-xs mt-3">
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">Price per night</span>
                  <strong className="text-base font-black text-slate-900">₹{hotel.pricePerNight}</strong>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleCompare(hotel)}
                    className={`p-2 rounded-xl border transition cursor-pointer ${
                      isComparing ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                    title="Compare this hotel"
                  >
                    <Scale className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleStartBooking(hotel)}
                    className="bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition cursor-pointer shadow-xs"
                  >
                    Book Stay
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {!loading && filtered.length === 0 && <p className="text-sm text-slate-500">No stays match those filters for {destination}.</p>}

      {/* Booking Modal Flow */}
      {bookingHotel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            {!bookingConfirmed ? (
              <form onSubmit={handleConfirmBooking} className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="font-black text-base text-slate-900">Reserve Stay</h3>
                    <p className="text-xs text-slate-500">{bookingHotel.name}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setBookingHotel(null)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Guest Name</label>
                    <input
                      type="text"
                      value={guestName}
                      onChange={e => setGuestName(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 rounded-xl border border-slate-200 outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Check-In</label>
                      <input
                        type="date"
                        value={checkIn}
                        onChange={e => setCheckIn(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 rounded-xl border border-slate-200 outline-none"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Check-Out</label>
                      <input
                        type="date"
                        value={checkOut}
                        onChange={e => setCheckOut(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 rounded-xl border border-slate-200 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Number of Guests</label>
                    <select
                      value={guests}
                      onChange={e => setGuests(Number(e.target.value))}
                      className="w-full p-2.5 bg-slate-50 rounded-xl border border-slate-200 outline-none"
                    >
                      {[1, 2, 3, 4].map(g => (
                        <option key={g} value={g}>{g} Guest{g > 1 ? 's' : ''}</option>
                      ))}
                    </select>
                  </div>

                  <div className="p-3 bg-sky-50 rounded-xl border border-sky-100 flex items-center justify-between text-xs">
                    <span className="font-bold text-sky-900">Total Est. (2 nights):</span>
                    <strong className="text-base font-black text-sky-600">
                      ₹{bookingHotel.pricePerNight * 2}
                    </strong>
                  </div>
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setBookingHotel(null)}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 font-bold text-xs text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 font-bold text-xs text-white transition cursor-pointer shadow-md shadow-sky-500/20"
                  >
                    Confirm Booking
                  </button>
                </div>
              </form>
            ) : (
              <div className="text-center py-6 space-y-4 animate-scaleUp">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <Check className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Booking Confirmed!</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Your reservation at <strong>{bookingHotel.name}</strong> is confirmed. A digital voucher has been automatically synced to your <strong>Travel Wallet</strong>.
                  </p>
                </div>

                <div className="pt-2 flex gap-2 justify-center">
                  <button
                    onClick={() => setBookingHotel(null)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      setBookingHotel(null);
                      setActiveTab('wallet');
                    }}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition cursor-pointer shadow-md"
                  >
                    View in Wallet ➔
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

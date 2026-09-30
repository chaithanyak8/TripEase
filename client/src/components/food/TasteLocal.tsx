import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useListingDestination } from '../../hooks/useListingDestination';
import { ListingImage } from '../common/ListingImage';
import { getDemoListingData, loadListingCollection } from '../../data/listingData';
import { FoodItem } from '../../types';
import { apiUrl } from '../../utils/api';
import {
  UtensilsCrossed,
  Sparkles,
  MapPin,
  ShieldCheck,
  Star,
  Check,
  Search,
  Filter,
  HelpCircle,
  Plus
} from 'lucide-react';

export const TasteLocal: React.FC = () => {
  const { activeTrip, addExpense, selectedDestination } = useApp();
  const { destination, destinationId } = useListingDestination();
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [listingNotice, setListingNotice] = useState('');
  const [selectedDietary, setSelectedDietary] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    fetchFood(controller.signal);
    return () => controller.abort();
  }, [selectedDietary, destination, destinationId]);

  const fetchFood = async (signal: AbortSignal) => {
    setLoading(true);
    setFoods([]);
    setListingNotice('');
    if (!destination) {
      setListingNotice('Choose a destination to explore local food.');
      setLoading(false);
      return;
    }

    const params = new URLSearchParams({ destination });
    if (selectedDietary !== 'All') params.set('dietary', selectedDietary);
    if (destinationId) params.set('destinationId', destinationId);
    const fallback = getDemoListingData(destination).foods;
    const result = await loadListingCollection<FoodItem>(apiUrl(`/api/food?${params}`), 'foods', fallback, signal);
    if (signal.aborted) return;
    setFoods(result.items);
    setListingNotice(result.requestFailed
      ? 'Unable to load live listings right now. Showing TripEase demo recommendations.'
      : result.usedFallback ? `Showing TripEase demo recommendations for ${destination}.` : '');
    setLoading(false);
  };

  const handleAddMealToBudget = (food: FoodItem) => {
    addExpense({
      category: "Food",
      title: `${food.dishName} at ${food.restaurantName || food.iconicRestaurant}`,
      amount: 280
    });
  };

  const filteredFoods = foods.filter(food => {
    const dietary = food.dietary.toLowerCase();
    const matchesDiet = selectedDietary === 'All' || (selectedDietary === 'Pure Veg'
      ? dietary.includes('pure veg')
      : dietary.includes('non-veg') || dietary.includes('both'));
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch = !query || [food.restaurantName, food.destination, food.area, food.cuisine, food.dishName]
      .some(value => (value || '').toLowerCase().includes(query));
    return matchesDiet && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8 animate-fadeIn">
      {/* Banner */}
      <div className="bg-gradient-to-r from-sky-600 via-teal-600 to-slate-800 text-white rounded-3xl p-6 sm:p-10 shadow-xl space-y-3">
        <div className="inline-flex items-center gap-2 bg-white/20 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
          <UtensilsCrossed className="w-3.5 h-3.5" />
          <span>Taste Local • Authentic Regional Cuisine</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
          Savor The True Flavors of India
        </h1>
        <p className="text-xs sm:text-sm text-sky-100 max-w-2xl">
          Discover neighborhood restaurants, regional specialties, vegetarian options, and coastal seafood favorites.
        </p>

        {/* "What Should I Eat Here?" Selector */}
        <div className="pt-2 bg-black/20 p-3.5 rounded-2xl max-w-xl border border-white/20">
          <div className="flex items-center gap-1.5 text-xs font-bold text-sky-200 mb-1">
            <HelpCircle className="w-4 h-4" />
            <span>Interactive: "What should I eat here?"</span>
          </div>
          <div className="pt-1 text-sm font-bold text-white">
            {destination || selectedDestination?.name || 'Choose a destination'}
          </div>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
        <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search restaurants, dishes, or areas..." className="w-full pl-10 pr-4 py-2.5 bg-white text-xs rounded-xl border border-slate-200 outline-none focus:border-sky-500" />
      </div>

      {/* Dietary Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <span className="text-[11px] font-bold text-slate-400 shrink-0 uppercase tracking-wider">Dietary:</span>
        {['All', 'Pure Veg', 'Non-Veg'].map(diet => (
          <button
            key={diet}
            onClick={() => setSelectedDietary(diet)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              selectedDietary === diet
                ? 'bg-sky-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {diet}
          </button>
        ))}
      </div>

      {loading && <p className="text-sm text-slate-500" role="status">Loading local food...</p>}
      {listingNotice && <p className="text-xs text-slate-500" role="status">{listingNotice}</p>}

      {/* Food Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredFoods.map(food => (
          <div
            key={food.id}
            className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs hover:shadow-elevated transition duration-200 flex flex-col justify-between group"
          >
            <div className="space-y-3">
              <ListingImage src={food.image} alt={food.restaurantName || food.dishName} className="h-40 w-full rounded-xl" />
              <div className="flex items-center justify-between">
                <span className="bg-sky-100 text-sky-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                  {food.mustTryBadge}
                </span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-100">
                  <MapPin className="w-3 h-3 text-emerald-600" />
                  <span>{food.hygieneRating}</span>
                </span>
              </div>

              <div>
                <h3 className="font-black text-base text-slate-900 leading-snug">
                  {food.restaurantName || food.dishName}
                </h3>
                <div className="text-xs text-sky-600 font-semibold mt-0.5">
                  📍 {food.area ? `${food.area}, ` : ''}{food.destination}
                </div>
                {food.rating !== undefined && <div className="text-[11px] text-amber-700">★ {food.rating} · {food.reviewsCount || 0} demo reviews</div>}
                {food.cuisine && <div className="text-[11px] text-slate-500">{food.cuisine} · {food.dietary}</div>}

                <div className="text-xs font-semibold text-slate-700">Signature: {food.dishName}</div>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed">
                {food.description}
              </p>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1 text-xs">
                <div className="text-slate-500 text-[11px]">Recommended Historic Eatery:</div>
                <div className="font-bold text-slate-900">{food.iconicRestaurant}</div>
                <div className="text-slate-400 text-[10px]">{food.openingHours || `Dietary: ${food.dietary}`}</div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs mt-3">
              <div>
                <span className="text-[10px] text-slate-400 block font-semibold">Typical Range</span>
                <strong className="text-sm font-black text-slate-900">{food.priceRange}</strong>
              </div>

              <button
                onClick={() => handleAddMealToBudget(food)}
                className="bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition cursor-pointer flex items-center gap-1 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add to Meal Budget</span>
              </button>
            </div>
          </div>
        ))}
      </div>
      {!loading && filteredFoods.length === 0 && <p className="text-sm text-slate-500">No food listings match those filters for {destination}.</p>}
    </div>
  );
};

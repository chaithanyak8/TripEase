import type { FoodItem, Hotel, LocalExperience, LocalGuide } from '../types';
import { getDestinationListingFallback } from '../../../shared/destinationListings.js';

export interface ListingLoadResult<T> {
  items: T[];
  usedFallback: boolean;
  requestFailed: boolean;
}

export const getDemoListingData = (destination: string) => {
  const data = getDestinationListingFallback(destination);
  return {
    hotels: data.hotels as Hotel[],
    experiences: data.experiences as LocalExperience[],
    foods: data.foods as FoodItem[],
    guides: data.guides as LocalGuide[]
  };
};

export const loadListingCollection = async <T>(
  url: string,
  collection: string,
  fallback: T[],
  signal: AbortSignal
): Promise<ListingLoadResult<T>> => {
  try {
    const response = await fetch(url, { signal });
    if (!response.ok) throw new Error('Listing request failed');

    const payload = await response.json();
    const items = payload?.[collection];
    if (Array.isArray(items) && items.length > 0) {
      return { items: items as T[], usedFallback: false, requestFailed: false };
    }
    return { items: fallback, usedFallback: fallback.length > 0, requestFailed: false };
  } catch {
    if (signal.aborted) return { items: [], usedFallback: false, requestFailed: false };
    return { items: fallback, usedFallback: fallback.length > 0, requestFailed: true };
  }
};

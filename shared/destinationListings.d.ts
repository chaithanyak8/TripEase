export interface DemoHotel {
  id: string;
  name: string;
  area: string;
  destinationId: string;
  destinationName: string;
  type: string;
  image: string;
  pricePerNight: number;
  rating: number;
  reviewsCount: number;
  amenities: string[];
  distanceFromAttractions: string;
  cancellationPolicy: string;
  roomsAvailable: number;
  availability: string;
  verified: boolean;
  description: string;
}

export interface DemoExperience {
  id: string;
  title: string;
  destinationId: string;
  category: string;
  host: string;
  hostVerified: boolean;
  price: number;
  duration: string;
  languages: string[];
  rating: number;
  reviewsCount: number;
  image: string;
  description: string;
  impactNote: string;
  location: string;
  availableSlots: number;
}

export interface DemoFood {
  id: string;
  dishName: string;
  restaurantName: string;
  destination: string;
  area: string;
  cuisine: string;
  dietary: string;
  iconicRestaurant: string;
  priceRange: string;
  hygieneRating: string;
  description: string;
  mustTryBadge: string;
  rating: number;
  reviewsCount: number;
  image: string;
  openingHours: string;
}

export interface DemoGuide {
  id: string;
  name: string;
  destinationId: string;
  destinationName: string;
  photo: string;
  languages: string[];
  expertise: string[];
  dailyFee: number;
  experienceYears: number;
  rating: number;
  reviewsCount: number;
  verifiedBadge: string;
  verified: boolean;
  bio: string;
  phone: string;
}

export interface DestinationListings {
  hotels: DemoHotel[];
  experiences: DemoExperience[];
  foods: DemoFood[];
  guides: DemoGuide[];
}

export const mangaluruDestination: {
  id: string;
  name: string;
  state: string;
  region: string;
  category: string;
  secondaryCategory: string;
  image: string;
  description: string;
  coordinates: { lat: number; lng: number };
  bestTimeToVisit: string;
  approxBudgetPerDay: number;
  crowdLevel: string;
  travelDifficulty: string;
  safetyRating: number;
  safetyInfo: string;
  isBeyondTheCrowd: boolean;
  popularActivities: string[];
  localSpecialty: string;
  tags: string[];
};

export const mangaluruListings: DestinationListings;
export function normalizeListingDestination(value?: string): string;
export function getDestinationListingFallback(destination?: string): DestinationListings;

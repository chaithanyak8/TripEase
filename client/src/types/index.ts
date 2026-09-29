// TripEase - Type Definitions
// Smart India Hackathon 2026 Student Innovation (Problem Statement 26204)

export type UserRole = 'USER' | 'BUSINESS' | 'GUIDE' | 'ADMIN';
export type Language = 'en' | 'hi' | 'kn';

export interface TravelDNA {
  archetype: string;
  traits: {
    nature: number;
    culture: number;
    food: number;
    adventure: number;
  };
  tagline: string;
}

export interface User {
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  travelDNA: TravelDNA;
  avatar?: string;
}

export interface Destination {
  id: string;
  name: string;
  city?: string;
  aliases?: string[];
  state: string;
  region: string;
  category: 'Beaches' | 'Mountains' | 'Heritage' | 'Temples' | 'Wildlife' | 'Adventure' | 'Food' | 'Hidden Gems' | 'Weekend';
  secondaryCategory?: string;
  image: string;
  description: string;
  shortDescription?: string;
  coordinates: { lat: number; lng: number };
  bestTimeToVisit: string;
  approxBudgetPerDay: number;
  crowdLevel: 'Low' | 'Moderate' | 'High';
  travelDifficulty: 'Easy' | 'Moderate' | 'Challenging';
  safetyRating: number;
  safetyInfo: string;
  isBeyondTheCrowd: boolean;
  beyondCrowdReason?: string;
  popularActivities: string[];
  localSpecialty: string;
  tags: string[];
  categories?: string[];
  idealDuration?: string;
  estimatedDailyBudget?: number;
  weather?: { summary: string; bestSeason: string };
  popularFor?: string[];
  topAttractions?: string[];
  safetyTips?: string[];
  travelTips?: string[];
  nearbyPlaces?: string[];
  transportOptions?: string[];
  dataQuality?: string;
}

export interface Hotel {
  id: string;
  name: string;
  area?: string;
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
  availability?: string;
  verified?: boolean;
  description: string;
}

export interface LocalExperience {
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
  location?: string;
  availableSlots?: number;
}

export interface LocalGuide {
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
  verified?: boolean;
  bio: string;
  phone: string;
}

export interface TransportOption {
  id: string;
  origin: string;
  destination: string;
  route?: string;
  travelers?: number;
  totalEstimatedCost?: number;
  type: string;
  duration: string;
  distanceKm: number | string;
  estimatedCost: number;
  frequency: string;
  ecoRating: string;
  badge: string;
  amenities: string[];
}

export interface FoodItem {
  id: string;
  dishName: string;
  destination: string;
  restaurantName?: string;
  area?: string;
  cuisine?: string;
  dietary: string;
  iconicRestaurant: string;
  priceRange: string;
  hygieneRating: string;
  description: string;
  mustTryBadge: string;
  rating?: number;
  reviewsCount?: number;
  image?: string;
  openingHours?: string;
}

export interface DayPlanDetail {
  time: string;
  activity: string;
  cost: number;
  location: string;
  tips: string;
}

export interface DayPlan {
  day: number;
  date: string;
  title: string;
  theme: string;
  morning: DayPlanDetail;
  afternoon: DayPlanDetail;
  evening: DayPlanDetail;
}

export interface ExpenseItem {
  id: string;
  category: 'Hotel' | 'Transport' | 'Food' | 'Activities' | 'Shopping' | 'Emergency' | 'Buffer / Misc';
  title: string;
  amount: number;
  date?: string;
}

export interface Itinerary {
  id: string;
  title: string;
  origin: string;
  destination: string;
  durationDays: number;
  travelers: number;
  travelType?: string;
  travelStyle?: string;
  targetDestination?: Destination;
  totalBudget: number;
  estimatedCost: number;
  spent?: number;
  remainingBudget?: number;
  remaining?: number;
  hotel?: Partial<Hotel>;
  transport?: Partial<TransportOption>;
  experiences?: LocalExperience[];
  restaurants?: FoodItem[];
  guides?: LocalGuide[];
  weather?: Record<string, string>;
  safety?: string;
  days: DayPlan[];
  expenses: ExpenseItem[];
  weatherAlert?: string;
  weatherSummary?: string;
  safetyTip?: string;
  localEtiquette?: string;
  tourismImpact?: {
    localBusinessesSupported: number;
    localGuidesEmployed: number;
    localSpendAmount: number;
    localSpendPercentage: number;
    carbonFootprint: string;
  };
}

export interface Booking {
  id: string;
  itemType: 'Hotel' | 'Transport' | 'Experience' | 'Local Guide';
  title: string;
  destination?: string;
  checkIn?: string;
  checkOut?: string;
  date?: string;
  guests?: number;
  amount: number;
  status: 'Confirmed' | 'Pending' | 'Completed';
  qrCode: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'info' | 'weather' | 'budget' | 'alert';
  read: boolean;
}

export interface Review {
  id: string;
  author: string;
  travelerType: string;
  rating: number;
  date: string;
  itemType: string;
  itemTitle: string;
  comment: string;
  verifiedBooking: boolean;
  likes: number;
}

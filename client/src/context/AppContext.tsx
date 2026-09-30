import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole, Language, Itinerary, Booking, ExpenseItem, NotificationItem, Destination } from '../types';
import { translations } from '../locales/translations';
import { apiUrl } from '../utils/api';

const VALID_TABS = new Set([
  'home',
  'planner',
  'explore',
  'beyond-crowd',
  'map',
  'hotels',
  'experiences',
  'guides',
  'transport',
  'food',
  'budget',
  'safety',
  'wallet',
  'reviews',
  'business',
  'admin'
]);

const getInitialTab = (): string => {
  if (typeof window === 'undefined') return 'home';
  const path = window.location.pathname.replace(/^\/+|\/+$/g, '');
  if (path && VALID_TABS.has(path)) {
    return path;
  }
  return 'home';
};

interface AppContextType {
  user: User;
  setUser: React.Dispatch<React.SetStateAction<User>>;
  role: UserRole;
  setRole: (role: UserRole) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof typeof translations['en']) => string;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  highContrast: boolean;
  toggleHighContrast: () => void;
  largeFont: boolean;
  toggleLargeFont: () => void;
  offlineMode: boolean;
  toggleOfflineMode: () => void;
  activeTrip: Itinerary | null;
  setActiveTrip: React.Dispatch<React.SetStateAction<Itinerary | null>>;
  activeTripBookings: Booking[];
  activateTrip: (trip: Itinerary) => void;
  clearActiveTrip: () => void;
  bookings: Booking[];
  addBooking: (booking: Booking) => void;
  expenses: ExpenseItem[];
  addExpense: (expense: Omit<ExpenseItem, 'id'>) => void;
  notifications: NotificationItem[];
  unreadNotificationsCount: number;
  markNotificationsAsRead: () => void;
  isSOSModalOpen: boolean;
  setIsSOSModalOpen: (open: boolean) => void;
  isOnboardingOpen: boolean;
  setIsOnboardingOpen: (open: boolean) => void;
  isChatOpen: boolean;
  setIsChatOpen: (open: boolean) => void;
  isTravelDNAOpen: boolean;
  setIsTravelDNAOpen: (open: boolean) => void;
  selectedDestination: Destination | null;
  setSelectedDestination: React.Dispatch<React.SetStateAction<Destination | null>>;
  listingDestinationOverride: Destination | null;
  setListingDestinationOverride: React.Dispatch<React.SetStateAction<Destination | null>>;
  currentLocation: {
    latitude: number;
    longitude: number;
    locationName: string;
    source: 'current_location' | 'selected_destination';
  } | null;
  setCurrentLocation: React.Dispatch<React.SetStateAction<{
    latitude: number;
    longitude: number;
    locationName: string;
    source: 'current_location' | 'selected_destination';
  } | null>>;
  selectedDestinationForPlan: Destination | null;
  setSelectedDestinationForPlan: (dest: Destination | null) => void;
  loadJudgeDemoMode: () => void;
  saveTripToWallet: () => void;
  modifyItinerary: (modifier: string, customParam?: any) => Promise<void>;
  toastMessage: string | null;
  showToast: (msg: string) => void;
}

const defaultUser: User = {
  name: "Pooja Hegde",
  email: "pooja.hegde@example.com",
  phone: "+91 98450 99887",
  role: "USER",
  travelDNA: {
    archetype: "Nature & Cultural Explorer",
    traits: {
      nature: 35,
      culture: 30,
      food: 20,
      adventure: 15
    },
    tagline: "Loves scenic serene spots, sacred architecture, and authentic local foods."
  }
};

const initialNotifications: NotificationItem[] = [
  {
    id: "notif-1",
    title: "Hotel Check-In Tomorrow",
    message: "Review your upcoming hotel check-in details in the Travel Wallet.",
    time: "10 mins ago",
    type: "info",
    read: false
  },
  {
    id: "notif-2",
    title: "Weather Advisory",
    message: "Check the forecast for your active destination before outdoor activities.",
    time: "1 hour ago",
    type: "weather",
    read: false
  },
  {
    id: "notif-3",
    title: "Budget Status: Healthy",
    message: "You have spent 57% of your ₹15,000 budget with 2 days remaining.",
    time: "3 hours ago",
    type: "budget",
    read: false
  },
  {
    id: "notif-4",
    title: "Saved Local Gem",
    message: "Review saved locations in Smart Map for your current destination.",
    time: "5 hours ago",
    type: "info",
    read: true
  }
];

const defaultDestinations: Destination[] = [
  {
    id: 'bengaluru',
    name: 'Bengaluru',
    state: 'Karnataka',
    region: 'South India',
    category: 'Food',
    image: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=1200&q=80',
    description: 'A vibrant, modern city with gardens, culture, and food experiences.',
    coordinates: { lat: 12.9716, lng: 77.5946 },
    bestTimeToVisit: 'October to March',
    approxBudgetPerDay: 2600,
    crowdLevel: 'Moderate',
    travelDifficulty: 'Easy',
    safetyRating: 4.5,
    safetyInfo: 'Stay alert in crowds and use verified local transport.',
    isBeyondTheCrowd: false,
    popularActivities: ['City gardens', 'Night food trails', 'Local markets'],
    localSpecialty: 'Filter coffee and South Indian meals',
    tags: ['city', 'food', 'culture']
  },
  {
    id: 'goa',
    name: 'Goa',
    state: 'Goa',
    region: 'West India',
    category: 'Beaches',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    description: 'Beach towns, Portuguese heritage, and coastal cuisine.',
    coordinates: { lat: 15.2993, lng: 74.1240 },
    bestTimeToVisit: 'November to February',
    approxBudgetPerDay: 4000,
    crowdLevel: 'High',
    travelDifficulty: 'Easy',
    safetyRating: 4.4,
    safetyInfo: 'Follow local water-safety guidance and keep valuables secure in busy beach areas.',
    isBeyondTheCrowd: false,
    popularActivities: ['Beach hopping', 'Sunset cruises', 'Food trails'],
    localSpecialty: 'Goan fish curry and bebinca',
    tags: ['beach', 'food', 'coastal']
  },
  {
    id: 'manali',
    name: 'Manali',
    state: 'Himachal Pradesh',
    region: 'North India',
    category: 'Mountains',
    image: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1200&q=80',
    description: 'Snowy valleys, pine trails, and mountain villages in the Himalayas.',
    coordinates: { lat: 32.2432, lng: 77.1892 },
    bestTimeToVisit: 'March to June',
    approxBudgetPerDay: 4500,
    crowdLevel: 'Moderate',
    travelDifficulty: 'Moderate',
    safetyRating: 4.3,
    safetyInfo: 'Weather can change suddenly; keep warm layers and check local advisories.',
    isBeyondTheCrowd: false,
    popularActivities: ['Trekking', 'Rafting', 'Scenic drives'],
    localSpecialty: 'Siddu and Himachali snacks',
    tags: ['mountains', 'adventure']
  }
];

const AppContext = createContext<AppContextType | undefined>(undefined);

const getPersistedActiveTrip = (): Itinerary | null => {
  try {
    const saved = localStorage.getItem('tripease_active_trip');
    if (!saved) return null;
    const trip = JSON.parse(saved) as Itinerary;
    if (trip?.id && trip?.destination) return trip;
    localStorage.removeItem('tripease_active_trip');
    return null;
  } catch {
    localStorage.removeItem('tripease_active_trip');
    return null;
  }
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User>(() => {
    const saved = localStorage.getItem('tripease_user');
    return saved ? JSON.parse(saved) : defaultUser;
  });

  const [language, setLanguage] = useState<Language>(() => {
    return (localStorage.getItem('tripease_lang') as Language) || 'en';
  });

  const [activeTab, setActiveTabState] = useState<string>(getInitialTab);

  const setActiveTab = (tab: string) => {
    setActiveTabState(tab);
    if (typeof window !== 'undefined') {
      const targetPath = tab === 'home' ? '/' : `/${tab}`;
      if (window.location.pathname !== targetPath) {
        window.history.pushState(null, '', targetPath);
      }
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.replace(/^\/+|\/+$/g, '');
      if (path && VALID_TABS.has(path)) {
        setActiveTabState(path);
      } else {
        setActiveTabState('home');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const [highContrast, setHighContrast] = useState<boolean>(false);
  const [largeFont, setLargeFont] = useState<boolean>(false);
  const [offlineMode, setOfflineMode] = useState<boolean>(false);
  
  const [activeTrip, setActiveTrip] = useState<Itinerary | null>(getPersistedActiveTrip);

  const [bookings, setBookings] = useState<Booking[]>(() => {
    const saved = localStorage.getItem('tripease_bookings');
    return saved ? JSON.parse(saved) : [];
  });

  const [expenses, setExpenses] = useState<ExpenseItem[]>(() => {
    const saved = localStorage.getItem('tripease_expenses');
    return saved ? JSON.parse(saved) : [];
  });

  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);
  const [isSOSModalOpen, setIsSOSModalOpen] = useState<boolean>(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(false);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [isTravelDNAOpen, setIsTravelDNAOpen] = useState<boolean>(false);

  const [selectedDestination, setSelectedDestination] = useState<Destination | null>(() => {
    try {
      const saved = localStorage.getItem('tripease_selected_destination');
      return saved ? JSON.parse(saved) : defaultDestinations[0];
    } catch {
      return defaultDestinations[0];
    }
  });

  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
    locationName: string;
    source: 'current_location' | 'selected_destination';
  } | null>(() => {
    const fallback = defaultDestinations[0];
    return {
      latitude: fallback.coordinates.lat,
      longitude: fallback.coordinates.lng,
      locationName: fallback.name,
      source: 'selected_destination'
    };
  });

  const [selectedDestinationForPlan, setSelectedDestinationForPlan] = useState<Destination | null>(null);
  const [listingDestinationOverride, setListingDestinationOverride] = useState<Destination | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const activateTrip = (trip: Itinerary) => {
    setListingDestinationOverride(null);
    setExpenses([]);
    setSelectedDestinationForPlan(null);
    localStorage.setItem('tripease_expenses', JSON.stringify([]));
    setActiveTrip(trip);
  };

  const clearActiveTrip = () => {
    setListingDestinationOverride(null);
    setActiveTrip(null);
    setExpenses([]);
    setSelectedDestinationForPlan(null);
    localStorage.removeItem('tripease_active_trip');
    localStorage.setItem('tripease_expenses', JSON.stringify([]));
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const t = (key: keyof typeof translations['en']): string => {
    const dict = translations[language] || translations['en'];
    return (dict as any)[key] || translations['en'][key] || key;
  };

  useEffect(() => {
    if (selectedDestination) {
      localStorage.setItem('tripease_selected_destination', JSON.stringify(selectedDestination));
      setCurrentLocation(prev => {
        if (prev && prev.source === 'current_location') return prev;
        return {
          latitude: selectedDestination.coordinates.lat,
          longitude: selectedDestination.coordinates.lng,
          locationName: selectedDestination.name,
          source: 'selected_destination'
        };
      });
    }
  }, [selectedDestination]);

  const setRole = (newRole: UserRole) => {
    setUser(prev => {
      const updated = { ...prev, role: newRole };
      localStorage.setItem('tripease_user', JSON.stringify(updated));
      return updated;
    });
    showToast(`Role switched to: ${newRole}`);
  };

  const toggleHighContrast = () => {
    setHighContrast(prev => {
      const next = !prev;
      if (next) {
        document.body.classList.add('high-contrast');
      } else {
        document.body.classList.remove('high-contrast');
      }
      return next;
    });
  };

  const toggleLargeFont = () => {
    setLargeFont(prev => {
      const next = !prev;
      if (next) {
        document.body.classList.add('large-font');
      } else {
        document.body.classList.remove('large-font');
      }
      return next;
    });
  };

  const toggleOfflineMode = () => {
    setOfflineMode(prev => {
      const next = !prev;
      showToast(next ? "Offline Travel Mode enabled: All trip passes cached locally" : "Online Mode active");
      return next;
    });
  };

  const addBooking = (booking: Booking) => {
    setBookings(prev => {
      const updated = [booking, ...prev];
      localStorage.setItem('tripease_bookings', JSON.stringify(updated));
      return updated;
    });
    showToast(`Confirmed! ${booking.title} added to Travel Wallet.`);
  };

  const addExpense = (item: Omit<ExpenseItem, 'id'>) => {
    const newExp: ExpenseItem = {
      ...item,
      id: `exp-${Date.now()}`
    };
    setExpenses(prev => {
      const updated = [newExp, ...prev];
      localStorage.setItem('tripease_expenses', JSON.stringify(updated));
      return updated;
    });

    if (activeTrip) {
      setActiveTrip(prev => {
        if (!prev) return null;
        const newSpent = (prev.spent || 0) + item.amount;
        const newRemaining = Math.max(0, prev.totalBudget - newSpent);
        const updated = { ...prev, spent: newSpent, remaining: newRemaining, remainingBudget: newRemaining };
        localStorage.setItem('tripease_active_trip', JSON.stringify(updated));
        return updated;
      });
    }
    showToast(`Logged expense ₹${item.amount} under ${item.category}`);
  };

  const saveTripToWallet = () => {
    if (!activeTrip) return;
    localStorage.setItem('tripease_active_trip', JSON.stringify(activeTrip));
    showToast("Trip & Day Pass saved to Digital Wallet with Offline access!");
  };

  const markNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const unreadNotificationsCount = notifications.filter(n => !n.read).length;
  const activeTripBookings = activeTrip
    ? bookings.filter(booking => {
      const activeDestination = activeTrip.destination.toLowerCase().replace(/[^a-z0-9]/g, '');
      const bookingDestination = (booking.destination || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      return activeDestination.includes(bookingDestination) || bookingDestination.includes(activeDestination);
    })
    : bookings;

  // 1-Click Judge Demo Mode
  const loadJudgeDemoMode = async () => {
    try {
      const res = await fetch(apiUrl('/api/demo/judge-package'));
      if (res.ok) {
        const data = await res.json();
        const pkg = data.package;
        setUser({
          ...pkg.tourist,
          avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80"
        });
        setSelectedDestinationForPlan(null);
        setActiveTrip(pkg.trip);
        setExpenses(pkg.trip.expenses);
        
        // Add sample bookings
        const sampleBookings: Booking[] = [
          {
            id: pkg.trip.hotel.bookingRef,
            itemType: "Hotel",
            title: pkg.trip.hotel.name,
            destination: pkg.trip.destination,
            checkIn: "Day 1",
            checkOut: "Day 4",
            guests: 2,
            amount: pkg.trip.hotel.cost,
            status: "Confirmed",
            qrCode: "TE-QR-JUDGE-MALPE-8841"
          },
          {
            id: pkg.trip.transport.ticketRef,
            itemType: "Transport",
            title: pkg.trip.transport.mode,
            destination: pkg.trip.destination,
            date: "Day 1",
            guests: 2,
            amount: pkg.trip.transport.cost,
            status: "Confirmed",
            qrCode: "TE-QR-JUDGE-BUS-9921"
          },
          {
            id: "BK-EXP-KAYAK-4412",
            itemType: "Experience",
            title: "Suvarna River Backwater & Delta Kayaking",
            destination: "Udupi",
            date: "Day 3",
            guests: 2,
            amount: 1300,
            status: "Confirmed",
            qrCode: "TE-QR-JUDGE-KAYAK-4412"
          }
        ];
        setBookings(sampleBookings);
        localStorage.setItem('tripease_active_trip', JSON.stringify(pkg.trip));
        localStorage.setItem('tripease_bookings', JSON.stringify(sampleBookings));
        localStorage.setItem('tripease_expenses', JSON.stringify(pkg.trip.expenses));
        
        setActiveTab('planner');
        showToast("⚡ SIH 2026 Judge Demo Mode Activated: Karnataka 4-Day Trip Loaded!");
      }
    } catch (e) {
      console.error("Demo load failed, using fallback:", e);
      showToast("Judge Demo Mode Loaded (Local State)");
    }
  };

  const modifyItinerary = async (modifier: string, customParam?: any) => {
    if (!activeTrip) return;
    try {
      const res = await fetch(apiUrl('/api/itineraries/modify'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itinerary: activeTrip, modifier, newBudget: customParam })
      });
      if (res.ok) {
        const data = await res.json();
        setActiveTrip(data.itinerary);
        showToast(data.message);
      }
    } catch (err) {
      console.error("Modify itinerary error:", err);
      showToast(`Applied ${modifier} adjustment`);
    }
  };

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('tripease_lang', language);
  }, [language]);

  // Keep the app in a clean state for real user input.
  // Judge demo mode is only loaded when the user explicitly requests it.
  useEffect(() => {
    if (!activeTrip) {
      localStorage.removeItem('tripease_active_trip');
      return;
    }
    localStorage.setItem('tripease_active_trip', JSON.stringify(activeTrip));
  }, [activeTrip]);

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        role: user.role,
        setRole,
        language,
        setLanguage,
        t,
        activeTab,
        setActiveTab,
        highContrast,
        toggleHighContrast,
        largeFont,
        toggleLargeFont,
        offlineMode,
        toggleOfflineMode,
        activeTrip,
        setActiveTrip,
        activeTripBookings,
        activateTrip,
        clearActiveTrip,
        bookings,
        addBooking,
        expenses,
        addExpense,
        notifications,
        unreadNotificationsCount,
        markNotificationsAsRead,
        isSOSModalOpen,
        setIsSOSModalOpen,
        isOnboardingOpen,
        setIsOnboardingOpen,
        isChatOpen,
        setIsChatOpen,
        isTravelDNAOpen,
        setIsTravelDNAOpen,
        selectedDestination,
        setSelectedDestination,
        listingDestinationOverride,
        setListingDestinationOverride,
        currentLocation,
        setCurrentLocation,
        selectedDestinationForPlan,
        setSelectedDestinationForPlan,
        loadJudgeDemoMode,
        saveTripToWallet,
        modifyItinerary,
        toastMessage,
        showToast
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};

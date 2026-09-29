import { useApp } from '../context/AppContext';

export const useListingDestination = () => {
  const { activeTrip, selectedDestination, listingDestinationOverride } = useApp();
  return {
    destination: listingDestinationOverride?.name || activeTrip?.destination || selectedDestination?.name || '',
    destinationId: listingDestinationOverride?.id || (activeTrip
      ? activeTrip.targetDestination?.id
      : selectedDestination?.id)
  };
};

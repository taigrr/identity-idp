'use client';

/**
 * USPS Locations Page
 * /idv/in-person/usps-locations
 * Search and select a USPS Post Office location for in-person proofing
 * Mirrors: app/controllers/idv/in_person/usps_locations_controller.rb
 */

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface UspsLocation {
  id: string;
  name: string;
  streetAddress: string;
  city: string;
  state: string;
  zipCode: string;
  formattedCityStateZip: string;
  distance: number;
  weekdayHours: string;
  saturdayHours: string;
  sundayHours: string;
}

interface SearchAddress {
  street_address: string;
  city: string;
  state: string;
  zip_code: string;
}

export default function UspsLocationsPage() {
  const router = useRouter();
  const [address, setAddress] = useState<SearchAddress>({
    street_address: '',
    city: '',
    state: '',
    zip_code: '',
  });
  const [locations, setLocations] = useState<UspsLocation[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<UspsLocation | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = useCallback(async () => {
    setIsSearching(true);
    setError(null);
    setLocations([]);
    setSelectedLocation(null);

    try {
      const response = await fetch('/api/idv/in-person/usps-locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to search for locations');
        return;
      }

      setLocations(data.locations || []);
      setHasSearched(true);
    } catch (err) {
      setError('Failed to search for locations. Please try again.');
    } finally {
      setIsSearching(false);
    }
  }, [address]);

  const handleSelectLocation = useCallback(async () => {
    if (!selectedLocation) return;

    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/idv/in-person/usps-locations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usps_location: {
            selected_location: {
              name: selectedLocation.name,
              street_address: selectedLocation.streetAddress,
              formatted_city_state_zip: selectedLocation.formattedCityStateZip,
              weekday_hours: selectedLocation.weekdayHours,
              saturday_hours: selectedLocation.saturdayHours,
              sunday_hours: selectedLocation.sundayHours,
            },
          },
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.error || 'Failed to save location');
        return;
      }

      // Navigate to the ready to verify page
      router.push('/idv/in-person/ready-to-verify');
    } catch (err) {
      setError('Failed to save location. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [selectedLocation, router]);

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Find a Post Office</h1>

      <p className="text-gray-600 mb-6">
        Enter your address to find nearby Post Office locations where you can verify your identity in person.
      </p>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Search Form */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
        <h2 className="font-semibold mb-4">Search by address</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="street_address" className="block text-sm font-medium text-gray-700 mb-1">
              Street address
            </label>
            <input
              type="text"
              id="street_address"
              value={address.street_address}
              onChange={(e) => setAddress({ ...address, street_address: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-1">
              <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                City
              </label>
              <input
                type="text"
                id="city"
                value={address.city}
                onChange={(e) => setAddress({ ...address, city: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
                State
              </label>
              <input
                type="text"
                id="state"
                value={address.state}
                onChange={(e) => setAddress({ ...address, state: e.target.value.toUpperCase().slice(0, 2) })}
                maxLength={2}
                placeholder="XX"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 uppercase"
              />
            </div>
            <div>
              <label htmlFor="zip_code" className="block text-sm font-medium text-gray-700 mb-1">
                ZIP code
              </label>
              <input
                type="text"
                id="zip_code"
                value={address.zip_code}
                onChange={(e) => setAddress({ ...address, zip_code: e.target.value.replace(/\D/g, '').slice(0, 5) })}
                maxLength={5}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={handleSearch}
            disabled={isSearching || !address.street_address || !address.city || !address.state || !address.zip_code}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSearching ? 'Searching...' : 'Search for Post Offices'}
          </button>
        </div>
      </div>

      {/* Results */}
      {hasSearched && (
        <div className="mb-6">
          <h2 className="font-semibold mb-4">
            {locations.length > 0
              ? `${locations.length} Post Office${locations.length > 1 ? 's' : ''} found`
              : 'No Post Offices found'}
          </h2>

          {locations.length === 0 && (
            <p className="text-gray-600">
              Try searching with a different address or expanding your search area.
            </p>
          )}

          <div className="space-y-4">
            {locations.map((location) => (
              <div
                key={location.id}
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                  selectedLocation?.id === location.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedLocation(location)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && setSelectedLocation(location)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">{location.name}</h3>
                    <p className="text-gray-600">{location.streetAddress}</p>
                    <p className="text-gray-600">{location.formattedCityStateZip}</p>
                  </div>
                  <span className="text-sm text-gray-500">{location.distance} mi</span>
                </div>
                <div className="mt-3 text-sm text-gray-500">
                  <p>Weekdays: {location.weekdayHours}</p>
                  <p>Saturday: {location.saturdayHours}</p>
                  <p>Sunday: {location.sundayHours}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Continue Button */}
      {selectedLocation && (
        <button
          type="button"
          onClick={handleSelectLocation}
          disabled={isSaving}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSaving ? 'Saving...' : 'Continue with this Post Office'}
        </button>
      )}
    </div>
  );
}

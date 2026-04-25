/**
 * USPS Locations API
 * POST /api/idv/in-person/usps-locations - Search for nearby USPS locations
 * PUT /api/idv/in-person/usps-locations - Save selected location
 * 
 * Mirrors: app/controllers/idv/in_person/usps_locations_controller.rb
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const SESSION_COOKIE_NAME = 'session_id';

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
  isPilot?: boolean;
}

interface SearchParams {
  street_address: string;
  city: string;
  state: string;
  zip_code: string;
}

interface SessionData {
  userId?: string;
}

// TODO: Replace with actual implementations
async function getSession(sessionId: string): Promise<SessionData | null> {
  console.log('Getting session:', sessionId?.slice(0, 8) + '...');
  return null;
}

async function searchUspsLocations(address: SearchParams): Promise<UspsLocation[]> {
  console.log('Searching USPS locations near:', address);
  // TODO: Replace with actual USPS API call
  // proofer.request_facilities(candidate, enhanced_ipp?)
  
  // Mock response for development
  return [
    {
      id: '1',
      name: 'Downtown Post Office',
      streetAddress: '100 Main St',
      city: 'Washington',
      state: 'DC',
      zipCode: '20001',
      formattedCityStateZip: 'Washington, DC 20001',
      distance: 0.5,
      weekdayHours: '9:00 AM - 5:00 PM',
      saturdayHours: '9:00 AM - 1:00 PM',
      sundayHours: 'Closed',
    },
    {
      id: '2',
      name: 'Capitol Hill Post Office',
      streetAddress: '200 E Capitol St',
      city: 'Washington',
      state: 'DC',
      zipCode: '20003',
      formattedCityStateZip: 'Washington, DC 20003',
      distance: 1.2,
      weekdayHours: '8:00 AM - 6:00 PM',
      saturdayHours: '9:00 AM - 12:00 PM',
      sundayHours: 'Closed',
    },
  ];
}

async function saveSelectedLocation(
  userId: string,
  location: Partial<UspsLocation>,
): Promise<boolean> {
  console.log('Saving selected location for user:', userId, location);
  // TODO: Replace with actual database operation
  // enrollment.update!(selected_location_details: location)
  return true;
}

function isValidAddress(address: SearchParams): boolean {
  // Check for invalid characters (USPS API requirements)
  const validPattern = /^[a-zA-Z0-9\s\-.,#]+$/;
  return (
    validPattern.test(address.street_address || '') &&
    validPattern.test(address.city || '') &&
    /^[A-Z]{2}$/.test(address.state || '') &&
    /^\d{5}(-\d{4})?$/.test(address.zip_code || '')
  );
}

/**
 * POST - Search for USPS locations
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const address: SearchParams = {
      street_address: body.address?.street_address || body.street_address,
      city: body.address?.city || body.city,
      state: body.address?.state || body.state,
      zip_code: body.address?.zip_code || body.zip_code,
    };

    // Validate address
    if (!isValidAddress(address)) {
      return NextResponse.json(
        { error: 'Unsupported characters in address field.' },
        { status: 422 },
      );
    }

    // Search for locations
    const locations = await searchUspsLocations(address);

    if (locations.length === 0) {
      return NextResponse.json(
        { error: 'No USPS locations found', locations: [] },
        { status: 200 },
      );
    }

    return NextResponse.json({ locations });
  } catch (error) {
    console.error('USPS location search error:', error);
    return NextResponse.json(
      { error: 'Failed to search for locations' },
      { status: 500 },
    );
  }
}

/**
 * PUT - Save selected location
 */
export async function PUT(request: NextRequest) {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionId) {
    return NextResponse.json(
      { success: false, error: 'Not authenticated' },
      { status: 401 },
    );
  }

  const session = await getSession(sessionId);
  if (!session?.userId) {
    return NextResponse.json(
      { success: false, error: 'Not authenticated' },
      { status: 401 },
    );
  }

  try {
    const body = await request.json();
    const location = body.usps_location?.selected_location || body.usps_location || body;

    // Validate required fields
    if (!location.name || !location.street_address) {
      return NextResponse.json(
        { success: false, error: 'Missing required location fields' },
        { status: 400 },
      );
    }

    // Save the selected location
    const success = await saveSelectedLocation(session.userId, {
      name: location.name,
      streetAddress: location.street_address,
      formattedCityStateZip: location.formatted_city_state_zip,
      weekdayHours: location.weekday_hours,
      saturdayHours: location.saturday_hours,
      sundayHours: location.sunday_hours,
    });

    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Failed to save location' },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Save location error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save location' },
      { status: 500 },
    );
  }
}

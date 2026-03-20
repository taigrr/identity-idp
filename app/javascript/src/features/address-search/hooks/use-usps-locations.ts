import { request } from '@/services/request';

import type { FormattedLocation, LocationQuery, PostOffice } from '../types';
import { formatLocations, snakeCase, transformKeys } from '../utils';

export async function requestUspsLocations({
  locationsURL,
  address,
}: {
  locationsURL: string;
  address: LocationQuery;
}): Promise<FormattedLocation[]> {
  const response = await request<PostOffice[]>(locationsURL, {
    method: 'post',
    json: { address: transformKeys(address, snakeCase) },
  });

  return formatLocations(response);
}

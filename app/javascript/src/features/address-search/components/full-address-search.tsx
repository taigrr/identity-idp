import { useState } from 'react';

import { Alert, PageHeading } from '@/components';
import { t } from '@/i18n';
import { InPersonLocations, NoInPersonLocationsDisplay } from '@/features/address-search';
import type { LocationQuery, FormattedLocation , FullAddressSearchProps } from '@/features/address-search/types';


import FullAddressSearchInput from './full-address-search-input';
import SkipUspsFacilitiesApiErrorMessage from './skip-usps-facilities-api-error-message';

function FullAddressSearch({
  disabled,
  handleLocationSelect,
  locationsURL,
  noInPersonLocationsDisplay = NoInPersonLocationsDisplay,
  onFoundLocations,
  registerField,
  resultsHeaderComponent,
  usStatesTerritories,
  resultsSectionHeading,
  usesErrorComponent,
}: FullAddressSearchProps) {
  const [apiError, setApiError] = useState<Error | null>(null);
  const [foundAddress, setFoundAddress] = useState<LocationQuery | null>(null);
  const [locationResults, setLocationResults] = useState<FormattedLocation[] | null | undefined>(
    null,
  );
  const [isLoadingLocations, setLoadingLocations] = useState<boolean>(false);

  return (
    <>
      {!usesErrorComponent && apiError && (
        <Alert type="error" className="margin-bottom-4">
          {t('idv.failure.exceptions.post_office_search_error')}
        </Alert>
      )}
      {handleLocationSelect ? (
        <>
          <PageHeading>{t('in_person_proofing.headings.po_search.location')}</PageHeading>
          <p>{t('in_person_proofing.body.location.po_search.po_search_about')}</p>
        </>
      ) : (
        <p>{t('in_person_proofing.body.location.po_search.address_search_label')}</p>
      )}
      <FullAddressSearchInput
        usStatesTerritories={usStatesTerritories}
        registerField={registerField}
        onContinue={handleLocationSelect}
        onFoundLocations={(
          address: LocationQuery | null,
          locations: FormattedLocation[] | null | undefined,
        ) => {
          setFoundAddress(address);
          setLocationResults(locations);
          onFoundLocations(locations);
          setApiError(null);
        }}
        onLoadingLocations={setLoadingLocations}
        onError={setApiError}
        disabled={disabled}
        locationsURL={locationsURL}
        uspsApiError={apiError}
        usesErrorComponent={usesErrorComponent}
      />
      {usesErrorComponent && apiError && <SkipUspsFacilitiesApiErrorMessage />}
      {locationResults && foundAddress && !isLoadingLocations && (
        <InPersonLocations
          locations={locationResults}
          onSelect={handleLocationSelect}
          address={foundAddress.address || ''}
          noInPersonLocationsDisplay={noInPersonLocationsDisplay}
          resultsHeaderComponent={resultsHeaderComponent}
          resultsSectionHeading={resultsSectionHeading}
        />
      )}
    </>
  );
}

export default FullAddressSearch;

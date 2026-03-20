import { useState, useEffect, useCallback, useRef, useContext } from 'react';

import { request } from '@/services/request';
import { forceRedirect } from '@/utils/url';
import { FullAddressSearch, transformKeys, snakeCase } from '@/features/address-search';
import type { FormattedLocation } from '@/features/address-search/types';

import AnalyticsContext from '../context/analytics';
import { InPersonContext } from '../context';
import UploadContext from '../context/upload';

import BackButton from './back-button';

function InPersonLocationFullAddressEntryPostOfficeSearchStep({
  onChange,
  toPreviousStep,
  registerField,
}) {
  const { inPersonURL, locationsURL, usStatesTerritories } = useContext(InPersonContext);
  const [inProgress, setInProgress] = useState<boolean>(false);
  const [autoSubmit, setAutoSubmit] = useState<boolean>(false);
  const { trackEvent, setSubmitEventMetadata } = useContext(AnalyticsContext);
  const [locationResults, setLocationResults] = useState<FormattedLocation[] | null | undefined>(
    null,
  );
  const [disabledAddressSearch, setDisabledAddressSearch] = useState<boolean>(false);
  const { flowPath } = useContext(UploadContext);

  const mountedRef = useRef(false);
  const onChangeRef = useRef(onChange);
  const trackEventRef = useRef(trackEvent);
  const setSubmitEventMetadataRef = useRef(setSubmitEventMetadata);
  const flowPathRef = useRef(flowPath);
  const inPersonURLRef = useRef(inPersonURL);
  const locationsURLRef = useRef(locationsURL);

  onChangeRef.current = onChange;
  trackEventRef.current = trackEvent;
  setSubmitEventMetadataRef.current = setSubmitEventMetadata;
  flowPathRef.current = flowPath;
  inPersonURLRef.current = inPersonURL;
  locationsURLRef.current = locationsURL;

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const handleLocationSelect = useCallback(
    async (e: { preventDefault: () => void; target: { disabled: boolean } }, id: number | null) => {
      const isNullLocation = id === null;
      const selectedLocation = isNullLocation ? null : locationResults![id];

      const selectedLocationAddress = isNullLocation
        ? 'Location Selection Skipped'
        : `${selectedLocation?.streetAddress}, ${selectedLocation?.formattedCityStateZip}`;

      if (flowPathRef.current !== 'hybrid') {
        e.preventDefault();
      } else {
        setSubmitEventMetadataRef.current({ selected_location: selectedLocationAddress });
      }

      onChangeRef.current({ selectedLocationAddress });

      if (autoSubmit) {
        setDisabledAddressSearch(true);
        setTimeout(() => {
          if (mountedRef.current) {
            setDisabledAddressSearch(false);
          }
        }, 250);
        return;
      }
      if (inProgress) {
        return;
      }

      const selectedLocationDto = {
        selected_location: isNullLocation ? null : transformKeys(selectedLocation!, snakeCase),
      };

      setInProgress(true);

      try {
        await request(locationsURLRef.current, {
          json: selectedLocationDto,
          method: 'PUT',
        });

        if (mountedRef.current) {
          setAutoSubmit(true);
          setImmediate(() => {
            e.target.disabled = false;

            if (flowPathRef.current !== 'hybrid') {
              trackEventRef.current('IdV: location submitted', {
                selected_location: selectedLocationAddress,
              });
              forceRedirect(inPersonURLRef.current!);
            }

            setAutoSubmit(false);
          });
        }
      } catch {
        setAutoSubmit(false);
      } finally {
        if (mountedRef.current) {
          setInProgress(false);
        }
      }
    },
    [locationResults, inProgress, autoSubmit],
  );

  return (
    <>
      <FullAddressSearch
        registerField={registerField}
        onFoundLocations={setLocationResults}
        disabled={disabledAddressSearch}
        locationsURL={locationsURL}
        handleLocationSelect={handleLocationSelect}
        usStatesTerritories={usStatesTerritories}
        usesErrorComponent
      />
      <BackButton role="link" includeBorder onClick={toPreviousStep} />
    </>
  );
}

export default InPersonLocationFullAddressEntryPostOfficeSearchStep;

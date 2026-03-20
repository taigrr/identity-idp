import { useState, useEffect, useCallback, useRef } from 'react';

export type ParamValue = string | undefined;

/**
 * Returns the step name from a given path, ignoring any subpaths or leading or trailing slashes.
 *
 * @param path Path from which to extract step.
 *
 * @return Step name.
 */
export const getStepParam = (path: string): string => decodeURIComponent(path.replace(/^#/, ''));

const getParamURL = (value: ParamValue) => `#${encodeURIComponent(value || '')}`;

const subscribers: Array<() => void> = [];

/**
 * Returns a hook which syncs a querystring parameter by the given name using History pushState.
 * Returns a `useState`-like tuple of the current value and a setter to assign the next parameter
 * value.
 *
 * The current implementation is limited to managing at most one query parameter at a time for the
 * entire application.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/History/pushState
 *
 * @return Tuple of current state, state setter.
 */
function useHistoryParam(
  initialValue?: string,
  validValues?: string[],
): [string | undefined, (nextParamValue: ParamValue) => void] {
  const initialValueRef = useRef(initialValue);
  const validValuesRef = useRef(validValues);

  const getCurrentValue = useCallback((currentValue?: string): ParamValue => {
    const path = window.location.hash.slice(1);

    if (path) {
      const value = getStepParam(path);
      return !validValuesRef.current || validValuesRef.current.includes(value) ? value : currentValue;
    }

    return initialValueRef.current;
  }, []);

  const [value, setValue] = useState(initialValue ?? getCurrentValue);
  const syncValue = useCallback(() => setValue(getCurrentValue()), [getCurrentValue]);

  function setParamValue(nextValue: ParamValue) {
    if (nextValue !== value) {
      window.history.pushState(null, '', getParamURL(nextValue));
      subscribers.forEach((sync) => sync());
    }

    if (window.scrollY > 0) {
      window.scrollTo(0, 0);
    }
  }

  useEffect(() => {
    if (initialValueRef.current && initialValueRef.current !== getCurrentValue()) {
      window.history.replaceState(null, '', getParamURL(initialValueRef.current));
    }

    window.addEventListener('popstate', syncValue);
    return () => {
      window.removeEventListener('popstate', syncValue);
    };
  }, [getCurrentValue, syncValue]);

  useEffect(() => {
    subscribers.push(syncValue);
    return () => {
      subscribers.splice(subscribers.indexOf(syncValue), 1);
    };
  }, [syncValue]);

  return [value, setParamValue];
}

export default useHistoryParam;

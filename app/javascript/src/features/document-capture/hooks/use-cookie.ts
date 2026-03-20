import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type Dispatch,
  type SetStateAction,
} from 'react';

type Subscribers = Dispatch<SetStateAction<string | null>>[];

const CookieSubscriberContext = createContext<Map<string, Subscribers>>(new Map());

type UseCookieReturn = [
  value: string | null,
  setValue: (nextValue: string | null) => void,
  refreshValue: () => void,
];

function useCookie(name: string): UseCookieReturn {
  const getValue = useCallback(
    () =>
      document.cookie
        .split(';')
        .map((part) => part.trim().split('='))
        .find(([key]) => key === name)?.[1] ?? null,
    [name],
  );

  const subscriptions = useContext(CookieSubscriberContext);
  const [value, setStateValue] = useState(getValue);
  const subscriptionsRef = useRef(subscriptions);
  subscriptionsRef.current = subscriptions;

  useEffect(() => {
    const subs = subscriptionsRef.current;
    if (!subs.has(name)) {
      subs.set(name, []);
    }

    const subscribers = subs.get(name)!;
    subscribers.push(setStateValue);

    return () => {
      subscribers.splice(subscribers.indexOf(setStateValue), 1);
      if (!subscribers.length) {
        subs.delete(name);
      }
    };
  }, [name]);

  const refreshValue = useCallback(() => {
    const nextValue = getValue();
    const subscribers = subscriptionsRef.current.get(name);
    subscribers?.forEach((setSubscriberValue) => setSubscriberValue(nextValue));
  }, [getValue, name]);

  const setValue = useCallback(
    (nextValue: string | null) => {
      const cookieValue = nextValue === null ? '; Max-Age=0' : nextValue;
      // eslint-disable-next-line react-compiler/react-compiler -- document.cookie is a legitimate DOM API, not a component variable
      document.cookie = `${name}=${cookieValue}`;
      refreshValue();
    },
    [name, refreshValue],
  );

  return [value, setValue, refreshValue];
}

export default useCookie;

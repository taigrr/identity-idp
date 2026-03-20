import { useState, useCallback } from 'react';

type UseCounterReturn = [count: number, incrementCount: () => void, resetCount: () => void];

function useCounter(initialCount = 0): UseCounterReturn {
  const [count, setCount] = useState(initialCount);

  const incrementCount = useCallback(() => setCount((prevCount) => prevCount + 1), []);
  const resetCount = useCallback(() => setCount(initialCount), [initialCount]);

  return [count, incrementCount, resetCount];
}

export default useCounter;

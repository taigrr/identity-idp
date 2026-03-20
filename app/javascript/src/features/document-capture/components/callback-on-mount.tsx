import { useEffect, useRef, type ReactNode } from 'react';

interface CallbackOnMountProps {
  onMount: () => void;
  children?: ReactNode;
}

function CallbackOnMount({ onMount, children = null }: CallbackOnMountProps) {
  const onMountRef = useRef(onMount);
  onMountRef.current = onMount;

  useEffect(() => {
    onMountRef.current();
  }, []);

  return children;
}

export default CallbackOnMount;

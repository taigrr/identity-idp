import { useEffect, type ReactNode } from 'react';

interface CallbackOnMountProps {
  onMount: () => void;
  children?: ReactNode;
}

function CallbackOnMount({ onMount, children = null }: CallbackOnMountProps) {
  useEffect(() => {
    onMount();
  }, []);

  return children;
}

export default CallbackOnMount;

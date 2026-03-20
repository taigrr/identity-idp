import { useEffect, useRef } from 'react';
import type { ComponentType } from 'react';

type AnyComponent = ComponentType<never>;

const activeInstancesByType = new WeakMap<AnyComponent, number>();

/**
 * React hook to add a CSS class to the page body element as long as any instance of the given
 * component type is rendered to the page.
 *
 * @param className Class name to add to body element
 * @param Component React component definition
 */
function useToggleBodyClassByPresence<P>(className: string, Component: ComponentType<P>) {
  const classNameRef = useRef(className);
  const componentRef = useRef(Component as AnyComponent);

  useEffect(() => {
    const cls = classNameRef.current;
    const comp = componentRef.current;

    const activeInstances = activeInstancesByType.get(comp) || 0;
    const nextActiveInstances = activeInstances + 1;

    if (!activeInstances && nextActiveInstances) {
      document.body.classList.add(cls);
    }

    activeInstancesByType.set(comp, nextActiveInstances);

    return () => {
      const currentInstances = activeInstancesByType.get(comp) || 0;
      const decrementedInstances = currentInstances - 1;

      if (currentInstances && !decrementedInstances) {
        document.body.classList.remove(cls);
      }

      activeInstancesByType.set(comp, decrementedInstances);
    };
  }, []);
}

export default useToggleBodyClassByPresence;

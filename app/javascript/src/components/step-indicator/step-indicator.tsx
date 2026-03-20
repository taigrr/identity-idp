import { useRef, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';

import { t } from '@/i18n';

const SMALL_VIEWPORT_MEDIA_QUERY = '(max-width: 639px)';

interface StepIndicatorProps {
  className?: string;
  children?: ReactNode;
}

function StepIndicator({ className, children }: StepIndicatorProps) {
  const scrollerRef = useRef<HTMLOListElement>(null);

  const setScrollOffset = useCallback(() => {
    const scroller = scrollerRef.current;
    if (!scroller) {return;}

    const currentStep = scroller.querySelector('.step-indicator__step--current') as HTMLElement | null;
    if (!currentStep) {return;}

    const scrollerPaddingLeft = parseInt(window.getComputedStyle(scroller).paddingLeft, 10);
    const { scrollWidth, clientWidth } = scroller;
    const { offsetLeft } = currentStep;
    scroller.scrollLeft = offsetLeft - scrollerPaddingLeft - (scrollWidth - clientWidth) / 2;
  }, []);

  const toggleWrapperFocusable = useCallback((isSmallViewport: boolean) => {
    const scroller = scrollerRef.current;
    if (!scroller) {return;}

    if (isSmallViewport) {
      scroller.setAttribute('tabindex', '0');
    } else {
      scroller.removeAttribute('tabindex');
    }
  }, []);

  useEffect(() => {
    const mediaQueryList = window.matchMedia(SMALL_VIEWPORT_MEDIA_QUERY);

    const handleChange = () => {
      toggleWrapperFocusable(mediaQueryList.matches);
    };

    handleChange();
    if (mediaQueryList.matches) {
      setScrollOffset();
    }

    mediaQueryList.addEventListener('change', handleChange);
    return () => {
      mediaQueryList.removeEventListener('change', handleChange);
    };
  }, [setScrollOffset, toggleWrapperFocusable]);

  const classes = ['step-indicator', className].filter(Boolean).join(' ');

  return (
    <nav role="region" aria-label={t('step_indicator.accessible_label')} className={classes}>
      <ol ref={scrollerRef} className="step-indicator__scroller">
        {children}
      </ol>
    </nav>
  );
}

export default StepIndicator;

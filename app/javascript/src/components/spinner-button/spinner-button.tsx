import { useRef, useState, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react';
import type { ForwardedRef, MouseEvent } from 'react';

import { Button } from '@/components';
import type { ButtonProps } from '@/components';

export interface SpinnerButtonRefHandle {
  toggleSpinner: (isVisible: boolean) => void;
  isSpinning: boolean;
}

interface SpinnerButtonProps extends ButtonProps {
  spinOnClick?: boolean;
  actionMessage?: string;
  longWaitDurationMs?: number;
}

function SpinnerButton(
  {
    spinOnClick = true,
    actionMessage,
    longWaitDurationMs,
    isOutline,
    onClick,
    children,
    ...buttonProps
  }: SpinnerButtonProps,
  ref: ForwardedRef<SpinnerButtonRefHandle>,
) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [showLongWaitMessage, setShowLongWaitMessage] = useState(false);
  const longWaitTimeoutRef = useRef<number | undefined>(undefined);
  const wrapperRef = useRef<HTMLSpanElement>(null);

  const toggleSpinner = useCallback((isVisible: boolean) => {
    setIsSpinning(isVisible);
    setShowLongWaitMessage(false);

    window.clearTimeout(longWaitTimeoutRef.current);
    if (isVisible && longWaitDurationMs && Number.isFinite(longWaitDurationMs)) {
      longWaitTimeoutRef.current = window.setTimeout(() => {
        setShowLongWaitMessage(true);
      }, longWaitDurationMs);
    }
  }, [longWaitDurationMs]);

  useImperativeHandle(ref, () => ({
    toggleSpinner,
    isSpinning,
  }), [toggleSpinner, isSpinning]);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const handleSpinnerStart = () => toggleSpinner(true);
    const handleSpinnerStop = () => toggleSpinner(false);

    wrapper.addEventListener('spinner.start', handleSpinnerStart);
    wrapper.addEventListener('spinner.stop', handleSpinnerStop);

    return () => {
      window.clearTimeout(longWaitTimeoutRef.current);
      wrapper.removeEventListener('spinner.start', handleSpinnerStart);
      wrapper.removeEventListener('spinner.stop', handleSpinnerStop);
    };
  }, [toggleSpinner]);

  useEffect(() => {
    if (!spinOnClick) return;

    const wrapper = wrapperRef.current;
    const form = wrapper?.closest('form');
    if (!form) return;

    const handleSubmit = () => toggleSpinner(true);
    form.addEventListener('submit', handleSubmit);

    return () => {
      form.removeEventListener('submit', handleSubmit);
    };
  }, [spinOnClick, toggleSpinner]);

  const handleClick = useCallback((event: MouseEvent) => {
    if (isSpinning) {
      event.preventDefault();
      return;
    }

    if (spinOnClick) {
      const form = wrapperRef.current?.closest('form');
      if (!form) {
        toggleSpinner(true);
      }
    }

    onClick?.(event);
  }, [isSpinning, spinOnClick, toggleSpinner, onClick]);

  const wrapperClasses = [
    'spinner-button',
    isOutline && 'spinner-button--outline',
    isSpinning && 'spinner-button--spinner-active',
  ].filter(Boolean).join(' ');

  return (
    <span ref={wrapperRef} className={wrapperClasses}>
      <Button
        isOutline={isOutline}
        onClick={handleClick}
        aria-disabled={isSpinning || undefined}
        className={isSpinning ? 'usa-button--active' : undefined}
        {...buttonProps}
      >
        <span className="spinner-button__content">{children}</span>
        <span className="spinner-dots spinner-dots--centered" aria-hidden="true">
          <span className="spinner-dots__dot" />
          <span className="spinner-dots__dot" />
          <span className="spinner-dots__dot" />
        </span>
      </Button>
      {actionMessage && (
        <span
          role="status"
          className={`spinner-button__action-message${showLongWaitMessage ? '' : ' usa-sr-only'}`}
        >
          {isSpinning ? actionMessage : ''}
        </span>
      )}
    </span>
  );
}

export default forwardRef(SpinnerButton);

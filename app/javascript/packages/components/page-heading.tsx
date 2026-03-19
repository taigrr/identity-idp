import { forwardRef } from 'react';
import type { ReactNode } from 'react';

interface PageHeadingProps extends Record<string, any> {
  className?: string;

  children?: ReactNode;
}

function PageHeading({ children, className, ...props }: PageHeadingProps, ref) {
  const classes = ['page-heading', className].filter(Boolean).join(' ');

  return (
    // Disable reason: Intended as pass-through to heading HTML element.
    <h1 ref={ref} {...props} className={classes}>
      {children}
    </h1>
  );
}

export default forwardRef(PageHeading);

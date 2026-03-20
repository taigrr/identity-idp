import type { ReactNode } from 'react';

import { ProcessListHeading } from '@/components';

interface ProcessListItemProps {
  children?: ReactNode;

  heading: string;

  headingUnstyled?: boolean;
}

function ProcessListItem({ children, heading, headingUnstyled }: ProcessListItemProps) {
  const classes = 'usa-process-list__item';

  return (
    <li className={classes}>
      <ProcessListHeading unstyled={headingUnstyled}>{heading}</ProcessListHeading>
      {children}
    </li>
  );
}

export default ProcessListItem;

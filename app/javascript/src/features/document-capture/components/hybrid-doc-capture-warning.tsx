import React, { useContext } from 'react';
import type { ReactNode } from 'react';

import { useI18n, formatHTML } from '@/i18n/react';
import { getConfigValue } from '@/utils/config';
import { Alert } from '@/components';

import ServiceProviderContext from '../context/service-provider';

function formatWithStrong(text: string): ReactNode {
  return formatHTML(text, {
    strong: ({ children }) => <strong>{children}</strong>,
  });
}

interface HybridDocCaptureWarningProps {
  /**
   * A class string to append to root element
   */
  className?: string;
}

function HybridDocCaptureWarning({ className = '' }: HybridDocCaptureWarningProps): React.JSX.Element {
  const { t } = useI18n();
  // Determine the Service Provider name to display,
  // in some circumstances.
  // If there is no SP, we default to the appName
  const spContext = useContext(ServiceProviderContext);
  const serviceProviderName = spContext.name;
  const appName = getConfigValue('appName');

  let warningText = t('doc_auth.hybrid_flow_warning.explanation_non_sp_html', {
    app_name: appName,
  });

  if (serviceProviderName) {
    warningText = t('doc_auth.hybrid_flow_warning.explanation_html', {
      app_name: appName,
      service_provider_name: serviceProviderName,
    });
  }

  return (
    <Alert textTag="div" className={className} type="warning">
      <p>{formatWithStrong(warningText)}</p>
    </Alert>
  );
}

export default HybridDocCaptureWarning;

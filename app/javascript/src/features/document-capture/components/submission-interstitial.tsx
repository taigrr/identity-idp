import { useRef, useEffect } from 'react';

import { useI18n } from '@/i18n/react';
import { PageHeading } from '@/components';
import { getAssetPath } from '@/utils/assets';

interface SubmissionInterstitialProps {
  autoFocus?: boolean;
}

function SubmissionInterstitial({ autoFocus = false }: SubmissionInterstitialProps) {
  const { t } = useI18n();
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (autoFocus) {
      headingRef.current?.focus();
    }
  }, [autoFocus]);

  return (
    <div>
      <img
        src={getAssetPath('id-card.svg')}
        alt=""
        width="216"
        height="116"
        className="margin-bottom-4"
      />
      <PageHeading ref={headingRef} tabIndex={-1}>
        {t('doc_auth.headings.interstitial')}
      </PageHeading>
      <p className="margin-top-4">{t('doc_auth.info.interstitial_eta')}</p>
      <p>{t('doc_auth.info.interstitial_thanks')}</p>
    </div>
  );
}

export default SubmissionInterstitial;

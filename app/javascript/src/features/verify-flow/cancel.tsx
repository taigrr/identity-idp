import { useContext } from 'react';

import { useI18n } from '@/i18n/react';
import { addSearchParams } from '@/utils/url';
import { PageFooter } from '@/components';

import FlowContext from './context/flow-context';

function Cancel() {
  const { currentStep: step, cancelURL } = useContext(FlowContext);
  const { t } = useI18n();

  return (
    <PageFooter>
      <a href={addSearchParams(cancelURL, { step })}>{t('links.cancel')}</a>
    </PageFooter>
  );
}

export default Cancel;

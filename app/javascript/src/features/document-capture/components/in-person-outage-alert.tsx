import { useContext } from 'react';

import { t } from '@/i18n';
import { Alert } from '@/components';
import { getConfigValue } from '@/utils/config';

import { InPersonContext } from '../context';

function InPersonOutageAlert() {
  const { inPersonOutageExpectedUpdateDate } = useContext(InPersonContext);

  return (
    <Alert type="warning" className="margin-bottom-4" textTag="div">
      <>
        <p className="margin-bottom-2">
          <strong>
            {t('idv.failure.exceptions.in_person_outage_error_message.post_cta.title', {
              date: new Intl.DateTimeFormat(document.documentElement.lang, {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              }).format(new Date(`${inPersonOutageExpectedUpdateDate}`)),
            })}
          </strong>
        </p>
        <p>
          {t('idv.failure.exceptions.in_person_outage_error_message.post_cta.body', {
            app_name: getConfigValue('appName'),
          })}
        </p>
      </>
    </Alert>
  );
}

export default InPersonOutageAlert;

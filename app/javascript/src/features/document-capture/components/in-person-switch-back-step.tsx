import { useLayoutEffect } from 'react';

import { PageHeading } from '@/components';
import { getAssetPath } from '@/utils/assets';
import { t } from '@/i18n';
import type { FormStepComponentProps } from '@/features/form-steps';

function InPersonSwitchBackStep({ onChange }: FormStepComponentProps<any>) {
  // Resetting the value prevents the user from being prompted about unsaved changes when closing
  // the tab. `useLayoutEffect` is used to avoid race conditions where the callback could occur at
  // the same time as the change handler's `ifStillMounted` wrapping `useEffect`, which would treat
  // it as unmounted and not update the value.
  useLayoutEffect(() => onChange({}, { patch: false }), []);

  return (
    <>
      <PageHeading>{t('in_person_proofing.headings.switch_back')}</PageHeading>
      <img
        src={getAssetPath('idv/switch-back-to-computer.svg')}
        width={193}
        alt={t('doc_auth.instructions.switch_back_image')}
      />
    </>
  );
}

export default InPersonSwitchBackStep;

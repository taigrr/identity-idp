import { useLayoutEffect, useRef } from 'react';

import { PageHeading } from '@/components';
import { getAssetPath } from '@/utils/assets';
import { t } from '@/i18n';
import type { FormStepComponentProps } from '@/features/form-steps';

function InPersonSwitchBackStep({ onChange }: FormStepComponentProps<Record<string, unknown>>) {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useLayoutEffect(() => {
    onChangeRef.current({}, { patch: false });
  }, []);

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

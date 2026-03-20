import { useContext } from 'react';

import { getAssetPath } from '@/utils/assets';
import { useI18n } from '@/i18n/react';

import AcuantContext from '../context/acuant';

function LoadingSpinner() {
  return (
    <img
      src={getAssetPath('loading-badge.gif')}
      alt=""
      width="144"
      height="144"
      className="absolute left-1/2 top-1/2 -translate-x-[72px] -translate-y-[72px]"
    />
  );
}

interface AcuantSelfieCaptureCanvasProps {
  imageCaptureText?: string | null;
  onSelfieCaptureClosed: () => void;
}

function AcuantSelfieCaptureCanvas({
  imageCaptureText,
  onSelfieCaptureClosed,
}: AcuantSelfieCaptureCanvasProps) {
  const { isReady } = useContext(AcuantContext);
  const { t } = useI18n();
  // The Acuant SDK script AcuantPassiveLiveness attaches to whatever element has
  // this id. It then uses that element as the root for the full screen selfie capture
  const acuantCaptureContainerId = 'acuant-face-capture-container';

  // This solves a fairly nasty bug for screenreader users where the screenreader focus would jump away
  // from the capture button (added by Acuant SDK) to the button in this component. Specifically we
  // need to detect when Acuant actually hydrates in their capture screen and hide the button.
  // See PR 10668 for more information.
  const elementInShadow = document
    ?.getElementById('acuant-face-capture-camera')
    ?.shadowRoot?.getElementById('cameraContainer');
  const loadedAcuantCamera = !!elementInShadow;

  return (
    <>
      {!isReady && <LoadingSpinner />}
      <div id={acuantCaptureContainerId}>
        <p aria-live="assertive">
          {imageCaptureText && (
            <span className="text-white bg-black fixed left-1/2 top-[10%] -translate-x-1/2 px-[5px] z-[11]">{imageCaptureText}</span>
          )}
        </p>
      </div>
      {!loadedAcuantCamera && (
        <button type="button" onClick={onSelfieCaptureClosed} className="usa-sr-only">
          {t('doc_auth.buttons.close')}
        </button>
      )}
    </>
  );
}

export default AcuantSelfieCaptureCanvas;

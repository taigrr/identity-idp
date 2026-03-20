import { useCallback, useContext, useEffect, useRef, useState } from 'react';

import { getAssetPath } from '@/utils/assets';
import { useI18n } from '@/i18n/react';

import AcuantContext from '../context/acuant';
import { useObservableProperty } from '../hooks/use-observable-property';

function AcuantCaptureCanvas() {
  const { isReady, acuantCaptureMode, setAcuantCaptureMode } = useContext(AcuantContext);
  const { t } = useI18n();
  const cameraRef = useRef<HTMLDivElement>(null);
  const [canvas, setCanvas] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const cameraElement = cameraRef.current;
    const onAcuantCameraCreated = () => setCanvas(document.getElementById('acuant-ui-canvas'));
    cameraElement?.addEventListener('acuantcameracreated', onAcuantCameraCreated);
    return () => cameraElement?.removeEventListener('acuantcameracreated', onAcuantCameraCreated);
  }, []);

  const onCallback = useCallback(
    (callback: unknown) => {
      setAcuantCaptureMode(callback ? 'TAP' : 'AUTO');
    },
    [setAcuantCaptureMode],
  );

  useObservableProperty(canvas, 'callback', onCallback);

  const clickCanvas = () => document.getElementById('acuant-ui-canvas')?.click();

  return (
    <>
      {!isReady && (
        <img
          src={getAssetPath('loading-badge.gif')}
          alt=""
          width="144"
          height="144"
          className="absolute left-1/2 top-1/2 -translate-x-[72px] -translate-y-[72px]"
        />
      )}
      <h2 className="usa-sr-only">{t('doc_auth.accessible_labels.camera_video_capture_label')}</h2>
      {acuantCaptureMode !== 'TAP' && (
        <p className="usa-sr-only">
          {t('doc_auth.accessible_labels.camera_video_capture_instructions')}
        </p>
      )}
      <div id="acuant-camera" ref={cameraRef} className="absolute left-1/2 top-1/2 max-w-full w-full -translate-x-1/2 -translate-y-1/2 landscape:w-fit" />
      <button
        type="button"
        onClick={clickCanvas}
        disabled={acuantCaptureMode !== 'TAP'}
        className="usa-sr-only"
      >
        {t('doc_auth.buttons.take_picture')}
      </button>
    </>
  );
}

export default AcuantCaptureCanvas;

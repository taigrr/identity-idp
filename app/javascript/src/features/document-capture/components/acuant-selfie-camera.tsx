import { useContext, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';

import { t } from '@/i18n';

import AcuantContext from '../context/acuant';

declare global {
  interface Window {
    AcuantPassiveLiveness: AcuantPassiveLivenessInterface;
  }
}

type AcuantPassiveLivenessStart = (
  faceCaptureCallback: FaceCaptureCallback,
  faceDetectionStates: FaceDetectionStates,
) => void;

interface AcuantPassiveLivenessInterface {
  /**
   * Start capture
   */
  start: AcuantPassiveLivenessStart;
  /**
   * End capture
   */
  end: () => void;
}

interface AcuantSelfieCameraContextProps {
  /**
   * Success callback
   */
  onImageCaptureSuccess: ({ image }: { image: string }) => void;
  /**
   * Failure callback
   */
  onImageCaptureFailure: (error: { code: number; message: string }) => void;
  /**
   * Capture open callback, tells the rest of the page
   * when the fullscreen selfie capture page is open
   */
  onImageCaptureOpen: () => void;
  /**
   * Capture close callback, tells the rest of the page
   * when the fullscreen selfie capture page has been closed
   */
  onImageCaptureClose: () => void;
  /**
   * Capture hint text from onDetection callback, tells the user
   * why the acuant sdk cannot capture a selfie.
   */
  onImageCaptureFeedback: (text: string) => void;
  /**
   * Selfie taken, ready for accept or retake
   */
  onSelfieTaken: () => void;
  /**
   * Selfie captured by user initiated retake
   */
  onSelfieRetaken: () => void;
  /**
   * React children node
   */
  children: ReactNode;
  /**
   * Face detection is initialized and ready.
   */
  onImageCaptureInitialized: () => void;
}

interface FaceCaptureCallback {
  onDetectorInitialized: () => void;
  onDetection: (text) => void;
  onOpened: () => void;
  onClosed: () => void;
  onError: (error) => void;
  onPhotoTaken: () => void;
  onPhotoRetake: () => void;
  onCaptured: (base64Image: Blob) => void;
}

interface FaceDetectionStates {
  FACE_NOT_FOUND: string;
  TOO_MANY_FACES: string;
  FACE_TOO_SMALL: string;
  FACE_CLOSE_TO_BORDER: string;
  CLOSE_TEXT: string;
  RETAKE_TEXT: string;
  INTRO_TEXT: string;
  SUBMIT_ALT: string;
  CAPTURE_ALT: string;
}

function AcuantSelfieCamera({
  onImageCaptureInitialized = () => {},
  onImageCaptureSuccess = () => {},
  onImageCaptureFailure = () => {},
  onImageCaptureOpen = () => {},
  onImageCaptureClose = () => {},
  onImageCaptureFeedback = () => {},
  onSelfieTaken = () => {},
  onSelfieRetaken = () => {},
  children,
}: AcuantSelfieCameraContextProps) {
  const { isReady, setIsActive } = useContext(AcuantContext);

  const onImageCaptureInitializedRef = useRef(onImageCaptureInitialized);
  const onImageCaptureSuccessRef = useRef(onImageCaptureSuccess);
  const onImageCaptureFailureRef = useRef(onImageCaptureFailure);
  const onImageCaptureOpenRef = useRef(onImageCaptureOpen);
  const onImageCaptureCloseRef = useRef(onImageCaptureClose);
  const onImageCaptureFeedbackRef = useRef(onImageCaptureFeedback);
  const onSelfieTakenRef = useRef(onSelfieTaken);
  const onSelfieRetakenRef = useRef(onSelfieRetaken);
  const setIsActiveRef = useRef(setIsActive);

  onImageCaptureInitializedRef.current = onImageCaptureInitialized;
  onImageCaptureSuccessRef.current = onImageCaptureSuccess;
  onImageCaptureFailureRef.current = onImageCaptureFailure;
  onImageCaptureOpenRef.current = onImageCaptureOpen;
  onImageCaptureCloseRef.current = onImageCaptureClose;
  onImageCaptureFeedbackRef.current = onImageCaptureFeedback;
  onSelfieTakenRef.current = onSelfieTaken;
  onSelfieRetakenRef.current = onSelfieRetaken;
  setIsActiveRef.current = setIsActive;

  useEffect(() => {
    if (!isReady) {
      return;
    }

    const faceCaptureCallback: FaceCaptureCallback = {
      onDetectorInitialized: () => {
        onImageCaptureInitializedRef.current();
      },
      onDetection: (text) => {
        onImageCaptureFeedbackRef.current(text);
      },
      onOpened: () => {
        onImageCaptureFeedbackRef.current('');
        onImageCaptureOpenRef.current();
      },
      onClosed: () => {
        onImageCaptureFeedbackRef.current('');
        onImageCaptureCloseRef.current();
      },
      onError: (error) => {
        onImageCaptureFailureRef.current(error);
      },
      onPhotoTaken: () => {
        onSelfieTakenRef.current();
      },
      onPhotoRetake: () => {
        onSelfieRetakenRef.current();
      },
      onCaptured: (base64Image) => {
        onImageCaptureSuccessRef.current({ image: `data:image/jpeg;base64,${base64Image}` });
      },
    };

    const faceDetectionStates = {
      FACE_NOT_FOUND: t('doc_auth.info.selfie_capture_status.face_not_found'),
      TOO_MANY_FACES: t('doc_auth.info.selfie_capture_status.too_many_faces'),
      FACE_TOO_SMALL: t('doc_auth.info.selfie_capture_status.face_too_small'),
      FACE_CLOSE_TO_BORDER: t('doc_auth.info.selfie_capture_status.face_close_to_border'),
      CLOSE_TEXT: t('doc_auth.info.selfie_capture.action.close'),
      RETAKE_TEXT: t('doc_auth.info.selfie_capture.action.retake'),
      INTRO_TEXT: t('doc_auth.info.selfie_capture.intro'),
      SUBMIT_ALT: t('doc_auth.info.selfie_capture.action.submit'),
      CAPTURE_ALT: t('doc_auth.info.selfie_capture.action.capture'),
    };

    window.AcuantPassiveLiveness?.start(faceCaptureCallback, faceDetectionStates);
    setIsActiveRef.current(true);

    return () => {
      window.AcuantPassiveLiveness?.end();
      setIsActiveRef.current(false);
    };
  }, [isReady]);

  return <>{children}</>;
}

export default AcuantSelfieCamera;

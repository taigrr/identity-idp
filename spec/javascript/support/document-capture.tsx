import type { ReactElement, ReactNode } from 'react';
import { render as baseRender, cleanup, type RenderOptions as BaseRenderOptions, type RenderResult } from '@testing-library/react';
import sinon, { type SinonStub } from 'sinon';
import { UploadContextProvider } from '@/features/document-capture';
import type { UploadImplementation } from '@/features/document-capture/context/upload';

interface RenderOptions extends Omit<BaseRenderOptions, 'wrapper'> {
  uploadError?: Error;
  isMockClient?: boolean;
  expectedUploads?: number;
  wrapper?: (props: { children: ReactNode }) => ReactNode;
}

export function render(element: ReactElement, options: RenderOptions = {}): RenderResult {
  const { uploadError, expectedUploads = 1, isMockClient = true, ...baseRenderOptions } = options;

  const upload: UploadImplementation = sinon
    .stub()
    .callsFake((payload) => (uploadError ? Promise.reject(uploadError) : Promise.resolve({ success: true, isPending: false })))
    .onCall(expectedUploads)
    .throws(
      new Error(
        `Expected upload to have been called at most ${expectedUploads} times. It was called ${
          expectedUploads + 1
        } times.`,
      ),
    );

  const defaultBaseWrapper = ({ children }: { children: ReactNode }) => children;
  const { wrapper: baseWrapper = defaultBaseWrapper } = baseRenderOptions;

  return baseRender(element, {
    ...baseRenderOptions,
    wrapper: ({ children }) => (
      <UploadContextProvider
        upload={upload}
        isMockClient={isMockClient}
        endpoint="/upload"
        flowPath="standard"
        idType="state_id_card"
      >
        {baseWrapper({ children })}
      </UploadContextProvider>
    ),
  });
}

interface AcuantInitializeOptions {
  isSuccess?: boolean;
  isCameraSupported?: boolean;
  start?: SinonStub;
  end?: SinonStub;
  selfieStart?: SinonStub;
  selfieEnd?: SinonStub;
  triggerCapture?: SinonStub;
}

interface AcuantTestHelpers {
  initialize: (options?: AcuantInitializeOptions) => void;
}

export function useAcuant(): AcuantTestHelpers {
  afterEach(() => {
    cleanup();
    delete (window as Partial<Window>).AcuantJavascriptWebSdk;
    delete (window as Partial<Window>).AcuantCamera;
    delete (window as Partial<Window>).AcuantCameraUI;
    delete (window as Partial<Window>).AcuantPassiveLiveness;
    delete (window as Partial<Window>).loadAcuantSdk;
  });

  return {
    initialize({
      isSuccess = true,
      isCameraSupported = true,
      start = sinon.stub(),
      end = sinon.stub(),
      selfieStart = sinon.stub(),
      selfieEnd = sinon.stub(),
      triggerCapture = sinon.stub(),
    }: AcuantInitializeOptions = {}) {
      window.AcuantJavascriptWebSdk = {
        initialize: (_credentials, _endpoint, callbacks) => {
          if (callbacks) {
            isSuccess
              ? callbacks.onSuccess()
              : callbacks.onFail(401, 'Server returned a 401 (missing credentials).');
          }
        },
        start: sinon.stub().callsArg(0),
        START_FAIL_CODE: 'start-fail-code',
        REPEAT_FAIL_CODE: 'repeat-fail-code',
        SEQUENCE_BREAK_CODE: 'sequence-break-code',
        setUnexpectedErrorCallback: sinon.stub(),
      };
      window.AcuantCamera = { isCameraSupported, triggerCapture } as typeof window.AcuantCamera;
      window.AcuantCameraUI = {
        start: sinon.stub().callsFake((...args: unknown[]) => {
          const camera = document.getElementById('acuant-camera');
          if (camera) {
            const canvas = document.createElement('canvas');
            canvas.id = 'acuant-ui-canvas';
            camera.appendChild(canvas);
            camera.dispatchEvent(new window.CustomEvent('acuantcameracreated'));
          }
          start(...args);
        }),
        end,
      };
      window.AcuantPassiveLiveness = { start: selfieStart, end: selfieEnd };
      window.loadAcuantSdk = () => {};
      const sdkScript = document.querySelector('[data-acuant-sdk]') as HTMLScriptElement | null;
      if (sdkScript?.onload) {
        (sdkScript.onload as () => void)();
        sdkScript.onload = null;
      }
    },
  };
}

export function useDocumentCaptureForm(): sinon.SinonExpectation {
  const onSubmit = sinon.mock();
  let form: HTMLFormElement & { submit: SinonStub };

  beforeEach(() => {
    onSubmit.reset();

    form = document.createElement('form') as HTMLFormElement & { submit: SinonStub };
    form.className = 'js-document-capture-form';
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      onSubmit();
    });
    sinon.stub(form, 'submit').callsFake(onSubmit);
    document.body.appendChild(form);
  });

  afterEach(() => {
    if ([...document.body.childNodes].includes(form)) {
      document.body.removeChild(form);
    }
    form.submit.restore();
  });

  return onSubmit;
}

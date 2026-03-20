import { useContext } from 'react';
import { renderHook } from '@testing-library/react';
import SelfieCaptureContext from '@/features/document-capture/context/selfie-capture';

describe('document-capture/context/selfie-capture', () => {
  it('has expected default properties', () => {
    const { result } = renderHook(() => useContext(SelfieCaptureContext));

    expect(result.current).to.have.keys([
      'isSelfieCaptureEnabled',
      'isDesktopTestMode',
      'isUploadEnabled',
      'showHelpInitially',
    ]);
    expect(result.current.isSelfieCaptureEnabled).to.be.a('boolean');
  });
});

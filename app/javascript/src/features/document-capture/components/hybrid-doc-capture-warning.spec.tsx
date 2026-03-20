import { render } from '@testing-library/react';

import { t } from '@/i18n';

import { Provider as ServiceProviderContextProvider } from '../context/service-provider';

import HybridDocCaptureWarning from './hybrid-doc-capture-warning';

const APP_NAME = 'Login.gov';
const SP_NAME = 'TEST SP';

describe('HybridDocCaptureWarning', () => {
  beforeEach(() => {
    const config = document.createElement('script');
    config.id = 'test-config';
    config.type = 'application/json';
    config.setAttribute('data-config', '');
    config.textContent = JSON.stringify({ appName: APP_NAME });
    document.body.append(config);
  });

  describe('basic rendering', () => {
    it('renders a warning alert', () => {
      const { getByRole } = render(
        <ServiceProviderContextProvider value={{ name: null, failureToProofURL: '' }}>
          <HybridDocCaptureWarning />
        </ServiceProviderContextProvider>,
      );
      const alertElement = getByRole('status');

      expect(alertElement.classList.contains('usa-alert--warning'));
    });
  });

  describe('without SP', () => {
    it('renders correct warning title', () => {
      const { getByRole } = render(
        <ServiceProviderContextProvider value={{ name: null, failureToProofURL: '' }}>
          <HybridDocCaptureWarning />
        </ServiceProviderContextProvider>,
      );
      const alertElement = getByRole('status');

      expect(alertElement.textContent).to.have.string(
        t('doc_auth.hybrid_flow_warning.explanation_non_sp_html'),
      );
    });
  });

  describe('with SP', () => {
    it('renders the correct warning title', () => {
      const { getByRole } = render(
        <ServiceProviderContextProvider value={{ name: SP_NAME, failureToProofURL: '' }}>
          <HybridDocCaptureWarning />
        </ServiceProviderContextProvider>,
      );
      const alertElement = getByRole('status');
      const expectedString = t('doc_auth.hybrid_flow_warning.explanation_html', {
        app_name: APP_NAME,
        service_provider_name: SP_NAME,
      });

      expect(alertElement.textContent).to.have.string(expectedString);
    });
  });
});

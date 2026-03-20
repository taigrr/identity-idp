import { createContext, useCallback } from 'react';
import type { ReactNode } from 'react';

import { addSearchParams } from '@/utils/url';

interface HelpCenterURLParameters {
  category: string;

  article: string;

  location: string;
}

type GetHelpCenterURL = (params: HelpCenterURLParameters) => string;

interface MarketingSiteContextValue {
  getHelpCenterURL: GetHelpCenterURL;

  securityAndPrivacyHowItWorksURL?: string;
}

interface MarketingSiteContextProviderProps {
  helpCenterRedirectURL: string;

  securityAndPrivacyHowItWorksURL?: string;

  children: ReactNode;
}

const MarketingSiteContext = createContext({
  getHelpCenterURL: (params) => addSearchParams('', params),
} as MarketingSiteContextValue);

MarketingSiteContext.displayName = 'MarketingSiteContext';

function MarketingSiteContextProvider({
  helpCenterRedirectURL,
  securityAndPrivacyHowItWorksURL,
  children,
}: MarketingSiteContextProviderProps) {
  const getHelpCenterURL: GetHelpCenterURL = useCallback(
    (params) => addSearchParams(helpCenterRedirectURL, params),
    [helpCenterRedirectURL],
  );
  const value = { getHelpCenterURL, securityAndPrivacyHowItWorksURL };

  return <MarketingSiteContext.Provider value={value}>{children}</MarketingSiteContext.Provider>;
}

export default MarketingSiteContext;
export { MarketingSiteContextProvider as Provider };

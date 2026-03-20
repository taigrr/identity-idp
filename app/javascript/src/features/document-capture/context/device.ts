import { createContext } from 'react';

export interface DeviceContextValue {
  isMobile: boolean;
}

const DeviceContext = createContext<DeviceContextValue>({ isMobile: false });

DeviceContext.displayName = 'DeviceContext';

export default DeviceContext;

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { warmBackend, getWarmState } from '../api/warmup';

const WarmupContext = createContext({ status: 'idle' });

export function WarmupProvider({ children }) {
  const [status, setStatus] = useState(getWarmState().status);

  useEffect(() => {
    let active = true;
    warmBackend().finally(() => {
      if (active) {
        setStatus(getWarmState().status);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const value = useMemo(() => ({ status }), [status]);
  return <WarmupContext.Provider value={value}>{children}</WarmupContext.Provider>;
}

export function useWarmup() {
  return useContext(WarmupContext);
}

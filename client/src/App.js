import React, { useEffect } from 'react';
import './index.css';
import { AppProviders } from './app/providers';
import { warmBackend } from './shared/api/warmup';

function App() {
  useEffect(() => {
    warmBackend();
  }, []);
  return <AppProviders />;
}
export default App;

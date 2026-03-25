import React, { useEffect } from 'react';
import './index.css';
import './test_output.css'; // FORCED COMPILED CSS
import { AppProviders } from './app/providers';
import { warmBackend } from './shared/api/warmup';

function App() {
  useEffect(() => {
    warmBackend();
  }, []);
  return <AppProviders />;
}
export default App;

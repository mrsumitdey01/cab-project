import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../shared/contexts/AuthContext';
import { WarmupProvider } from '../shared/contexts/WarmupContext';
import { AppRoutes } from './routes';

export function AppProviders() {
  return (
    <BrowserRouter>
      <WarmupProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </WarmupProvider>
    </BrowserRouter>
  );
}

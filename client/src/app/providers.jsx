import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../shared/contexts/AuthContext';
import { AppRoutes } from './routes';

export function AppProviders() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
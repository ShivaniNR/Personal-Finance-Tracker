import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { ErrorBoundary } from './components/ErrorBoundary.jsx';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,
      refetchOnWindowFocus: true,
      retry: 1,
    },
  },
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <App />
          <Toaster position="bottom-right" richColors closeButton />
        </QueryClientProvider>
      </AuthProvider>
    </ErrorBoundary>
  </StrictMode>
);

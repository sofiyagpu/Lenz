import { lazy, StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './i18n';
import '@fontsource-variable/jetbrains-mono';
import './styles.css';
import Landing from './pages/landing';

// Landing ships in the main bundle so the first screen is fast; everything else loads on demand.
const Onboarding = lazy(() => import('./pages/onboarding'));
const Home = lazy(() => import('./pages/home'));
const Settings = lazy(() => import('./pages/settings'));
const Workspace = lazy(() => import('./workspace/workspace'));

const router = createBrowserRouter([
  { path: '/', element: <Landing /> },
  { path: '/onboarding', element: <Onboarding /> },
  { path: '/app', element: <Home /> },
  { path: '/p/:id', element: <Workspace /> },
  { path: '/settings', element: <Settings /> },
  { path: '*', element: <Navigate to="/" replace /> },
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={new QueryClient()}>
      <Suspense>
        <RouterProvider router={router} />
      </Suspense>
    </QueryClientProvider>
  </StrictMode>,
);

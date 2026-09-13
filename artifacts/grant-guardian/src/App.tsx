import { type ReactNode, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import Overview from '@/pages/overview';
import Citations from '@/pages/citations';
import Compliance from '@/pages/compliance';
import ActivityPage from '@/pages/activity';
import Settings from '@/pages/settings';
import AuthPage from '@/pages/auth';
import { PageFrame } from '@/components/guardian-ui';
import {
  Route,
  Switch,
  useLocation,
  Router as WouterRouter,
} from 'wouter';

import { setBaseUrl } from '@workspace/api-client-react';
import { PersonaProvider, useAuth } from '@/context/persona-context';
import { ThemeProvider } from '@/context/theme-context';

const apiBase = (import.meta.env.VITE_API_URL as string | undefined) ?? '';
setBaseUrl(apiBase || null);

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation('/auth');
    }
  }, [isAuthenticated, setLocation]);

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}

function Router() {
  return (
    // Keep a shared shell (sidebar, navbar) outside the boundary so it
    // survives a page crash.
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/auth"><AuthPage /></Route>
        <Route path="/login"><AuthPage /></Route>
        <Route path="/"><ProtectedRoute><PageFrame><Overview /></PageFrame></ProtectedRoute></Route>
        <Route path="/citations"><ProtectedRoute><PageFrame><Citations /></PageFrame></ProtectedRoute></Route>
        <Route path="/compliance"><ProtectedRoute><PageFrame><Compliance /></PageFrame></ProtectedRoute></Route>
        <Route path="/activity"><ProtectedRoute><PageFrame><ActivityPage /></PageFrame></ProtectedRoute></Route>
        <Route path="/settings"><ProtectedRoute><PageFrame><Settings /></PageFrame></ProtectedRoute></Route>
        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <PersonaProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
              <Router />
            </WouterRouter>
            <Toaster />
          </PersonaProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;

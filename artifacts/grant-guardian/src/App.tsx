import { type ReactNode } from 'react';
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
import { PageFrame } from '@/components/guardian-ui';
import {
  Route,
  Switch,
  useLocation,
  Router as WouterRouter,
} from 'wouter';

import { setBaseUrl } from '@workspace/api-client-react';

setBaseUrl('http://127.0.0.1:3000');

const queryClient = new QueryClient();

function Router() {
  return (
    // Keep a shared shell (sidebar, navbar) outside the boundary so it
    // survives a page crash.
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/"><PageFrame><Overview /></PageFrame></Route>
        <Route path="/citations"><PageFrame><Citations /></PageFrame></Route>
        <Route path="/compliance"><PageFrame><Compliance /></PageFrame></Route>
        <Route path="/activity"><PageFrame><ActivityPage /></PageFrame></Route>
        <Route path="/settings"><PageFrame><Settings /></PageFrame></Route>
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
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

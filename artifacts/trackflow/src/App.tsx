import { useEffect, useRef } from 'react';
import { ClerkProvider, SignIn, SignUp, Show, useClerk } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { shadcn } from '@clerk/themes';
import { Switch, Route, useLocation, Router as WouterRouter, Redirect } from 'wouter';
import { QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { queryClient } from './lib/queryClient';
import { AppLayout } from './components/layout/AppLayout';

import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Campaigns from './pages/Campaigns';
import CampaignDetail from './pages/CampaignDetail';
import Links from './pages/Links';
import UtmGenerator from './pages/UtmGenerator';
import Webhooks from './pages/Webhooks';
import WebhookDetail from './pages/WebhookDetail';
import Events from './pages/Events';
import Conversions from './pages/Conversions';
import Settings from './pages/Settings';
import Doctor from './pages/Doctor';
import NotFound from './pages/not-found';

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

if (!clerkPubKey) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY in .env file');
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: "#2563EB",
    colorForeground: "#FAFAFA",
    colorMutedForeground: "#A1A1AA",
    colorDanger: "#EF4444",
    colorBackground: "#0A0A0A",
    colorInput: "#18181B",
    colorInputForeground: "#FAFAFA",
    colorNeutral: "#27272A",
    fontFamily: "Inter, sans-serif",
    borderRadius: "0.5rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-[#0A0A0A] rounded-2xl w-[440px] max-w-full border border-zinc-800 shadow-2xl overflow-hidden",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none border-t border-zinc-800",
    headerTitle: "text-zinc-100 font-bold",
    headerSubtitle: "text-zinc-400",
    socialButtonsBlockButtonText: "text-zinc-100 font-medium",
    formFieldLabel: "text-zinc-300 font-medium",
    footerActionLink: "text-blue-500 font-medium hover:text-blue-400",
    footerActionText: "text-zinc-400",
    dividerText: "text-zinc-500",
    identityPreviewEditButton: "text-blue-500",
    formFieldSuccessText: "text-emerald-500",
    alertText: "text-red-500",
    logoBox: "mb-6",
    logoImage: "w-12 h-12 object-contain",
    socialButtonsBlockButton: "bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 transition-colors",
    formButtonPrimary: "bg-blue-600 hover:bg-blue-500 transition-colors shadow-none text-white font-medium",
    formFieldInput: "bg-zinc-900 border-zinc-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 text-zinc-100",
    footerAction: "bg-zinc-900/50 py-4",
    dividerLine: "bg-zinc-800",
    alert: "bg-red-500/10 border border-red-500/20 text-red-500",
    otpCodeFieldInput: "bg-zinc-900 border-zinc-800 text-zinc-100",
    formFieldRow: "gap-2",
    main: "px-8 py-8",
  },
};

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const queryClient = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== userId) {
        queryClient.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, queryClient]);
  return null;
}

function HomeRedirect() {
  return (
    <>
      <Show when="signed-in">
        <Redirect to="/dashboard" />
      </Show>
      <Show when="signed-out">
        <Landing />
      </Show>
    </>
  );
}

function SignInPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-black px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-black to-black pointer-events-none" />
      <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-black px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-black to-black pointer-events-none" />
      <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
    </div>
  );
}

function ProtectedRoute({ component: Component }: { component: React.ComponentType<any> }) {
  return (
    <>
      <Show when="signed-in">
        <Component />
      </Show>
      <Show when="signed-out">
        <Redirect to="/sign-in" />
      </Show>
    </>
  );
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <TooltipProvider>
          <AppLayout>
            <Switch>
              <Route path="/" component={HomeRedirect} />
              <Route path="/sign-in/*?" component={SignInPage} />
              <Route path="/sign-up/*?" component={SignUpPage} />
              
              <Route path="/dashboard" component={() => <ProtectedRoute component={Dashboard} />} />
              <Route path="/campaigns" component={() => <ProtectedRoute component={Campaigns} />} />
              <Route path="/campaigns/:id" component={() => <ProtectedRoute component={CampaignDetail} />} />
              <Route path="/links" component={() => <ProtectedRoute component={Links} />} />
              <Route path="/links/utm" component={() => <ProtectedRoute component={UtmGenerator} />} />
              <Route path="/webhooks" component={() => <ProtectedRoute component={Webhooks} />} />
              <Route path="/webhooks/:id" component={() => <ProtectedRoute component={WebhookDetail} />} />
              <Route path="/events" component={() => <ProtectedRoute component={Events} />} />
              <Route path="/conversions" component={() => <ProtectedRoute component={Conversions} />} />
              <Route path="/settings" component={() => <ProtectedRoute component={Settings} />} />
              <Route path="/doctor" component={() => <ProtectedRoute component={Doctor} />} />

              <Route component={NotFound} />
            </Switch>
          </AppLayout>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}

export default App;

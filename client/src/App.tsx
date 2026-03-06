import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthContext, useAuthInit } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

// Pages
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import ClipboardView from "@/pages/clipboard";
import Settings from "@/pages/settings";
import NotFound from "@/pages/not-found";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, loading } = useAuthInit();
  const [, setLocation] = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-white/50" />
      </div>
    );
  }

  if (!user) {
    setLocation("/");
    return null;
  }

  return <Component />;
}

function Router() {
  const { user, loading } = useAuthInit();

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-white/50" />
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/">
        {user ? <Dashboard /> : <Login />}
      </Route>
      
      <Route path="/c/:id">
        {user ? <ClipboardView /> : <Login />}
      </Route>
      
      <Route path="/settings">
        {user ? <Settings /> : <Login />}
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const authState = useAuthInit();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider value={authState}>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthContext.Provider>
    </QueryClientProvider>
  );
}

export default App;

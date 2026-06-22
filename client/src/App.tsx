import { useEffect } from 'react';
import { Switch, Route, Router } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Feed from "@/pages/Feed";

function AppRouter() {
  return (
    <Switch>
      <Route path="/" component={Feed} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // Force light mode (Hintology nature-photo skin).
  useEffect(() => {
    document.documentElement.classList.remove('dark');
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router hook={useHashLocation}>
          <AppRouter />
        </Router>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DataProvider, useData } from "@/lib/dataContext";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Transactions from "@/pages/transactions";
import Budget from "@/pages/budget";
import Accounts from "@/pages/accounts";
import Calendar from "@/pages/calendar";
import AuthPage from "@/pages/auth";
import Family from "@/pages/family";
import { useEffect } from "react";

function ProtectedRoute({ component: Component, ...rest }: any) {
  const { currentUser } = useData();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!currentUser) {
      setLocation("/auth");
    }
  }, [currentUser, setLocation]);

  if (!currentUser) return null;
  return <Component {...rest} />;
}

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <Route path="/">
        <ProtectedRoute component={Dashboard} />
      </Route>
      <Route path="/transactions">
        <ProtectedRoute component={Transactions} />
      </Route>
      <Route path="/budget">
        <ProtectedRoute component={Budget} />
      </Route>
      <Route path="/calendar">
        <ProtectedRoute component={Calendar} />
      </Route>
      <Route path="/accounts">
        <ProtectedRoute component={Accounts} />
      </Route>
      <Route path="/family">
        <ProtectedRoute component={Family} />
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <DataProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </DataProvider>
    </QueryClientProvider>
  );
}

export default App;

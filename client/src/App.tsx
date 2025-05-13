import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { UserProvider } from "./context/user-context";
import Home from "@/pages/home";
import PollDetails from "@/pages/poll-details";
import NotFound from "@/pages/not-found";
import Layout from "@/components/layout";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/polls/:id" component={PollDetails} />
      <Route path="/share/:shareCode" component={PollDetails} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <UserProvider>
          <Toaster />
          <Layout>
            <Router />
          </Layout>
        </UserProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import Avatar from "./pages/Avatar";
import Forecast from "./pages/Forecast";
import News from "./pages/News";
import Watchlist from "./pages/Watchlist";
import Personalization from "./pages/Personalization";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/avatar" element={<Avatar />} />
          <Route path="/forecast" element={<Forecast />} />
          <Route path="/news" element={<News />} />
          <Route path="/watchlist" element={<Watchlist />} />
          <Route path="/personalization" element={<Personalization />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Evaluate from "./pages/Evaluate";
import Result from "./pages/Result";
import Admin from "./pages/Admin";
import Expired from "./pages/Expired";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Evaluate />} />
          <Route path="/evaluate" element={<Evaluate />} />
          <Route path="/result/:sessionId" element={<Result />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/expired" element={<Expired />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;


import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import Index from "./pages/Index";
import Feed from "./pages/Feed";
import Messages from "./pages/Messages";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import { AnimatePresence } from "framer-motion";
import Auth from "./pages/Auth";
import Terrain from "./pages/Terrain"; // Fixed import statement
import { AuthProvider } from "./contexts/AuthContext";

const queryClient = new QueryClient();

// Fix: Make sure App is a proper React component function
const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      {/* Fix: Move TooltipProvider inside the component rendering */}
      <BrowserRouter>
        <AuthProvider>
          <AnimatePresence mode="wait">
            <TooltipProvider>
              <Routes>
                <Route path="/" element={<Navigate to="/feed" replace />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/feed" element={
                  <Layout>
                    <Feed />
                  </Layout>
                } />
                <Route path="/messages" element={
                  <Layout>
                    <Messages />
                  </Layout>
                } />
                <Route path="/profile" element={
                  <Layout>
                    <Profile />
                  </Layout>
                } />
                <Route path="/terrain" element={
                  <Layout>
                    <Terrain />
                  </Layout>
                } />
                <Route path="/settings" element={
                  <Layout>
                    <Settings />
                  </Layout>
                } />
                <Route path="/404" element={
                  <Layout>
                    <NotFound />
                  </Layout>
                } />
                <Route path="*" element={<Navigate to="/feed" replace />} />
              </Routes>
              <Toaster />
              <Sonner />
            </TooltipProvider>
          </AnimatePresence>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;


import React, { Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { AuthProvider } from "./contexts/AuthContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import Layout from "./components/Layout";

// Lazy loading des pages pour améliorer les performances mobiles
const Index = React.lazy(() => import("./pages/Index"));
const Auth = React.lazy(() => import("./pages/Auth"));
const Feed = React.lazy(() => import("./pages/Feed"));
const Messages = React.lazy(() => import("./pages/Messages"));
const Profile = React.lazy(() => import("./pages/Profile"));
const Settings = React.lazy(() => import("./pages/Settings"));
const Terrain = React.lazy(() => import("./pages/Terrain"));
const Projects = React.lazy(() => import("./pages/Projects"));
const Financier = React.lazy(() => import("./pages/Financier"));
const NotFound = React.lazy(() => import("./pages/NotFound"));

// Configuration optimisée pour mobile
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
      refetchOnWindowFocus: false,
      networkMode: 'offlineFirst', // Important pour les performances mobiles
    },
  },
});

const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen bg-background">
    <div className="flex flex-col items-center space-y-4">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      <p className="text-sm text-muted-foreground">Chargement...</p>
    </div>
  </div>
);

const App = () => {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <TooltipProvider>
              <AnimatePresence mode="wait">
                <Suspense fallback={<LoadingFallback />}>
                  <Routes>
                    <Route path="/" element={<Index />} />
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
                    <Route path="/profile/:id" element={
                      <Layout>
                        <Profile />
                      </Layout>
                    } />
                    <Route path="/terrain" element={
                      <Layout>
                        <Terrain />
                      </Layout>
                    } />
                    <Route path="/projects" element={
                      <Layout>
                        <Projects />
                      </Layout>
                    } />
                    <Route path="/financier" element={
                      <Layout>
                        <Financier />
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
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </Suspense>
              </AnimatePresence>
              <Toaster />
              <Sonner />
            </TooltipProvider>
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;

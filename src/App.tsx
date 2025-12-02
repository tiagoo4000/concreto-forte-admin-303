import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./pages/Home";
import Sobre from "./pages/Sobre";
import Servicos from "./pages/Servicos";
import Contato from "./pages/Contato";
import Calculadora from "./pages/Calculadora";
import Admin from "./pages/Admin";
import Auth from "./pages/Auth";
import ServicesManager from "./pages/admin/ServicesManager";
import TestimonialsManager from "./pages/admin/TestimonialsManager";
import SiteSettingsManager from "./pages/admin/SiteSettingsManager";
import BannersManager from "./pages/admin/BannersManager";
import BrandingManager from "./pages/admin/BrandingManager";
import ConcreteTypesManager from "./pages/admin/ConcreteTypesManager";
import OrdersManager from "./pages/admin/OrdersManager";
import Cadastro from "./pages/Cadastro";
import NotFound from "./pages/NotFound";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import LegalManager from "./pages/admin/LegalManager";
import { useFavicon } from "./hooks/useFavicon";
import { useSEO } from "./hooks/useSEO";
import { useBranding } from "./hooks/useBranding";

const queryClient = new QueryClient();

const App = () => {
  useFavicon();
  useSEO();
  useBranding();
  
  return (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/sobre" element={<Sobre />} />
            <Route path="/servicos" element={<Servicos />} />
            <Route path="/contato" element={<Contato />} />
            <Route path="/calculadora" element={<Calculadora />} />
            <Route path="/cadastro" element={<Cadastro />} />
            <Route path="/politica-de-privacidade" element={<PrivacyPolicy />} />
            <Route path="/termos-de-uso" element={<TermsOfService />} />
            <Route path="/auth" element={<Auth />} />
            <Route
              path="/admin"
              element={
                <ProtectedRoute requireAdmin>
                  <Admin />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/services"
              element={
                <ProtectedRoute requireAdmin>
                  <ServicesManager />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/testimonials"
              element={
                <ProtectedRoute requireAdmin>
                  <TestimonialsManager />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/settings"
              element={
                <ProtectedRoute requireAdmin>
                  <SiteSettingsManager />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/banners"
              element={
                <ProtectedRoute requireAdmin>
                  <BannersManager />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/branding"
              element={
                <ProtectedRoute requireAdmin>
                  <BrandingManager />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/concrete-types"
              element={
                <ProtectedRoute requireAdmin>
                  <ConcreteTypesManager />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/orders"
              element={
                <ProtectedRoute requireAdmin>
                  <OrdersManager />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/legal"
              element={
                <ProtectedRoute requireAdmin>
                  <LegalManager />
                </ProtectedRoute>
              }
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  );
};

export default App;

import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider } from "@/contexts/AuthContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import ShopIndex from "@/pages/shop/ShopIndex";
import ShopCategories from "@/pages/shop/ShopCategories";
import CategoryPage from "@/pages/shop/CategoryPage";
import ShopCart from "@/pages/shop/ShopCart";
import ShopCheckout from "@/pages/shop/ShopCheckout";
import OrderSuccess from "@/pages/shop/OrderSuccess";
import ShopOrder from "@/pages/shop/ShopOrder";
import ShopSearch from "@/pages/shop/ShopSearch";
import ShopHowItWorks from "@/pages/shop/ShopHowItWorks";
import WorkTracker from "@/pages/WorkTracker";
import OrderWorkflowDashboard from "@/pages/OrderWorkflowDashboard";
import MainDashboard from "@/pages/MainDashboard";
import Auth from "@/pages/Auth";
import Admin from "@/pages/Admin";
import ProductEdit from "@/pages/ProductEdit";
import NotFound from "@/pages/NotFound";
import Sitemap from "@/pages/Sitemap";
import FeatureShowcase from "@/pages/FeatureShowcase";
import ShopperDashboard from "@/pages/ShopperDashboard";
import CustomerDashboard from "@/pages/CustomerDashboard";
import ConciergeDashboard from "@/pages/ConciergeDashboard";
import DriverDashboard from "@/pages/DriverDashboard";
import StoreManagerDashboard from "@/pages/StoreManagerDashboard";
import { Navigation } from "@/components/Navigation";

const queryClient = new QueryClient();

const App = () => {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <AuthProvider>
            <CartProvider>
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<ShopIndex />} />
                  <Route path="/categories" element={<ShopCategories />} />
                  <Route path="/category/:categoryId" element={<CategoryPage />} />
                  <Route path="/cart" element={<ShopCart />} />
                  <Route path="/checkout" element={<ShopCheckout />} />
                  <Route path="/order-success/:orderId" element={<OrderSuccess />} />
                  <Route path="/order" element={<ShopOrder />} />
                  <Route path="/search" element={<ShopSearch />} />
                  <Route path="/how-it-works" element={<ShopHowItWorks />} />
                  <Route path="/work-tracker" element={<WorkTracker />} />
                  <Route path="/dashboard" element={<MainDashboard />} />
                  <Route path="/shopper" element={<ShopperDashboard />} />
                  <Route path="/customer" element={<CustomerDashboard />} />
                  <Route path="/concierge" element={<ConciergeDashboard />} />
                  <Route path="/driver" element={<DriverDashboard />} />
                  <Route path="/store-manager" element={<StoreManagerDashboard />} />
                  <Route path="/order-workflow" element={<OrderWorkflowDashboard />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/admin" element={<Admin />} />
                  <Route path="/admin/product/:productId" element={<ProductEdit />} />
                  <Route path="/navigation" element={<Navigation />} />
                  <Route path="/feature-showcase" element={<FeatureShowcase />} />
                  <Route path="/sitemap" element={<Sitemap />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </CartProvider>
          </AuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import { FloatingCommunicationWidget } from "@/components/workflow/FloatingCommunicationWidget";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { UserOnboarding } from "@/components/onboarding/UserOnboarding";
import { RoleBasedRedirect } from "@/components/auth/RoleBasedRedirect";
import ShopIndex from "@/pages/shop/ShopIndex";
import ShopCategories from "@/pages/shop/ShopCategories";
import CategoryPage from "@/pages/shop/CategoryPage";
import ShopCart from "@/pages/shop/ShopCart";
import ShopCheckout from "@/pages/shop/ShopCheckout";
import OrderSuccess from "@/pages/shop/OrderSuccess";
import OrderTrack from "@/pages/shop/OrderTrack";
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
import Profile from "@/pages/Profile";
import SystemArchitecture from "@/pages/SystemArchitecture";
import BotTesting from "@/pages/BotTesting";
import WorkflowTesting from "@/pages/WorkflowTesting";
import WorkflowDocumentation from "@/pages/WorkflowDocumentation";
import ResetPassword from "@/pages/ResetPassword";

const queryClient = new QueryClient();

// Component that uses router hooks - must be inside BrowserRouter
function AppRouter() {
  const { user, hasCompletedOnboarding, hasRole } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Role-based default route redirect
  useEffect(() => {
    if (user && hasCompletedOnboarding() && location.pathname === '/') {
      // Redirect staff to their appropriate dashboards
      if (hasRole('shopper')) {
        navigate('/shopper');
      } else if (hasRole('driver')) {
        navigate('/driver');
      } else if (hasRole('concierge')) {
        navigate('/concierge');
      } else if (hasRole('store_manager')) {
        navigate('/store-manager');
      } else if (hasRole('admin') || hasRole('sysadmin')) {
        navigate('/admin');
      }
      // Clients stay on homepage for shopping
    }
  }, [user, hasCompletedOnboarding, hasRole, location.pathname, navigate]);

  return (
    <Routes>
      <Route path="/" element={<ShopIndex />} />
      <Route path="/categories" element={<ShopCategories />} />
      <Route path="/category/:categoryId" element={<CategoryPage />} />
      <Route path="/cart" element={<ShopCart />} />
      <Route path="/checkout" element={<ShopCheckout />} />
      <Route path="/order-success" element={<OrderSuccess />} />
      <Route path="/order-track" element={<OrderTrack />} />
      <Route path="/order" element={<ShopOrder />} />
      <Route path="/search" element={<ShopSearch />} />
      <Route path="/how-it-works" element={<ShopHowItWorks />} />
      <Route path="/me" element={<RoleBasedRedirect />} />
      <Route path="/work-tracker" element={<WorkTracker />} />
      <Route path="/dashboard" element={<MainDashboard />} />
      <Route path="/shopper" element={<ShopperDashboard />} />
      <Route path="/customer" element={<CustomerDashboard />} />
      <Route path="/concierge" element={<ConciergeDashboard />} />
      <Route path="/driver" element={<DriverDashboard />} />
      <Route path="/store-manager" element={<StoreManagerDashboard />} />
      <Route path="/order-workflow" element={<OrderWorkflowDashboard />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/system-architecture" element={<SystemArchitecture />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="/admin/product/:productId" element={<ProductEdit />} />
      <Route path="/feature-showcase" element={<FeatureShowcase />} />
      <Route path="/bot-testing" element={<BotTesting />} />
      <Route path="/workflow-testing" element={<WorkflowTesting />} />
      <Route path="/workflow-documentation" element={<WorkflowDocumentation />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function AppContent() {
  const { user, loading, hasCompletedOnboarding } = useAuth();
  const { teamMembers } = useTeamMembers();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show onboarding for authenticated users who haven't completed it
  if (user && !hasCompletedOnboarding()) {
    return <UserOnboarding onComplete={() => window.location.reload()} />;
  }

  return (
    <BrowserRouter>
      <AppRouter />
      
      {/* Global Communication Hub - Available on all pages when user is authenticated */}
      {user && teamMembers.length > 0 && (
        <FloatingCommunicationWidget
          stakeholders={teamMembers}
          unreadCount={0}
        />
      )}
    </BrowserRouter>
  );
}

const App = () => {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <CartProvider>
            <AuthProvider>
              <AppContent />
            </AuthProvider>
          </CartProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
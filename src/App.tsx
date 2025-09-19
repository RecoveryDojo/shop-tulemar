import { useEffect, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { AsyncBoundary } from "@/components/ui/async-boundary";
import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import { FloatingCommunicationWidget } from "@/components/workflow/FloatingCommunicationWidget";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { UserOnboarding } from "@/components/onboarding/UserOnboarding";
import { RoleBasedRedirect } from "@/components/auth/RoleBasedRedirect";
import { addResourceHints } from "@/utils/performance";
// Lazy load non-critical pages for better performance
import { 
  LazyHomepage,
  LazyShopCategories,
  LazyShopCart,
  LazyShopCheckout,
  LazyOrderSuccess,
  LazyOrderTrack,
  LazyShopOrder,
  LazyShopSearch,
  LazyShopHowItWorks,
  LazyWorkTracker,
  LazyOrderWorkflowDashboard,
  LazyMainDashboard,
  LazyAdmin,
  LazyFeatureShowcase,
  LazyShopperDashboard,
  LazyCustomerDashboard,
  LazyConciergeDashboard,
  LazyDriverDashboard,
  LazyStoreManagerDashboard,
  LazyProfile,
  LazySystemArchitecture,
  LazyBotTesting,
  LazyWorkflowTesting,
  LazyWorkflowDocumentation,
  LazySitemap,
  LazyNotFound
} from './App.lazy';

// Keep critical components as direct imports for immediate loading
import ShopIndex from "@/pages/shop/ShopIndex";
import CategoryPage from "@/pages/shop/CategoryPage";
import Auth from "@/pages/Auth";
import ProductEdit from "@/pages/ProductEdit";
import ResetPassword from "@/pages/ResetPassword";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: (failureCount, error) => {
        // Retry up to 3 times for network errors
        if (failureCount < 3 && error instanceof Error) {
          return error.message.includes('fetch') || error.message.includes('network');
        }
        return false;
      },
    },
  },
});

// Add resource hints for better performance
addResourceHints();

// Component that uses router hooks - must be inside BrowserRouter
function AppRouter() {
  const { user, hasRole, roles } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Role-based default route redirect
  useEffect(() => {
    if (!user || location.pathname !== '/') return;

    // Redirect staff to their appropriate dashboards immediately (regardless of onboarding)
    if (hasRole('admin') || hasRole('sysadmin')) { navigate('/admin'); return; }
    if (hasRole('store_manager')) { navigate('/store-manager'); return; }
    if (hasRole('concierge')) { navigate('/concierge'); return; }
    if (hasRole('driver')) { navigate('/driver'); return; }
    if (hasRole('shopper')) { navigate('/shopper'); return; }

    // Clients stay on homepage for shopping
  }, [user, roles, hasRole, location.pathname, navigate]);

  return (
    <Routes>
      <Route path="/" element={<ShopIndex />} />
      <Route path="/app" element={
        <AsyncBoundary loadingText="Loading homepage...">
          <LazyHomepage />
        </AsyncBoundary>
      } />
      <Route path="/categories" element={
        <AsyncBoundary loadingText="Loading categories...">
          <LazyShopCategories />
        </AsyncBoundary>
      } />
      <Route path="/category/:categoryId" element={<CategoryPage />} />
      <Route path="/cart" element={
        <AsyncBoundary loadingText="Loading cart...">
          <LazyShopCart />
        </AsyncBoundary>
      } />
      <Route path="/checkout" element={
        <AsyncBoundary loadingText="Loading checkout...">
          <LazyShopCheckout />
        </AsyncBoundary>
      } />
      <Route path="/order-success" element={
        <AsyncBoundary loadingText="Loading order confirmation...">
          <LazyOrderSuccess />
        </AsyncBoundary>
      } />
      <Route path="/order-track" element={
        <AsyncBoundary loadingText="Loading order tracking...">
          <LazyOrderTrack />
        </AsyncBoundary>
      } />
      <Route path="/order" element={
        <AsyncBoundary loadingText="Loading order form...">
          <LazyShopOrder />
        </AsyncBoundary>
      } />
      <Route path="/search" element={
        <AsyncBoundary loadingText="Loading search...">
          <LazyShopSearch />
        </AsyncBoundary>
      } />
      <Route path="/how-it-works" element={
        <AsyncBoundary loadingText="Loading information...">
          <LazyShopHowItWorks />
        </AsyncBoundary>
      } />
      <Route path="/me" element={<RoleBasedRedirect />} />
      <Route path="/work-tracker" element={
        <AsyncBoundary loadingText="Loading work tracker...">
          <LazyWorkTracker />
        </AsyncBoundary>
      } />
      <Route path="/dashboard" element={
        <AsyncBoundary loadingText="Loading dashboard...">
          <LazyMainDashboard />
        </AsyncBoundary>
      } />
      <Route path="/shopper" element={
        <AsyncBoundary loadingText="Loading shopper dashboard...">
          <LazyShopperDashboard />
        </AsyncBoundary>
      } />
      <Route path="/customer" element={
        <AsyncBoundary loadingText="Loading customer dashboard...">
          <LazyCustomerDashboard />
        </AsyncBoundary>
      } />
      <Route path="/concierge" element={
        <AsyncBoundary loadingText="Loading concierge dashboard...">
          <LazyConciergeDashboard />
        </AsyncBoundary>
      } />
      <Route path="/driver" element={
        <AsyncBoundary loadingText="Loading driver dashboard...">
          <LazyDriverDashboard />
        </AsyncBoundary>
      } />
      <Route path="/store-manager" element={
        <AsyncBoundary loadingText="Loading store manager dashboard...">
          <LazyStoreManagerDashboard />
        </AsyncBoundary>
      } />
      <Route path="/order-workflow" element={
        <AsyncBoundary loadingText="Loading workflow dashboard...">
          <LazyOrderWorkflowDashboard />
        </AsyncBoundary>
      } />
      <Route path="/profile" element={
        <AsyncBoundary loadingText="Loading profile...">
          <LazyProfile />
        </AsyncBoundary>
      } />
      <Route path="/system-architecture" element={
        <AsyncBoundary loadingText="Loading system architecture...">
          <LazySystemArchitecture />
        </AsyncBoundary>
      } />
      <Route path="/auth" element={<Auth />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/admin" element={
        <AsyncBoundary loadingText="Loading admin panel...">
          <LazyAdmin />
        </AsyncBoundary>
      } />
      <Route path="/admin/product/:productId" element={<ProductEdit />} />
      <Route path="/feature-showcase" element={
        <AsyncBoundary loadingText="Loading features...">
          <LazyFeatureShowcase />
        </AsyncBoundary>
      } />
      <Route path="/bot-testing" element={
        <AsyncBoundary loadingText="Loading bot testing...">
          <LazyBotTesting />
        </AsyncBoundary>
      } />
      <Route path="/workflow-testing" element={
        <AsyncBoundary loadingText="Loading workflow testing...">
          <LazyWorkflowTesting />
        </AsyncBoundary>
      } />
      <Route path="/workflow-documentation" element={
        <AsyncBoundary loadingText="Loading documentation...">
          <LazyWorkflowDocumentation />
        </AsyncBoundary>
      } />
      <Route path="*" element={
        <AsyncBoundary loadingText="Loading page...">
          <LazyNotFound />
        </AsyncBoundary>
      } />
    </Routes>
  );
}

function AppContent() {
  const { user, loading, hasCompletedOnboarding } = useAuth();
  const { teamMembers } = useTeamMembers();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading application..." />
      </div>
    );
  }

  // Show onboarding for authenticated users who haven't completed it
  if (user && !hasCompletedOnboarding()) {
    return <UserOnboarding onComplete={() => {
      // updateProfile() in onboarding should refresh the auth context
      // No reload needed - the context will update automatically
    }} />;
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
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
import NotFound from "./pages/NotFound";
import Sitemap from "./pages/Sitemap";
import ShopIndex from "./pages/shop/ShopIndex";
import ShopCategories from "./pages/shop/ShopCategories";
import ShopOrder from "./pages/shop/ShopOrder";
import ShopHowItWorks from "./pages/shop/ShopHowItWorks";
import CategoryPage from "./pages/shop/CategoryPage";
import ShopCart from "./pages/shop/ShopCart";
import WorkTracker from "./pages/WorkTracker";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <CartProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<ShopIndex />} />
            <Route path="/categories" element={<ShopCategories />} />
            <Route path="/category/:categoryId" element={<CategoryPage />} />
            <Route path="/cart" element={<ShopCart />} />
            <Route path="/order" element={<ShopOrder />} />
            <Route path="/how-it-works" element={<ShopHowItWorks />} />
            <Route path="/work-tracker" element={<WorkTracker />} />
            <Route path="/sitemap" element={<Sitemap />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

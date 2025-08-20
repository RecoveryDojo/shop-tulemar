import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
import Index from "./pages/Index";
import Menu from "./pages/Menu";
import HowItWorks from "./pages/HowItWorks";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Order from "./pages/Order";
import NotFound from "./pages/NotFound";
import ShopIndex from "./pages/shop/ShopIndex";
import ShopCategories from "./pages/shop/ShopCategories";
import ShopOrder from "./pages/shop/ShopOrder";
import ShopHowItWorks from "./pages/shop/ShopHowItWorks";
import CategoryPage from "./pages/shop/CategoryPage";
import ShopCart from "./pages/shop/ShopCart";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <CartProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/menu" element={<Menu />} />
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/order" element={<Order />} />
            <Route path="/shop" element={<ShopIndex />} />
            <Route path="/shop/categories" element={<ShopCategories />} />
            <Route path="/shop/category/:categoryId" element={<CategoryPage />} />
            <Route path="/shop/cart" element={<ShopCart />} />
            <Route path="/shop/order" element={<ShopOrder />} />
            <Route path="/shop/how-it-works" element={<ShopHowItWorks />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

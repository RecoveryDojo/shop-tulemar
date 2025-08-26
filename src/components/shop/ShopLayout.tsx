import { ShopNavigation } from "./ShopNavigation";
import { Footer } from "@/components/Footer";

interface ShopLayoutProps {
  children: React.ReactNode;
}

export function ShopLayout({ children }: ShopLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col w-full">
      <ShopNavigation />
      
      {/* Main content */}
      <main className="flex-1 flex flex-col">
        <div className="flex-1">
          {children}
        </div>
        <Footer />
      </main>
    </div>
  );
}
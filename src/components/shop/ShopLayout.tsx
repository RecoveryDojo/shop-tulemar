import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ShopSidebar } from "./ShopSidebar";
import { Footer } from "@/components/Footer";

interface ShopLayoutProps {
  children: React.ReactNode;
}

export function ShopLayout({ children }: ShopLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <ShopSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Header with sidebar trigger */}
          <header className="h-12 flex items-center border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
            <SidebarTrigger className="ml-4" />
            <div className="ml-4">
              <h1 className="font-semibold text-foreground">Tulemar Shop</h1>
            </div>
          </header>

          {/* Main content */}
          <main className="flex-1 flex flex-col">
            <div className="flex-1">
              {children}
            </div>
            <Footer />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
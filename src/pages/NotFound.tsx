import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { ShopLayout } from "@/components/shop/ShopLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ShoppingBag } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <ShopLayout>
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center border-border">
          <CardContent className="pt-16 pb-8">
            <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground mb-6" />
            <h1 className="text-4xl font-bold text-foreground mb-4">404</h1>
            <p className="text-xl text-muted-foreground mb-6">
              Oops! This page doesn't exist
            </p>
            <p className="text-sm text-muted-foreground mb-8">
              The page you're looking for might have been moved or removed.
            </p>
            <div className="space-y-3">
              <Button className="w-full bg-gradient-tropical hover:opacity-90 text-white" asChild>
                <Link to="/">Back to Shop Home</Link>
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link to="/categories">Browse Categories</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </ShopLayout>
  );
};

export default NotFound;

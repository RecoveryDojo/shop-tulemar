import { ShopLayout } from '@/components/shop/ShopLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { 
  Home, 
  Grid, 
  ShoppingCart, 
  Package, 
  Info, 
  Apple, 
  Coffee, 
  Fish, 
  Beef, 
  ShoppingBag, 
  Wine, 
  Baby, 
  Leaf,
  MapIcon
} from 'lucide-react';

export default function Sitemap() {
  const mainPages = [
    {
      title: "Shop Home",
      path: "/",
      icon: Home,
      description: "Main shop page with featured products and categories"
    },
    {
      title: "Browse Categories",
      path: "/categories",
      icon: Grid,
      description: "View all product categories available in our shop"
    },
    {
      title: "Shopping Cart",
      path: "/cart",
      icon: ShoppingCart,
      description: "Review items in your cart and proceed to checkout"
    },
    {
      title: "Place Order",
      path: "/order",
      icon: Package,
      description: "Custom order form for special requests"
    },
    {
      title: "How It Works",
      path: "/how-it-works",
      icon: Info,
      description: "Learn about our delivery process and services"
    }
  ];

  const categoryPages = [
    {
      title: "Fresh Produce",
      path: "/category/fresh-produce",
      icon: Apple,
      description: "Tropical fruits, vegetables, and herbs"
    },
    {
      title: "Coffee & Beverages",
      path: "/category/coffee-beverages",
      icon: Coffee,
      description: "Premium Costa Rican coffee, teas, and juices"
    },
    {
      title: "Fresh Seafood",
      path: "/category/fresh-seafood",
      icon: Fish,
      description: "Daily catch from Pacific and Caribbean coasts"
    },
    {
      title: "Meat & Poultry",
      path: "/category/meat-poultry",
      icon: Beef,
      description: "Locally sourced beef, pork, and chicken"
    },
    {
      title: "Bakery & Grains",
      path: "/category/bakery-grains",
      icon: ShoppingBag,
      description: "Fresh bread, rice, pasta, and cereals"
    },
    {
      title: "Wines & Spirits",
      path: "/category/wines-spirits",
      icon: Wine,
      description: "Local and imported alcoholic beverages"
    },
    {
      title: "Baby & Family",
      path: "/category/baby-family",
      icon: Baby,
      description: "Baby food, diapers, and family essentials"
    },
    {
      title: "Organic & Health",
      path: "/category/organic-health",
      icon: Leaf,
      description: "Organic products and health supplements"
    }
  ];

  return (
    <ShopLayout>
      <div className="bg-background">
        {/* Header */}
        <section className="bg-gradient-tropical text-white py-16">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <MapIcon className="h-12 w-12" />
              <h1 className="text-4xl md:text-5xl font-bold">
                Sitemap
              </h1>
            </div>
            <p className="text-xl text-white/90 max-w-3xl mx-auto">
              Complete navigation guide to all pages and categories in Tulemar Shop
            </p>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 py-12">
          {/* Main Pages */}
          <section className="mb-12">
            <Card className="border-0 shadow-elegant">
              <CardHeader>
                <CardTitle className="text-2xl text-foreground flex items-center gap-2">
                  <Home className="h-6 w-6" />
                  Main Pages
                </CardTitle>
                <p className="text-muted-foreground">
                  Core pages for shopping and services
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {mainPages.map((page, index) => (
                    <Card key={index} className="border border-border hover:shadow-md transition-all duration-200">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="bg-gradient-tropical p-2 rounded-lg flex-shrink-0">
                            <page.icon className="h-5 w-5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-foreground mb-1">
                              {page.title}
                            </h3>
                            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                              {page.description}
                            </p>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {page.path}
                              </Badge>
                              <Button size="sm" variant="outline" asChild>
                                <Link to={page.path}>Visit</Link>
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Category Pages */}
          <section>
            <Card className="border-0 shadow-elegant">
              <CardHeader>
                <CardTitle className="text-2xl text-foreground flex items-center gap-2">
                  <Grid className="h-6 w-6" />
                  Product Categories
                </CardTitle>
                <p className="text-muted-foreground">
                  All available product categories with fresh, local items
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {categoryPages.map((category, index) => (
                    <Card key={index} className="border border-border hover:shadow-md transition-all duration-200">
                      <CardContent className="p-4">
                        <div className="text-center">
                          <div className="bg-gradient-tropical p-3 rounded-lg w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                            <category.icon className="h-6 w-6 text-white" />
                          </div>
                          <h3 className="font-semibold text-foreground mb-2">
                            {category.title}
                          </h3>
                          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                            {category.description}
                          </p>
                          <div className="space-y-2">
                            <Badge variant="outline" className="text-xs block">
                              {category.path}
                            </Badge>
                            <Button size="sm" className="w-full bg-gradient-tropical hover:opacity-90 text-white" asChild>
                              <Link to={category.path}>Shop Now</Link>
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Quick Actions */}
          <section className="mt-12">
            <Card className="border-0 shadow-elegant bg-gradient-tropical text-white">
              <CardContent className="p-8 text-center">
                <h2 className="text-2xl font-bold mb-4">Ready to Start Shopping?</h2>
                <p className="text-white/90 mb-6">
                  Browse our fresh, local products and get them delivered to your vacation rental
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button variant="secondary" size="lg" asChild>
                    <Link to="/">Browse All Categories</Link>
                  </Button>
                  <Button variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-primary" asChild>
                    <Link to="/cart">View Cart</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </ShopLayout>
  );
}
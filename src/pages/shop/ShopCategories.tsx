import { ShopLayout } from "@/components/shop/ShopLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Coffee, Apple, Fish, Beef, ShoppingBag, Wine, Baby, Leaf } from "lucide-react";
import { Link } from "react-router-dom";

export default function ShopCategories() {
  const categories = [
    {
      id: "dairy-eggs",
      icon: "🥛",
      name: "Dairy & Eggs",
      description: "Fresh dairy products, eggs, cheese, and milk",
      items: "10+ items",
      color: "from-blue-400 to-cyan-500"
    },
    {
      id: "fresh-produce",
      icon: Apple,
      name: "Fresh Produce",
      description: "Tropical fruits, vegetables, and herbs",
      items: "10+ items",
      color: "from-green-500 to-emerald-600"
    },
    {
      id: "coffee-beverages",
      icon: Coffee,
      name: "Coffee & Beverages",
      description: "Premium Costa Rican coffee, teas, and juices",
      items: "10+ items",
      color: "from-amber-600 to-orange-600"
    },
    {
      id: "fresh-seafood",
      icon: Fish,
      name: "Fresh Seafood",
      description: "Daily catch from Pacific and Caribbean coasts",
      items: "10+ items",
      color: "from-blue-500 to-cyan-600"
    },
    {
      id: "meat-poultry",
      icon: Beef,
      name: "Meat & Poultry",
      description: "Locally sourced beef, pork, and chicken",
      items: "10+ items",
      color: "from-red-500 to-pink-600"
    },
    {
      id: "bakery-grains",
      icon: ShoppingBag,
      name: "Bakery & Grains",
      description: "Fresh bread, rice, pasta, and cereals",
      items: "10+ items",
      color: "from-yellow-500 to-amber-600"
    },
    {
      id: "wines-spirits",
      icon: Wine,
      name: "Wines & Spirits",
      description: "Local and imported alcoholic beverages",
      items: "10+ items",
      color: "from-purple-500 to-indigo-600"
    },
    {
      id: "baby-family",
      icon: Baby,
      name: "Baby & Family",
      description: "Baby food, diapers, and family essentials",
      items: "10+ items",
      color: "from-pink-400 to-rose-500"
    },
    {
      id: "organic-health",
      icon: Leaf,
      name: "Organic & Health",
      description: "Organic products and health supplements",
      items: "10+ items",
      color: "from-emerald-400 to-green-500"
    }
  ];

  return (
    <ShopLayout>
      <div className="bg-background">
      
      {/* Header */}
      <section className="bg-gradient-tropical text-white py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Shop by Category
          </h1>
          <p className="text-xl text-white/90 max-w-3xl mx-auto">
            Browse our carefully curated selection of fresh, local products. 
            Everything you need for your Costa Rican vacation.
          </p>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {categories.map((category, index) => (
              <Card key={index} className="border-0 shadow-elegant hover:shadow-glow transition-all duration-300 hover-scale group">
                <CardHeader className="text-center">
                  <div className={`bg-gradient-to-r ${category.color} p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                    {typeof category.icon === 'string' ? (
                      <span className="text-3xl">{category.icon}</span>
                    ) : (
                      <category.icon className="h-10 w-10 text-white" />
                    )}
                  </div>
                  <CardTitle className="text-xl">{category.name}</CardTitle>
                  <CardDescription className="text-base">
                    {category.description}
                  </CardDescription>
                  <div className="text-sm text-primary font-medium">
                    {category.items}
                  </div>
                </CardHeader>
                <CardContent className="text-center">
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <Link to={`/category/${category.id}`}>
                      Browse {category.name}
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Need Help Finding Something?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Our team can help you create a custom shopping list for your vacation needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="hero" size="lg" asChild>
              <Link to="/order">Start Custom Order</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link to="/order">Contact Us</Link>
            </Button>
          </div>
        </div>
        </section>
      </div>
    </ShopLayout>
  );
}
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { QABot } from './QABot';
import { 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  Facebook, 
  Instagram, 
  Twitter,
  Leaf
} from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-card border-t border-border mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="bg-gradient-tropical p-2 rounded-lg">
                <Leaf className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-foreground">Tulemar</h3>
                <p className="text-sm text-muted-foreground">Costa Rican Experience</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Delivering authentic Costa Rican cuisine and grocery experiences 
              directly to your vacation rental in paradise.
            </p>
            <div className="flex gap-3">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Facebook className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Instagram className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Twitter className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">Quick Links</h4>
            <div className="space-y-2">
              <Link to="/" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                Shop Home
              </Link>
              <Link to="/categories" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                Browse Categories
              </Link>
              <Link to="/how-it-works" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                How It Works
              </Link>
              <Link to="/cart" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                Shopping Cart
              </Link>
              <Link to="/order" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                Place Order
              </Link>
            </div>
          </div>

          {/* Shop Categories */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">Shop Categories</h4>
            <div className="space-y-2">
              <Link to="/category/dairy-eggs" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                Dairy & Eggs
              </Link>
              <Link to="/category/fresh-produce" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                Fresh Produce
              </Link>
              <Link to="/category/coffee-beverages" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                Coffee & Beverages
              </Link>
              <Link to="/category/fresh-seafood" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                Fresh Seafood
              </Link>
              <Link to="/category/meat-poultry" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                Meat & Poultry
              </Link>
            </div>
          </div>

          {/* Contact & QA */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">Support</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 flex-shrink-0" />
                <span>Tulemar Resort, Manuel Antonio</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4 flex-shrink-0" />
                <span>+506 2777-0580</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4 flex-shrink-0" />
                <span>info@tulemar.com</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4 flex-shrink-0" />
                <span>7:00 AM - 10:00 PM Daily</span>
              </div>
            </div>
            
            <div className="pt-2">
              <QABot />
              <p className="text-xs text-muted-foreground mt-2">
                Get instant help with our QA assistant
              </p>
            </div>
          </div>
        </div>

        <Separator className="my-8" />

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm text-muted-foreground">
            © {currentYear} Tulemar. All rights reserved. | Authentic Costa Rican Experience
          </div>
          
          <div className="flex gap-6 text-sm">
            <Link to="/sitemap" className="text-muted-foreground hover:text-primary transition-colors">
              Sitemap
            </Link>
            <button className="text-muted-foreground hover:text-primary transition-colors">
              Privacy Policy
            </button>
            <button className="text-muted-foreground hover:text-primary transition-colors">
              Terms of Service
            </button>
            <button className="text-muted-foreground hover:text-primary transition-colors">
              Delivery Terms
            </button>
          </div>
        </div>

        {/* Testing Info */}
        <Card className="mt-6 bg-muted/30 border-border">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h5 className="font-medium text-foreground mb-1">QA Testing Available</h5>
                <p className="text-sm text-muted-foreground">
                  Use our QA bot to test site functionality, navigation, and features
                </p>
              </div>
              <QABot />
            </div>
          </div>
        </Card>
      </div>
    </footer>
  );
}
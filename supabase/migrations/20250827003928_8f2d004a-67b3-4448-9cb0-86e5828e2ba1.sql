-- Create grocery shop database tables for MVP

-- Products table to replace static data
CREATE TABLE public.products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  image_url TEXT,
  category_id TEXT NOT NULL,
  unit TEXT NOT NULL,
  origin TEXT,
  stock_quantity INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Orders table
CREATE TABLE public.orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_email TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  property_address TEXT,
  arrival_date DATE,
  departure_date DATE,
  guest_count INTEGER,
  dietary_restrictions JSONB,
  special_instructions TEXT,
  subtotal DECIMAL(10,2) NOT NULL,
  tax_amount DECIMAL(10,2) NOT NULL,
  delivery_fee DECIMAL(10,2) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'shopping', 'ready', 'delivered', 'cancelled')),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  payment_intent_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Order items table
CREATE TABLE public.order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Categories table
CREATE TABLE public.categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Public access policies for products and categories (customers need to see them)
CREATE POLICY "Products are viewable by everyone" ON public.products FOR SELECT USING (is_active = true);
CREATE POLICY "Categories are viewable by everyone" ON public.categories FOR SELECT USING (is_active = true);

-- Order policies (customers can view their own orders)
CREATE POLICY "Customers can insert orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Customers can view their own orders" ON public.orders FOR SELECT USING (customer_email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Order items policies
CREATE POLICY "Anyone can insert order items" ON public.order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Order items viewable by order owner" ON public.order_items FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = order_items.order_id 
    AND (orders.customer_email = (SELECT email FROM auth.users WHERE id = auth.uid()) OR auth.uid() IS NULL)
  )
);

-- Admin policies (for authenticated admin users)
CREATE POLICY "Admins can manage products" ON public.products FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can manage categories" ON public.categories FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can view all orders" ON public.orders FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can update orders" ON public.orders FOR UPDATE USING (auth.role() = 'authenticated');

-- Insert categories
INSERT INTO public.categories (id, name, icon, description) VALUES
('fresh-produce', 'Fresh Produce', '🥭', 'Fresh fruits and vegetables from local farms'),
('coffee-beverages', 'Coffee & Beverages', '☕', 'Local coffee, drinks, and beverages'),
('fresh-seafood', 'Fresh Seafood', '🐟', 'Fresh caught seafood from Pacific and Caribbean coasts'),
('meat-poultry', 'Meat & Poultry', '🥩', 'Fresh meat and poultry from local farms'),
('bakery-grains', 'Bakery & Grains', '🍞', 'Fresh bread, grains, and bakery items'),
('wines-spirits', 'Wines & Spirits', '🍷', 'Local and imported wines and spirits'),
('baby-family', 'Baby & Family', '👶', 'Baby products and family essentials'),
('organic-health', 'Organic & Health', '🌱', 'Organic and health-focused products');

-- Add trigger for updated_at
CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
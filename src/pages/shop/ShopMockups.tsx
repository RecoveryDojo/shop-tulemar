import { ShopLayout } from '@/components/shop/ShopLayout';
import { MockupCard } from '@/components/shop/MockupCard';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Check, X } from 'lucide-react';

export default function ShopMockups() {
  const mockups = [
    {
      title: 'Instacart Classic',
      description: 'Dense, efficient browsing with fixed sidebar navigation and horizontal product rows',
      features: [
        'Fixed left sidebar with all categories',
        'Horizontal scrollable product rows',
        'Top category icon strip for quick access',
        'Compact product cards (6-8 per row)',
        'Mobile: Drawer navigation'
      ],
      bestFor: 'Users who want to browse multiple categories quickly without navigation hassle',
      path: '/shop-v1',
      variant: 'v1' as const
    },
    {
      title: 'Grid Master',
      description: 'Balanced grid layout with collapsible sidebar and "load more" functionality',
      features: [
        'Minimal collapsible sidebar (hover to expand)',
        'Responsive grid layout (3-4 columns)',
        '8-12 products per category initially',
        '"Load More" buttons for progressive loading',
        'More breathing room between products'
      ],
      bestFor: 'Users who prefer organized grids and want to see more product details at once',
      path: '/shop-v2',
      variant: 'v2' as const
    },
    {
      title: 'Clean & Spacious',
      description: 'Premium feel with large imagery, generous whitespace, and mega menu navigation',
      features: [
        'Large hero section with prominent search',
        'Dropdown mega menu for categories',
        'Larger product cards with full descriptions',
        'Generous whitespace and clean design',
        'Best for high-end/premium aesthetic'
      ],
      bestFor: 'Premium brands and users who value visual appeal and detailed product information',
      path: '/shop-v3',
      variant: 'v3' as const
    },
    {
      title: 'Mobile-First Express',
      description: 'App-like experience optimized for mobile with bottom navigation and quick actions',
      features: [
        'Bottom navigation bar (mobile app style)',
        'Top category pills for filtering',
        'Image-first mini product cards',
        '2-column grid on all screen sizes',
        'Fast infinite scroll loading'
      ],
      bestFor: 'Mobile-heavy audiences and users who want quick, app-like shopping experience',
      path: '/shop-v4',
      variant: 'v4' as const
    }
  ];

  const comparisonData = [
    { feature: 'Sidebar Navigation', v1: true, v2: 'Minimal', v3: false, v4: false },
    { feature: 'Mobile-First Design', v1: false, v2: false, v3: false, v4: true },
    { feature: 'Product Density', v1: 'High', v2: 'Medium', v3: 'Low', v4: 'High' },
    { feature: 'Horizontal Scroll', v1: true, v2: false, v3: false, v4: false },
    { feature: 'Grid Layout', v1: false, v2: true, v3: true, v4: true },
    { feature: 'Progressive Loading', v1: false, v2: true, v3: false, v4: true },
    { feature: 'Search Prominence', v1: 'Low', v2: 'Low', v3: 'High', v4: 'Medium' },
    { feature: 'Best Screen Size', v1: 'Desktop', v2: 'Desktop', v3: 'Desktop/Tablet', v4: 'Mobile' },
  ];

  const renderCell = (value: boolean | string) => {
    if (typeof value === 'boolean') {
      return value ? (
        <Check className="h-5 w-5 text-primary mx-auto" />
      ) : (
        <X className="h-5 w-5 text-muted-foreground mx-auto" />
      );
    }
    return <span className="text-sm">{value}</span>;
  };

  return (
    <ShopLayout>
      <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background">
        {/* Header */}
        <section className="py-16 px-4">
          <div className="max-w-7xl mx-auto text-center">
            <Badge variant="secondary" className="mb-4">Client Presentation</Badge>
            <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-4">
              Tulemar Shop Design Options
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Four distinct homepage designs, each optimized for different user experiences. 
              Click any version to explore the full interactive mockup.
            </p>
          </div>
        </section>

        {/* Mockup Cards Grid */}
        <section className="py-12 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8">
              {mockups.map((mockup) => (
                <MockupCard key={mockup.variant} {...mockup} />
              ))}
            </div>
          </div>
        </section>

        {/* Comparison Table */}
        <section className="py-12 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="bg-card rounded-xl shadow-lg p-8 border border-border">
              <h2 className="text-3xl font-bold text-foreground mb-6 text-center">
                Feature Comparison
              </h2>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px]">Feature</TableHead>
                      <TableHead className="text-center">Version 1<br/><span className="text-xs text-muted-foreground">Classic</span></TableHead>
                      <TableHead className="text-center">Version 2<br/><span className="text-xs text-muted-foreground">Grid</span></TableHead>
                      <TableHead className="text-center">Version 3<br/><span className="text-xs text-muted-foreground">Clean</span></TableHead>
                      <TableHead className="text-center">Version 4<br/><span className="text-xs text-muted-foreground">Mobile</span></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {comparisonData.map((row, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{row.feature}</TableCell>
                        <TableCell className="text-center">{renderCell(row.v1)}</TableCell>
                        <TableCell className="text-center">{renderCell(row.v2)}</TableCell>
                        <TableCell className="text-center">{renderCell(row.v3)}</TableCell>
                        <TableCell className="text-center">{renderCell(row.v4)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </section>

        {/* Summary */}
        <section className="py-16 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-foreground mb-6">
              Ready to Choose?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Each design is fully functional with real product data. Click into any version 
              to experience the complete user flow, or contact us to discuss customizations 
              and hybrid approaches.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Badge variant="outline" className="text-sm py-2 px-4">All designs are mobile responsive</Badge>
              <Badge variant="outline" className="text-sm py-2 px-4">Full cart functionality included</Badge>
              <Badge variant="outline" className="text-sm py-2 px-4">Real-time data integration</Badge>
            </div>
          </div>
        </section>
      </div>
    </ShopLayout>
  );
}

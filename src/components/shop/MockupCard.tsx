import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

interface MockupCardProps {
  title: string;
  description: string;
  features: string[];
  bestFor: string;
  path: string;
  variant: 'v1' | 'v2' | 'v3' | 'v4';
}

const variantColors = {
  v1: 'from-emerald-500 to-teal-500',
  v2: 'from-blue-500 to-indigo-500',
  v3: 'from-purple-500 to-pink-500',
  v4: 'from-orange-500 to-red-500',
};

export function MockupCard({ title, description, features, bestFor, path, variant }: MockupCardProps) {
  return (
    <Card className="group hover:shadow-2xl transition-all duration-300 border-2 hover:border-primary/50">
      <CardHeader>
        <div className={`h-2 w-full rounded-full bg-gradient-to-r ${variantColors[variant]} mb-4`} />
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-2xl mb-2">{title}</CardTitle>
            <CardDescription className="text-base">{description}</CardDescription>
          </div>
          <Badge variant="secondary" className="ml-2">
            Version {variant.toUpperCase().replace('V', '')}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div>
          <h4 className="font-semibold text-sm text-muted-foreground mb-3">KEY FEATURES</h4>
          <ul className="space-y-2">
            {features.map((feature, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>
        
        <div className="pt-4 border-t border-border">
          <h4 className="font-semibold text-sm text-muted-foreground mb-2">BEST FOR</h4>
          <p className="text-sm font-medium text-foreground">{bestFor}</p>
        </div>
      </CardContent>
      
      <CardFooter className="flex gap-2">
        <Button asChild className="flex-1 group-hover:bg-primary-dark">
          <Link to={path}>
            View Full Version
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

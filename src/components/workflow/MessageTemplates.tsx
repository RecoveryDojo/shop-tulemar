import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Search, 
  MessageSquare, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Users,
  Package,
  Star,
  Plus,
  Edit
} from 'lucide-react';

interface MessageTemplate {
  id: string;
  title: string;
  category: string;
  phase: string;
  content: string;
  variables: string[];
  icon: React.ReactNode;
  priority: 'low' | 'normal' | 'high';
}

interface MessageTemplatesProps {
  orderPhase?: string;
  onSelectTemplate: (content: string) => void;
}

const MESSAGE_TEMPLATES: MessageTemplate[] = [
  // Shopping Phase Templates
  {
    id: 'shopping_started',
    title: 'Shopping Started',
    category: 'Status Update',
    phase: 'shopping',
    content: 'Shopping has begun for order {orderId}. Estimated completion time: {estimatedTime}. I will keep you updated on progress.',
    variables: ['orderId', 'estimatedTime'],
    icon: <Package className="h-4 w-4" />,
    priority: 'normal'
  },
  {
    id: 'substitution_request',
    title: 'Substitution Request',
    category: 'Product Issue',
    phase: 'shopping',
    content: 'Item "{itemName}" is unavailable. Suggesting substitute: "{substituteItem}" at {substitutePrice}. Please approve or suggest alternative.',
    variables: ['itemName', 'substituteItem', 'substitutePrice'],
    icon: <AlertTriangle className="h-4 w-4" />,
    priority: 'high'
  },
  {
    id: 'shopping_complete',
    title: 'Shopping Complete',
    category: 'Completion',
    phase: 'shopping',
    content: 'Shopping completed successfully! All {itemCount} items have been found and checked out. Moving to delivery preparation. Total: {totalAmount}.',
    variables: ['itemCount', 'totalAmount'],
    icon: <CheckCircle2 className="h-4 w-4" />,
    priority: 'normal'
  },

  // Delivery Phase Templates
  {
    id: 'delivery_started',
    title: 'Delivery Started',
    category: 'Status Update',
    phase: 'delivery',
    content: 'Your order is now out for delivery! Estimated arrival time: {arrivalTime}. Driver will contact you when nearby.',
    variables: ['arrivalTime'],
    icon: <Package className="h-4 w-4" />,
    priority: 'normal'
  },
  {
    id: 'delivery_delay',
    title: 'Delivery Delay',
    category: 'Issue',
    phase: 'delivery',
    content: 'Slight delay in delivery due to {reason}. New estimated arrival: {newArrival}. Apologize for the inconvenience.',
    variables: ['reason', 'newArrival'],
    icon: <Clock className="h-4 w-4" />,
    priority: 'high'
  },
  {
    id: 'delivery_complete',
    title: 'Delivery Complete',
    category: 'Completion',
    phase: 'delivery',
    content: 'Order successfully delivered to {address}! Thank you for choosing our service. Please rate your experience.',
    variables: ['address'],
    icon: <CheckCircle2 className="h-4 w-4" />,
    priority: 'normal'
  },

  // Stocking Phase Templates
  {
    id: 'stocking_started',
    title: 'Stocking Started',
    category: 'Status Update',
    phase: 'stocking',
    content: 'Beginning kitchen organization and stocking at {property}. All items will be properly stored and organized for your arrival.',
    variables: ['property'],
    icon: <Package className="h-4 w-4" />,
    priority: 'normal'
  },
  {
    id: 'stocking_complete',
    title: 'Stocking Complete',
    category: 'Completion',
    phase: 'stocking',
    content: 'Your rental kitchen is now fully stocked and organized! All groceries have been properly stored. Welcome package prepared. Ready for arrival on {arrivalDate}.',
    variables: ['arrivalDate'],
    icon: <CheckCircle2 className="h-4 w-4" />,
    priority: 'normal'
  },

  // General Templates
  {
    id: 'quality_check',
    title: 'Quality Check Passed',
    category: 'Quality',
    phase: 'all',
    content: 'Quality check completed successfully. All items meet our high standards. {additionalNotes}',
    variables: ['additionalNotes'],
    icon: <Star className="h-4 w-4" />,
    priority: 'normal'
  },
  {
    id: 'customer_question',
    title: 'Customer Question',
    category: 'Communication',
    phase: 'all',
    content: 'I have a question about your order: {question}. Please let me know your preference.',
    variables: ['question'],
    icon: <MessageSquare className="h-4 w-4" />,
    priority: 'high'
  },
  {
    id: 'team_coordination',
    title: 'Team Coordination',
    category: 'Internal',
    phase: 'all',
    content: 'Phase "{currentPhase}" completed successfully. Ready to proceed to next stage. {handoffNotes}',
    variables: ['currentPhase', 'handoffNotes'],
    icon: <Users className="h-4 w-4" />,
    priority: 'normal'
  }
];

export function MessageTemplates({ orderPhase, onSelectTemplate }: MessageTemplatesProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [customTemplateContent, setCustomTemplateContent] = useState('');
  const [showCustomTemplate, setShowCustomTemplate] = useState(false);

  const categories = ['all', 'Status Update', 'Completion', 'Product Issue', 'Issue', 'Quality', 'Communication', 'Internal'];

  const filteredTemplates = MESSAGE_TEMPLATES.filter(template => {
    const matchesSearch = template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    const matchesPhase = !orderPhase || template.phase === 'all' || template.phase === orderPhase;
    
    return matchesSearch && matchesCategory && matchesPhase;
  });

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case 'shopping': return 'bg-blue-100 text-blue-700';
      case 'delivery': return 'bg-green-100 text-green-700';
      case 'stocking': return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'normal': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  const replaceVariables = (content: string, variables: string[]) => {
    let processedContent = content;
    
    // Replace with sample values for demonstration
    const sampleValues: Record<string, string> = {
      orderId: '#SHOP-001',
      estimatedTime: '30 minutes',
      itemName: 'Organic Bananas',
      substituteItem: 'Regular Bananas',
      substitutePrice: '$2.99',
      itemCount: '12',
      totalAmount: '$85.50',
      arrivalTime: '3:30 PM',
      reason: 'traffic',
      newArrival: '4:00 PM',
      address: '123 Oak Street',
      property: 'Sunset Villa',
      arrivalDate: 'March 15th',
      additionalNotes: 'All organic items selected as requested.',
      question: 'Would you prefer whole milk or 2% milk?',
      currentPhase: orderPhase || 'current phase',
      handoffNotes: 'All items verified and ready for next step.'
    };

    variables.forEach(variable => {
      const value = sampleValues[variable] || `{${variable}}`;
      processedContent = processedContent.replace(new RegExp(`\\{${variable}\\}`, 'g'), value);
    });

    return processedContent;
  };

  const saveCustomTemplate = () => {
    if (customTemplateContent.trim()) {
      onSelectTemplate(customTemplateContent);
      setCustomTemplateContent('');
      setShowCustomTemplate(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="flex gap-2">
          {categories.map(category => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      {/* Current Phase Indicator */}
      {orderPhase && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Badge className={getPhaseColor(orderPhase)}>
                Current Phase: {orderPhase}
              </Badge>
              <span className="text-sm text-muted-foreground">
                Templates below are filtered for the current workflow phase
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Template Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredTemplates.map((template) => (
          <Card key={template.id} className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  {template.icon}
                  <CardTitle className="text-sm">{template.title}</CardTitle>
                </div>
                <div className="flex gap-1">
                  <Badge variant="outline" className="text-xs">
                    {template.category}
                  </Badge>
                  <Badge variant={getPriorityColor(template.priority)} className="text-xs">
                    {template.priority}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                <div className="text-sm text-muted-foreground line-clamp-3">
                  {replaceVariables(template.content, template.variables)}
                </div>
                
                {template.variables.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {template.variables.map(variable => (
                      <Badge key={variable} variant="secondary" className="text-xs">
                        {variable}
                      </Badge>
                    ))}
                  </div>
                )}
                
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => onSelectTemplate(replaceVariables(template.content, template.variables))}
                    className="flex-1"
                  >
                    Use Template
                  </Button>
                  <Button variant="outline" size="sm">
                    <Edit className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Custom Template */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Custom Template</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCustomTemplate(!showCustomTemplate)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Custom
            </Button>
          </CardTitle>
        </CardHeader>
        {showCustomTemplate && (
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Write your custom message template..."
              value={customTemplateContent}
              onChange={(e) => setCustomTemplateContent(e.target.value)}
              rows={4}
            />
            <div className="flex gap-2">
              <Button onClick={saveCustomTemplate} disabled={!customTemplateContent.trim()}>
                Use Custom Template
              </Button>
              <Button variant="outline" onClick={() => setShowCustomTemplate(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <div>No templates found</div>
          <div className="text-sm">Try adjusting your search or category filter</div>
        </div>
      )}
    </div>
  );
}
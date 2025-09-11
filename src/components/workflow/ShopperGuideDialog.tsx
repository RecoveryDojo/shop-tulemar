import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle, 
  ShoppingCart, 
  Truck, 
  MessageSquare, 
  Camera, 
  Star,
  AlertTriangle,
  Package
} from 'lucide-react';

interface GuideDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currentProtocol: string;
  currentStep?: number;
}

const guideContent = {
  shopping: {
    title: "Shopping Protocol Guide",
    description: "Complete guide for efficient order shopping",
    steps: [
      {
        title: "Review Order Details",
        description: "Check customer preferences, special instructions, and substitution rules",
        icon: <ShoppingCart className="w-5 h-5" />,
        tips: [
          "Read all customer notes carefully",
          "Check for dietary restrictions or allergies",
          "Note preferred brands or substitutions"
        ]
      },
      {
        title: "Navigate the Store",
        description: "Use the most efficient shopping route",
        icon: <CheckCircle className="w-5 h-5" />,
        tips: [
          "Start with non-perishables",
          "Shop frozen items last",
          "Follow the store layout for efficiency"
        ]
      },
      {
        title: "Item Selection",
        description: "Choose the best quality items for customers",
        icon: <Star className="w-5 h-5" />,
        tips: [
          "Check expiration dates carefully",
          "Select produce as if shopping for yourself",
          "When in doubt, choose the premium option"
        ]
      },
      {
        title: "Substitutions",
        description: "Handle unavailable items appropriately",
        icon: <AlertTriangle className="w-5 h-5" />,
        tips: [
          "Always message customer before substituting",
          "Choose similar size and brand when possible",
          "If no good substitute exists, skip the item"
        ]
      },
      {
        title: "Documentation",
        description: "Take photos and add notes as needed",
        icon: <Camera className="w-5 h-5" />,
        tips: [
          "Photo document any substitutions",
          "Add notes about quality or special finds",
          "Keep receipts organized"
        ]
      }
    ]
  },
  delivery: {
    title: "Delivery Protocol Guide", 
    description: "Safe and efficient delivery procedures",
    steps: [
      {
        title: "Pre-Delivery Prep",
        description: "Organize and verify orders before departure",
        icon: <Package className="w-5 h-5" />,
        tips: [
          "Double-check order completeness",
          "Organize by delivery route",
          "Ensure proper temperature control"
        ]
      },
      {
        title: "Navigation & Safety",
        description: "Use safe driving practices and efficient routing",
        icon: <Truck className="w-5 h-5" />,
        tips: [
          "Use GPS for optimal routes",
          "Drive safely and follow traffic laws",
          "Keep vehicle locked and secure"
        ]
      },
      {
        title: "Customer Interaction",
        description: "Professional and friendly delivery service",
        icon: <MessageSquare className="w-5 h-5" />,
        tips: [
          "Call/text when approaching delivery",
          "Be polite and professional",
          "Handle special delivery instructions"
        ]
      },
      {
        title: "Delivery Completion",
        description: "Proper handoff and documentation",
        icon: <CheckCircle className="w-5 h-5" />,
        tips: [
          "Verify customer identity if required",
          "Take delivery proof photo",
          "Mark order as complete in app"
        ]
      }
    ]
  },
  available: {
    title: "Order Selection Guide",
    description: "How to choose the best orders for your schedule",
    steps: [
      {
        title: "Order Assessment",
        description: "Evaluate order complexity and profitability",
        icon: <Star className="w-5 h-5" />,
        tips: [
          "Check item count and store location",
          "Review estimated time and pay",
          "Consider your current location"
        ]
      },
      {
        title: "Schedule Planning", 
        description: "Plan your day for maximum efficiency",
        icon: <CheckCircle className="w-5 h-5" />,
        tips: [
          "Group orders by store or area",
          "Leave buffer time between orders",
          "Consider traffic and store busy times"
        ]
      }
    ]
  }
};

export function ShopperGuideDialog({ isOpen, onClose, currentProtocol, currentStep }: GuideDialogProps) {
  const guide = guideContent[currentProtocol as keyof typeof guideContent] || guideContent.shopping;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <ShoppingCart className="w-4 h-4 text-primary" />
            </div>
            {guide.title}
          </DialogTitle>
          <DialogDescription>
            {guide.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {guide.steps.map((step, index) => (
            <div key={index} className="space-y-3">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  currentStep !== undefined && index <= currentStep 
                    ? 'bg-green-100 text-green-600' 
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {step.icon}
                </div>
                <div>
                  <h3 className="font-semibold">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
                {currentStep !== undefined && index <= currentStep && (
                  <Badge variant="secondary" className="ml-auto">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Complete
                  </Badge>
                )}
              </div>
              
              <div className="ml-11 space-y-2">
                <h4 className="text-sm font-medium text-foreground">Pro Tips:</h4>
                <ul className="space-y-1">
                  {step.tips.map((tip, tipIndex) => (
                    <li key={tipIndex} className="text-sm text-muted-foreground flex items-start gap-2">
                      <div className="w-1 h-1 bg-primary rounded-full mt-2 flex-shrink-0" />
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
              
              {index < guide.steps.length - 1 && <Separator className="ml-11" />}
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <h4 className="font-medium mb-2">Need Help?</h4>
          <p className="text-sm text-muted-foreground">
            Contact support through the messages tab or call the store directly if you encounter any issues.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
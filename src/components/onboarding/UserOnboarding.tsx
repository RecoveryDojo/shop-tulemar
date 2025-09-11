import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ChevronRight, Users, Home, Truck, HeadphonesIcon, Building2 } from 'lucide-react';

interface OnboardingStep {
  id: number;
  title: string;
  description: string;
}

const steps: OnboardingStep[] = [
  { id: 1, title: "Welcome", description: "Tell us about yourself" },
  { id: 2, title: "Your Role", description: "What best describes you?" },
  { id: 3, title: "Experience", description: "Your background with vacation rentals" },
  { id: 4, title: "Preferences", description: "How can we help you best?" },
  { id: 5, title: "Complete", description: "You're all set!" }
];

const roleOptions = [
  { id: 'client', label: 'Property Owner/Guest', description: 'I own or rent vacation properties', icon: Home },
  { id: 'store_manager', label: 'Store Manager', description: 'I manage grocery/supply operations', icon: Building2 },
  { id: 'shopper', label: 'Personal Shopper', description: 'I shop and prepare orders for guests', icon: Users },
  { id: 'driver', label: 'Delivery Driver', description: 'I deliver orders to properties', icon: Truck },
  { id: 'concierge', label: 'Concierge', description: 'I provide guest services and coordination', icon: HeadphonesIcon }
];

export function UserOnboarding({ onComplete }: { onComplete: () => void }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    displayName: '',
    phone: '',
    role: '',
    experience: '',
    propertyCount: '',
    primaryLocation: '',
    specialties: '',
    goals: ''
  });
  const { user, updateProfile } = useAuth();

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleComplete = async () => {
    try {
      // Update profile with onboarding data
      await supabase
        .from('profiles')
        .update({
          display_name: formData.displayName,
          phone: formData.phone,
          preferences: {
            experience: formData.experience,
            propertyCount: formData.propertyCount,
            primaryLocation: formData.primaryLocation,
            specialties: formData.specialties,
            goals: formData.goals,
            onboardingCompleted: true
          }
        })
        .eq('id', user?.id);

      // Assign role
      if (formData.role && formData.role !== 'client') {
        await supabase
          .from('user_roles')
          .insert({
            user_id: user?.id,
            role: formData.role as any
          });
      }

      await updateProfile();
      toast.success('Welcome! Your profile has been set up.');
      onComplete();
    } catch (error) {
      console.error('Onboarding error:', error);
      toast.error('Something went wrong. Please try again.');
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold mb-2">Welcome to Tulemar Concierge!</h2>
              <p className="text-muted-foreground">Let's get you set up in less than 2 minutes</p>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="displayName">What should we call you?</Label>
                <Input
                  id="displayName"
                  value={formData.displayName}
                  onChange={(e) => setFormData({...formData, displayName: e.target.value})}
                  placeholder="Your preferred name"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone number (optional)</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold mb-2">What best describes your role?</h2>
              <p className="text-muted-foreground">This helps us customize your experience</p>
            </div>
            <RadioGroup
              value={formData.role}
              onValueChange={(value) => setFormData({...formData, role: value})}
              className="space-y-3"
            >
              {roleOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <div key={option.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-accent/50 cursor-pointer">
                    <RadioGroupItem value={option.id} id={option.id} />
                    <Icon className="h-5 w-5 text-primary" />
                    <div className="flex-1">
                      <Label htmlFor={option.id} className="font-medium cursor-pointer">
                        {option.label}
                      </Label>
                      <p className="text-sm text-muted-foreground">{option.description}</p>
                    </div>
                  </div>
                );
              })}
            </RadioGroup>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold mb-2">Tell us about your experience</h2>
              <p className="text-muted-foreground">This helps us provide better support</p>
            </div>
            <RadioGroup
              value={formData.experience}
              onValueChange={(value) => setFormData({...formData, experience: value})}
              className="space-y-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="new" id="new" />
                <Label htmlFor="new">New to vacation rentals</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="some" id="some" />
                <Label htmlFor="some">Some experience (1-3 years)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="experienced" id="experienced" />
                <Label htmlFor="experienced">Very experienced (3+ years)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="professional" id="professional" />
                <Label htmlFor="professional">Industry professional</Label>
              </div>
            </RadioGroup>
            
            {formData.role === 'client' && (
              <div className="mt-4">
                <Label htmlFor="propertyCount">How many properties do you manage?</Label>
                <Input
                  id="propertyCount"
                  value={formData.propertyCount}
                  onChange={(e) => setFormData({...formData, propertyCount: e.target.value})}
                  placeholder="e.g., 1, 2-5, 6-10, 10+"
                />
              </div>
            )}
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold mb-2">How can we help you best?</h2>
              <p className="text-muted-foreground">Customize your experience</p>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="primaryLocation">Primary location/region</Label>
                <Input
                  id="primaryLocation"
                  value={formData.primaryLocation}
                  onChange={(e) => setFormData({...formData, primaryLocation: e.target.value})}
                  placeholder="e.g., Manuel Antonio, Costa Rica"
                />
              </div>
              <div>
                <Label htmlFor="specialties">Areas of interest/specialties (optional)</Label>
                <Textarea
                  id="specialties"
                  value={formData.specialties}
                  onChange={(e) => setFormData({...formData, specialties: e.target.value})}
                  placeholder="e.g., luxury properties, family-friendly, eco-tourism..."
                  rows={2}
                />
              </div>
              <div>
                <Label htmlFor="goals">What are your main goals? (optional)</Label>
                <Textarea
                  id="goals"
                  value={formData.goals}
                  onChange={(e) => setFormData({...formData, goals: e.target.value})}
                  placeholder="e.g., streamline guest services, increase bookings, improve efficiency..."
                  rows={2}
                />
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <ChevronRight className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">You're all set!</h2>
            <p className="text-muted-foreground">
              Welcome to Tulemar Concierge, {formData.displayName}! 
              Your profile has been customized based on your role as a {roleOptions.find(r => r.id === formData.role)?.label}.
            </p>
            <div className="bg-accent/50 p-4 rounded-lg text-sm">
              <p className="font-medium mb-2">Next steps:</p>
              <ul className="text-left space-y-1 text-muted-foreground">
                <li>• Explore your personalized dashboard</li>
                <li>• Connect with other team members</li>
                <li>• Set up your first project or order</li>
              </ul>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return formData.displayName.trim().length > 0;
      case 2:
        return formData.role.length > 0;
      case 3:
        return formData.experience.length > 0;
      case 4:
        return formData.primaryLocation.trim().length > 0;
      default:
        return true;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex justify-between items-center mb-4">
            {steps.map((step) => (
              <div
                key={step.id}
                className={`flex items-center ${step.id !== steps.length ? 'flex-1' : ''}`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step.id <= currentStep
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {step.id}
                </div>
                {step.id !== steps.length && (
                  <div
                    className={`flex-1 h-1 mx-2 rounded ${
                      step.id < currentStep ? 'bg-primary' : 'bg-muted'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <CardTitle>{steps[currentStep - 1]?.title}</CardTitle>
        </CardHeader>
        <CardContent>
          {renderStep()}
          
          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(currentStep - 1)}
              disabled={currentStep === 1}
            >
              Back
            </Button>
            
            {currentStep < steps.length ? (
              <Button
                onClick={handleNext}
                disabled={!isStepValid()}
              >
                Next
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleComplete}>
                Complete Setup
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
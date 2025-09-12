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
  { id: 3, title: "Complete", description: "You're all set!" }
];

const userTypeOptions = [
  { id: 'client', label: 'Guest', description: 'Here to buy groceries', icon: Home },
  { id: 'staff', label: 'Shop Staff', description: 'Here to support guests', icon: Users }
];

const staffRoleOptions = [
  { id: 'shopper', label: 'Shopper', description: 'I shop and prepare orders for guests', icon: Users },
  { id: 'driver', label: 'Driver', description: 'I deliver orders to properties', icon: Truck },
  { id: 'store_manager', label: 'Store Manager', description: 'I manage grocery/supply operations', icon: Building2 },
  { id: 'concierge', label: 'Concierge', description: 'I provide guest services and coordination', icon: HeadphonesIcon }
];

export function UserOnboarding({ onComplete }: { onComplete: () => void }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    displayName: '',
    phone: '',
    userType: '',
    role: ''
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
            onboardingCompleted: true
          }
        })
        .eq('id', user?.id);

      // Assign role (use 'client' for guests, actual role for staff)
      const finalRole = formData.userType === 'client' ? 'client' : formData.role;
      if (finalRole && finalRole !== 'client') {
        await supabase
          .from('user_roles')
          .insert({
            user_id: user?.id,
            role: finalRole as any
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
              <h2 className="text-xl font-bold mb-2">What brings you here?</h2>
              <p className="text-muted-foreground">This helps us customize your experience</p>
            </div>
            
            {!formData.userType && (
              <RadioGroup
                value={formData.userType}
                onValueChange={(value) => setFormData({...formData, userType: value, role: value === 'client' ? 'client' : ''})}
                className="space-y-3"
              >
                {userTypeOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <div key={option.id} className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-accent/50 cursor-pointer">
                      <RadioGroupItem value={option.id} id={option.id} />
                      <Icon className="h-6 w-6 text-primary" />
                      <div className="flex-1">
                        <Label htmlFor={option.id} className="font-medium cursor-pointer text-base">
                          {option.label}
                        </Label>
                        <p className="text-sm text-muted-foreground">{option.description}</p>
                      </div>
                    </div>
                  );
                })}
              </RadioGroup>
            )}

            {formData.userType === 'staff' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Select your role:</h3>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setFormData({...formData, userType: '', role: ''})}
                  >
                    Change
                  </Button>
                </div>
                <RadioGroup
                  value={formData.role}
                  onValueChange={(value) => setFormData({...formData, role: value})}
                  className="space-y-3"
                >
                  {staffRoleOptions.map((option) => {
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
            )}

            {formData.userType === 'client' && (
              <div className="bg-accent/50 p-4 rounded-lg">
                <p className="text-sm">Perfect! You're all set to start shopping for groceries.</p>
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <ChevronRight className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">You're all set!</h2>
            <p className="text-muted-foreground">
              Welcome to Tulemar Concierge, {formData.displayName}! 
              {formData.userType === 'client' 
                ? "You're ready to start shopping for groceries."
                : `Your profile has been set up as a ${staffRoleOptions.find(r => r.id === formData.role)?.label || 'team member'}.`
              }
            </p>
            <div className="bg-accent/50 p-4 rounded-lg text-sm">
              <p className="font-medium mb-2">Next steps:</p>
              <ul className="text-left space-y-1 text-muted-foreground">
                {formData.userType === 'client' ? (
                  <>
                    <li>• Browse available products</li>
                    <li>• Add items to your cart</li>
                    <li>• Place your first order</li>
                  </>
                ) : (
                  <>
                    <li>• Explore your personalized dashboard</li>
                    <li>• Connect with other team members</li>
                    <li>• Start managing orders and tasks</li>
                  </>
                )}
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
        if (formData.userType === 'client') return true;
        if (formData.userType === 'staff') return formData.role.length > 0;
        return formData.userType.length > 0;
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
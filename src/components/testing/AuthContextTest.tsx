import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';

export function AuthContextTest() {
  const { 
    user, 
    session, 
    profile, 
    roles, 
    loading, 
    hasRole, 
    isAdmin, 
    signIn, 
    signOut, 
    hasCompletedOnboarding 
  } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [testResults, setTestResults] = useState<string[]>([]);

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const handleSignIn = async () => {
    if (!email || !password) {
      toast({
        title: "Test Error",
        description: "Please enter email and password",
        variant: "destructive"
      });
      return;
    }

    const { error } = await signIn(email, password);
    if (!error) {
      addTestResult("✓ Sign in successful");
    } else {
      addTestResult("✗ Sign in failed: " + error.message);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    addTestResult("✓ Sign out completed");
  };

  const testRefreshPersistence = () => {
    addTestResult("Refresh the page to test session persistence...");
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  const clearTestResults = () => {
    setTestResults([]);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>AuthContext Hardening Test Suite</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Auth State */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Current Authentication State</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Loading:</strong> {loading ? "Yes" : "No"}
              </div>
              <div>
                <strong>Has Session:</strong> {session ? "Yes" : "No"}
              </div>
              <div>
                <strong>User ID:</strong> {user?.id || "None"}
              </div>
              <div>
                <strong>Email:</strong> {user?.email || profile?.email || "None"}
              </div>
              <div>
                <strong>Display Name:</strong> {profile?.display_name || "None"}
              </div>
              <div>
                <strong>Is Admin:</strong> {isAdmin ? "Yes" : "No"}
              </div>
              <div>
                <strong>Onboarding Complete:</strong> {hasCompletedOnboarding() ? "Yes" : "No"}
              </div>
            </div>
          </div>

          {/* Role Chips */}
          <div>
            <h3 className="text-lg font-semibold mb-3">User Roles</h3>
            <div className="flex gap-2 flex-wrap">
              {roles.length > 0 ? (
                roles.map(role => (
                  <Badge key={role} variant="secondary">
                    {role}
                  </Badge>
                ))
              ) : (
                <Badge variant="outline">No roles</Badge>
              )}
            </div>
          </div>

          <Separator />

          {/* 3-Step Test */}
          <div>
            <h3 className="text-lg font-semibold mb-3">3-Step Test Suite</h3>
            
            {/* Step 1: Sign In/Out */}
            <div className="space-y-4">
              <h4 className="font-medium">Step 1: Sign In/Out Test</h4>
              {!user ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="test@example.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="password"
                    />
                  </div>
                </div>
              ) : null}
              
              <div className="flex gap-2">
                {!user ? (
                  <Button onClick={handleSignIn} disabled={loading}>
                    Test Sign In
                  </Button>
                ) : (
                  <Button onClick={handleSignOut} variant="destructive">
                    Test Sign Out
                  </Button>
                )}
              </div>
            </div>

            {/* Step 2: Refresh Persistence */}
            <div className="space-y-4">
              <h4 className="font-medium">Step 2: Refresh Persistence Test</h4>
              <Button 
                onClick={testRefreshPersistence} 
                variant="outline"
                disabled={!user}
              >
                Test Session Persistence (Refresh Page)
              </Button>
            </div>

            {/* Step 3: Role Verification */}
            <div className="space-y-4">
              <h4 className="font-medium">Step 3: Role Verification</h4>
              <div className="grid grid-cols-3 gap-2">
                <Button 
                  onClick={() => addTestResult(`hasRole('admin'): ${hasRole('admin')}`)}
                  variant="outline"
                  size="sm"
                >
                  Test Admin Role
                </Button>
                <Button 
                  onClick={() => addTestResult(`hasRole('client'): ${hasRole('client')}`)}
                  variant="outline"
                  size="sm"
                >
                  Test Client Role
                </Button>
                <Button 
                  onClick={() => addTestResult(`isAdmin: ${isAdmin}`)}
                  variant="outline"
                  size="sm"
                >
                  Test isAdmin Helper
                </Button>
              </div>
            </div>
          </div>

          <Separator />

          {/* Test Results */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold">Test Results</h3>
              <Button onClick={clearTestResults} variant="outline" size="sm">
                Clear Results
              </Button>
            </div>
            <div className="bg-muted p-4 rounded-lg max-h-48 overflow-y-auto">
              {testResults.length > 0 ? (
                <div className="space-y-1">
                  {testResults.map((result, index) => (
                    <div key={index} className="text-sm font-mono">
                      {result}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No test results yet. Run the tests above.</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
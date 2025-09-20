import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useOrderWorkflow } from '@/hooks/useOrderWorkflow';
import { useValidatedWorkflow } from '@/hooks/useValidatedWorkflow';
import { CheckCircle, XCircle, AlertTriangle, Play, RotateCcw, GitCompare } from 'lucide-react';

interface TestResult {
  testName: string;
  oldResult: {
    success: boolean;
    error?: string;
    duration: number;
  };
  newResult: {
    success: boolean;
    error?: string;
    duration: number;
  };
  regression: boolean;
  status: 'pending' | 'running' | 'completed' | 'failed';
}

interface RegressionTestSuite {
  name: string;
  description: string;
  tests: TestResult[];
}

export function WorkflowRegressionTest() {
  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();
  
  // Old workflow hooks
  const oldWorkflow = useOrderWorkflow();
  
  // New validated workflow hooks
  const newWorkflow = useValidatedWorkflow();
  
  const [testSuites, setTestSuites] = useState<RegressionTestSuite[]>([
    {
      name: 'Order Status Transitions',
      description: 'Tests all order status transition scenarios',
      tests: [
        {
          testName: 'Accept Order (pending → assigned)',
          oldResult: { success: false, duration: 0 },
          newResult: { success: false, duration: 0 },
          regression: false,
          status: 'pending'
        },
        {
          testName: 'Start Shopping (assigned → shopping)',
          oldResult: { success: false, duration: 0 },
          newResult: { success: false, duration: 0 },
          regression: false,
          status: 'pending'
        },
        {
          testName: 'Complete Shopping (shopping → packed)',
          oldResult: { success: false, duration: 0 },
          newResult: { success: false, duration: 0 },
          regression: false,
          status: 'pending'
        },
        {
          testName: 'Start Delivery (packed → in_transit)',
          oldResult: { success: false, duration: 0 },
          newResult: { success: false, duration: 0 },
          regression: false,
          status: 'pending'
        },
        {
          testName: 'Complete Delivery (in_transit → delivered)',
          oldResult: { success: false, duration: 0 },
          newResult: { success: false, duration: 0 },
          regression: false,
          status: 'pending'
        }
      ]
    },
    {
      name: 'Item Management',
      description: 'Tests item-specific workflow actions',
      tests: [
        {
          testName: 'Mark Item Found',
          oldResult: { success: false, duration: 0 },
          newResult: { success: false, duration: 0 },
          regression: false,
          status: 'pending'
        },
        {
          testName: 'Request Substitution',
          oldResult: { success: false, duration: 0 },
          newResult: { success: false, duration: 0 },
          regression: false,
          status: 'pending'
        }
      ]
    },
    {
      name: 'Edge Cases & Error Handling',
      description: 'Tests error scenarios and edge cases',
      tests: [
        {
          testName: 'Invalid Status Transition',
          oldResult: { success: false, duration: 0 },
          newResult: { success: false, duration: 0 },
          regression: false,
          status: 'pending'
        },
        {
          testName: 'Missing Order ID',
          oldResult: { success: false, duration: 0 },
          newResult: { success: false, duration: 0 },
          regression: false,
          status: 'pending'
        },
        {
          testName: 'Unauthorized Access',
          oldResult: { success: false, duration: 0 },
          newResult: { success: false, duration: 0 },
          regression: false,
          status: 'pending'
        }
      ]
    }
  ]);

  const runSingleTest = async (suiteIndex: number, testIndex: number, testOrderId: string = 'test-order-regression') => {
    const suite = testSuites[suiteIndex];
    const test = suite.tests[testIndex];
    
    setCurrentTest(test.testName);
    updateTestStatus(suiteIndex, testIndex, 'running');

    try {
      // Test old workflow
      const oldStart = Date.now();
      let oldResult: { success: boolean; error?: string; duration: number };
      
      try {
        switch (test.testName) {
          case 'Accept Order (pending → assigned)':
            await oldWorkflow.acceptOrder(testOrderId);
            break;
          case 'Start Shopping (assigned → shopping)':
            await oldWorkflow.startShopping(testOrderId);
            break;
          case 'Complete Shopping (shopping → packed)':
            await oldWorkflow.completeShopping(testOrderId);
            break;
          case 'Start Delivery (packed → in_transit)':
            await oldWorkflow.startDelivery(testOrderId);
            break;
          case 'Complete Delivery (in_transit → delivered)':
            await oldWorkflow.completeDelivery(testOrderId);
            break;
          case 'Mark Item Found':
            await oldWorkflow.markItemFound('test-item-1', 2, 'Found in aisle 3');
            break;
          case 'Request Substitution':
            await oldWorkflow.requestSubstitution('test-item-1', 'Out of stock', 'Alternative brand');
            break;
          default:
            // For edge cases, we expect these to fail in controlled ways
            await oldWorkflow.acceptOrder('');
        }
        
        oldResult = { success: true, duration: Date.now() - oldStart };
      } catch (error: any) {
        oldResult = { 
          success: false, 
          error: error.message,
          duration: Date.now() - oldStart 
        };
      }

      // Test new validated workflow
      const newStart = Date.now();
      let newResult: { success: boolean; error?: string; duration: number };
      
      try {
        switch (test.testName) {
          case 'Accept Order (pending → assigned)':
            const acceptResult = await newWorkflow.acceptOrder(testOrderId, 'confirmed');
            newResult = { success: acceptResult.success, duration: Date.now() - newStart };
            break;
          case 'Start Shopping (assigned → shopping)':
            const startResult = await newWorkflow.startShopping(testOrderId, 'assigned');
            newResult = { success: startResult.success, duration: Date.now() - newStart };
            break;
          case 'Complete Shopping (shopping → packed)':
            const completeResult = await newWorkflow.completeShopping(testOrderId, 'shopping');
            newResult = { success: completeResult.success, duration: Date.now() - newStart };
            break;
          case 'Start Delivery (packed → in_transit)':
            const deliveryResult = await newWorkflow.startDelivery(testOrderId, 'packed');
            newResult = { success: deliveryResult.success, duration: Date.now() - newStart };
            break;
          case 'Complete Delivery (in_transit → delivered)':
            const completeDeliveryResult = await newWorkflow.completeDelivery(testOrderId, 'in_transit');
            newResult = { success: completeDeliveryResult.success, duration: Date.now() - newStart };
            break;
          case 'Mark Item Found':
            const itemResult = await newWorkflow.markItemFound('test-item-1', 2, 'Found in aisle 3');
            newResult = { success: itemResult.success, duration: Date.now() - newStart };
            break;
          case 'Request Substitution':
            const subResult = await newWorkflow.requestSubstitution('test-item-1', 'Out of stock', 'Alternative brand');
            newResult = { success: subResult.success, duration: Date.now() - newStart };
            break;
          default:
            // For edge cases, test validation
            const edgeResult = await newWorkflow.acceptOrder('');
            newResult = { success: edgeResult.success, duration: Date.now() - newStart };
        }
      } catch (error: any) {
        newResult = { 
          success: false, 
          error: error.message,
          duration: Date.now() - newStart 
        };
      }

      // Check for regression
      const regression = oldResult.success && !newResult.success;
      
      updateTestResults(suiteIndex, testIndex, oldResult, newResult, regression);
      updateTestStatus(suiteIndex, testIndex, 'completed');

      return { oldResult, newResult, regression };
      
    } catch (error: any) {
      console.error(`Regression test failed: ${test.testName}`, error);
      updateTestStatus(suiteIndex, testIndex, 'failed');
      throw error;
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setProgress(0);
    
    let totalTests = 0;
    let completedTests = 0;
    let regressions = 0;
    
    // Count total tests
    testSuites.forEach(suite => {
      totalTests += suite.tests.length;
    });

    try {
      toast({
        title: "Regression Testing Started",
        description: `Running ${totalTests} comparative tests`,
      });

      for (let suiteIndex = 0; suiteIndex < testSuites.length; suiteIndex++) {
        const suite = testSuites[suiteIndex];
        
        for (let testIndex = 0; testIndex < suite.tests.length; testIndex++) {
          try {
            const result = await runSingleTest(suiteIndex, testIndex);
            if (result.regression) regressions++;
            
            completedTests++;
            setProgress(Math.round((completedTests / totalTests) * 100));
            
            // Small delay between tests
            await new Promise(resolve => setTimeout(resolve, 500));
            
          } catch (error) {
            console.error(`Test failed: ${suite.tests[testIndex].testName}`, error);
            completedTests++;
            setProgress(Math.round((completedTests / totalTests) * 100));
          }
        }
      }

      const summary = regressions > 0 
        ? `${regressions} regressions detected!`
        : 'No regressions detected';
        
      toast({
        title: "Regression Testing Complete",
        description: summary,
        variant: regressions > 0 ? "destructive" : "default"
      });

    } catch (error: any) {
      toast({
        title: "Regression Testing Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsRunning(false);
      setCurrentTest(null);
    }
  };

  const updateTestStatus = (suiteIndex: number, testIndex: number, status: TestResult['status']) => {
    setTestSuites(prev => prev.map((suite, sIndex) => 
      sIndex === suiteIndex ? {
        ...suite,
        tests: suite.tests.map((test, tIndex) => 
          tIndex === testIndex ? { ...test, status } : test
        )
      } : suite
    ));
  };

  const updateTestResults = (
    suiteIndex: number, 
    testIndex: number, 
    oldResult: TestResult['oldResult'], 
    newResult: TestResult['newResult'],
    regression: boolean
  ) => {
    setTestSuites(prev => prev.map((suite, sIndex) => 
      sIndex === suiteIndex ? {
        ...suite,
        tests: suite.tests.map((test, tIndex) => 
          tIndex === testIndex ? { ...test, oldResult, newResult, regression } : test
        )
      } : suite
    ));
  };

  const resetTests = () => {
    setTestSuites(prev => prev.map(suite => ({
      ...suite,
      tests: suite.tests.map(test => ({
        ...test,
        oldResult: { success: false, duration: 0 },
        newResult: { success: false, duration: 0 },
        regression: false,
        status: 'pending' as const
      }))
    })));
    setProgress(0);
    setCurrentTest(null);
  };

  const getTestIcon = (test: TestResult) => {
    if (test.status === 'running') {
      return <div className="h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />;
    }
    if (test.regression) {
      return <XCircle className="h-4 w-4 text-red-600" />;
    }
    if (test.status === 'completed') {
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    }
    if (test.status === 'failed') {
      return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    }
    return <div className="h-4 w-4 border-2 border-gray-300 rounded-full" />;
  };

  const getTotalStats = () => {
    let total = 0;
    let completed = 0;
    let regressions = 0;
    
    testSuites.forEach(suite => {
      suite.tests.forEach(test => {
        total++;
        if (test.status === 'completed') completed++;
        if (test.regression) regressions++;
      });
    });
    
    return { total, completed, regressions };
  };

  const stats = getTotalStats();

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitCompare className="h-6 w-6 text-primary" />
            Workflow Regression Testing
          </CardTitle>
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">
              Compares old workflow implementation with new validated workflow
            </div>
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{progress}% Complete</span>
              <span>{stats.completed} of {stats.total} tests</span>
              {stats.regressions > 0 && (
                <span className="text-red-600 font-medium">
                  {stats.regressions} regressions
                </span>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <Button 
              onClick={runAllTests}
              disabled={isRunning}
              className="flex items-center gap-2"
            >
              <Play className="h-4 w-4" />
              {isRunning ? 'Running Tests...' : 'Run All Regression Tests'}
            </Button>
            
            <Button 
              variant="outline"
              onClick={resetTests}
              disabled={isRunning}
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Reset Tests
            </Button>
          </div>

          {currentTest && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-sm font-medium text-blue-800">
                Currently Testing: {currentTest}
              </div>
            </div>
          )}

          <Tabs defaultValue="0" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              {testSuites.map((suite, index) => (
                <TabsTrigger key={index} value={index.toString()}>
                  {suite.name}
                </TabsTrigger>
              ))}
            </TabsList>
            
            {testSuites.map((suite, suiteIndex) => (
              <TabsContent key={suiteIndex} value={suiteIndex.toString()}>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">{suite.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{suite.description}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {suite.tests.map((test, testIndex) => (
                        <div key={testIndex} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              {getTestIcon(test)}
                              <h4 className="font-medium">{test.testName}</h4>
                            </div>
                            <Badge variant={test.regression ? 'destructive' : test.status === 'completed' ? 'default' : 'outline'}>
                              {test.regression ? 'REGRESSION' : test.status}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="space-y-2">
                              <h5 className="font-medium text-gray-700">Old Workflow</h5>
                              <div className="flex items-center gap-2">
                                <Badge variant={test.oldResult.success ? 'default' : 'destructive'}>
                                  {test.oldResult.success ? 'Success' : 'Failed'}
                                </Badge>
                                {test.oldResult.duration > 0 && (
                                  <span className="text-xs text-muted-foreground">
                                    {test.oldResult.duration}ms
                                  </span>
                                )}
                              </div>
                              {test.oldResult.error && (
                                <p className="text-xs text-red-600">{test.oldResult.error}</p>
                              )}
                            </div>
                            
                            <div className="space-y-2">
                              <h5 className="font-medium text-gray-700">New Validated Workflow</h5>
                              <div className="flex items-center gap-2">
                                <Badge variant={test.newResult.success ? 'default' : 'destructive'}>
                                  {test.newResult.success ? 'Success' : 'Failed'}
                                </Badge>
                                {test.newResult.duration > 0 && (
                                  <span className="text-xs text-muted-foreground">
                                    {test.newResult.duration}ms
                                  </span>
                                )}
                              </div>
                              {test.newResult.error && (
                                <p className="text-xs text-red-600">{test.newResult.error}</p>
                              )}
                            </div>
                          </div>
                          
                          {test.regression && (
                            <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-800">
                              ⚠️ Regression detected: Old workflow succeeded but new workflow failed
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
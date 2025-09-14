import React from 'react';
import { WorkflowTestSuite } from '@/components/testing/WorkflowTestSuite';

export default function WorkflowTesting() {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Workflow Testing Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Comprehensive testing suite to validate all workflow automation, communication systems, and notifications work properly with real data.
          </p>
        </div>
        
        <WorkflowTestSuite />
        
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-card p-4 rounded-lg border">
            <h3 className="font-semibold mb-2">Communication Tests</h3>
            <p className="text-sm text-muted-foreground">
              Validate FloatingCommunicationWidget buttons, voice calls, and message sending functionality.
            </p>
          </div>
          
          <div className="bg-card p-4 rounded-lg border">
            <h3 className="font-semibold mb-2">Automation Tests</h3>
            <p className="text-sm text-muted-foreground">
              Test real-time workflow automation triggers on order status changes and stakeholder assignments.
            </p>
          </div>
          
          <div className="bg-card p-4 rounded-lg border">
            <h3 className="font-semibold mb-2">End-to-End Tests</h3>
            <p className="text-sm text-muted-foreground">
              Complete order workflow validation from creation through delivery with real data flow.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
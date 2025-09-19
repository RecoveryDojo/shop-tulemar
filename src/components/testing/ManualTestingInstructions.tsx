import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  FileText, 
  Camera, 
  AlertCircle, 
  CheckCircle2, 
  Clock,
  MessageSquare,
  Upload,
  Download,
  Mail,
  Phone
} from 'lucide-react';

export const ManualTestingInstructions = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Manual Testing: Error Documentation & Note-Taking Instructions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Issue Reporting Format */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <FileText className="h-5 w-5" />
              📋 Issue Reporting Format
            </h3>
            <div className="bg-muted p-4 rounded-lg space-y-2 font-mono text-sm">
              <div><strong>Issue ID:</strong> [TESTER-INITIALS]-[DATE]-[NUMBER] (e.g., CEL-0919-001)</div>
              <div><strong>Severity:</strong> Critical / High / Medium / Low</div>
              <div><strong>Category:</strong> UI/UX / Functionality / Performance / Data / Security</div>
              <div><strong>Page/Component:</strong> Exact location where issue occurred</div>
              <div><strong>User Role:</strong> Which role was active when issue happened</div>
              <div><strong>Steps to Reproduce:</strong></div>
              <div className="ml-4">1. Step one</div>
              <div className="ml-4">2. Step two</div>
              <div className="ml-4">3. Step three</div>
              <div><strong>Expected Result:</strong> What should have happened</div>
              <div><strong>Actual Result:</strong> What actually happened</div>
              <div><strong>Browser/Device:</strong> Chrome 118 / Mobile Safari / etc.</div>
              <div><strong>Screenshot/Video:</strong> [Required for visual issues]</div>
              <div><strong>Additional Notes:</strong> Any other relevant details</div>
            </div>
          </div>

          <Separator />

          {/* Evidence Collection */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Camera className="h-5 w-5" />
              🔍 Evidence Collection Requirements
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Screenshots</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div>• Capture full screen, not just the error area</div>
                  <div>• Include browser URL bar</div>
                  <div>• Show any error messages or console outputs</div>
                  <div>• For mobile: capture entire screen including status bar</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Console Logs</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div>• Press F12 → Console tab</div>
                  <div>• Screenshot any red errors</div>
                  <div>• Note exact error messages</div>
                  <div>• Include timestamp if visible</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Network Issues</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div>• F12 → Network tab</div>
                  <div>• Look for red/failed requests</div>
                  <div>• Note response codes (404, 500, etc.)</div>
                  <div>• Screenshot failed requests</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">User Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div>• Record exact sequence of clicks/taps</div>
                  <div>• Note any delays or slow responses</div>
                  <div>• Document unexpected behavior</div>
                  <div>• Include form input values if relevant</div>
                </CardContent>
              </Card>
            </div>
          </div>

          <Separator />

          {/* Severity Levels */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              📊 Severity Levels Guide
            </h3>
            
            <div className="space-y-3">
              <Card className="border-red-200 bg-red-50 dark:bg-red-950">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="destructive">Critical (P0)</Badge>
                    <span className="font-medium">Must fix before launch</span>
                  </div>
                  <div className="text-sm space-y-1">
                    <div>• Complete feature breakdown</div>
                    <div>• Data loss or corruption</div>
                    <div>• Security vulnerabilities</div>
                    <div>• Payment/checkout failures</div>
                    <div>• App crashes or infinite loading</div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-orange-500 hover:bg-orange-600">High (P1)</Badge>
                    <span className="font-medium">Fix within 24 hours</span>
                  </div>
                  <div className="text-sm space-y-1">
                    <div>• Core features not working as designed</div>
                    <div>• Poor user experience in main flows</div>
                    <div>• Performance issues affecting usability</div>
                    <div>• Missing critical information</div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-yellow-500 hover:bg-yellow-600">Medium (P2)</Badge>
                    <span className="font-medium">Fix within 48 hours</span>
                  </div>
                  <div className="text-sm space-y-1">
                    <div>• Minor UI inconsistencies</div>
                    <div>• Non-critical features not working</div>
                    <div>• Confusing but functional flows</div>
                    <div>• Missing nice-to-have features</div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-green-200 bg-green-50 dark:bg-green-950">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-green-500 hover:bg-green-600">Low (P3)</Badge>
                    <span className="font-medium">Fix when time permits</span>
                  </div>
                  <div className="text-sm space-y-1">
                    <div>• Cosmetic issues</div>
                    <div>• Typos or minor text issues</div>
                    <div>• Enhancement suggestions</div>
                    <div>• Edge case scenarios</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <Separator />

          {/* Daily Testing Log Template */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Clock className="h-5 w-5" />
              📝 Daily Testing Log Template
            </h3>
            
            <div className="bg-muted p-4 rounded-lg font-mono text-sm space-y-2">
              <div><strong>Date:</strong> [Date]</div>
              <div><strong>Tester:</strong> [Your Name/Role]</div>
              <div><strong>Testing Session:</strong> [Morning/Afternoon/Evening]</div>
              <div><strong>Duration:</strong> [Start Time - End Time]</div>
              <div><strong>Browser/Device:</strong> [Chrome Desktop / iPhone Safari / etc.]</div>
              <div className="pt-2"><strong>Tests Completed:</strong></div>
              <div>- [ ] Test scenario 1</div>
              <div>- [ ] Test scenario 2</div>
              <div>- [ ] Test scenario 3</div>
              <div className="pt-2"><strong>Issues Found:</strong> [Total count by severity]</div>
              <div>- Critical: X</div>
              <div>- High: X</div>
              <div>- Medium: X</div>
              <div>- Low: X</div>
              <div className="pt-2"><strong>Overall Assessment:</strong> [Working well / Major issues / Needs work]</div>
              <div><strong>Next Session Focus:</strong> [What to prioritize next]</div>
            </div>
          </div>

          <Separator />

          {/* Issue Submission Process */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Upload className="h-5 w-5" />
              📧 Issue Submission Process
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="border-red-200">
                <CardHeader>
                  <CardTitle className="text-base text-red-600 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Immediate Reporting (Critical Issues)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div>1. Take screenshot/video evidence</div>
                  <div>2. Document using format above</div>
                  <div>3. Send to: qa-team@company.com</div>
                  <div>4. Subject: "CRITICAL - [Issue ID] - [Brief Description]"</div>
                  <div>5. Include: Full issue report + evidence</div>
                </CardContent>
              </Card>

              <Card className="border-blue-200">
                <CardHeader>
                  <CardTitle className="text-base text-blue-600 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Daily Batch Reporting (All Other Issues)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div>1. Compile all issues found during day</div>
                  <div>2. Use provided report template</div>
                  <div>3. Submit by end of testing day</div>
                  <div>4. Include evidence folder/zip</div>
                </CardContent>
              </Card>
            </div>
          </div>

          <Separator />

          {/* Recommended Tools */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Download className="h-5 w-5" />
              🎯 Real-Time Notes (Recommended Tools)
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card>
                <CardContent className="p-3 text-center">
                  <div className="font-medium">Google Docs</div>
                  <div className="text-xs text-muted-foreground">Shareable, real-time</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 text-center">
                  <div className="font-medium">Notion</div>
                  <div className="text-xs text-muted-foreground">Good for organizing</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 text-center">
                  <div className="font-medium">Text File</div>
                  <div className="text-xs text-muted-foreground">With timestamps</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 text-center">
                  <div className="font-medium">Voice Memos</div>
                  <div className="text-xs text-muted-foreground">Quick capture</div>
                </CardContent>
              </Card>
            </div>
          </div>

          <Separator />

          {/* What NOT to Report */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              ❌ What NOT to Report
            </h3>
            
            <Card className="bg-muted">
              <CardContent className="p-4">
                <div className="text-sm space-y-2">
                  <div><strong>Don't report these as bugs:</strong></div>
                  <div>• Loading states (unless they never resolve)</div>
                  <div>• Features mentioned as "coming soon"</div>
                  <div>• Placeholder text or images</div>
                  <div>• Test data inconsistencies</div>
                  <div>• Minor styling differences between browsers (unless broken)</div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Separator />

          {/* Emergency Contacts */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Phone className="h-5 w-5" />
              🚨 Emergency Contact Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="border-red-200">
                <CardHeader>
                  <CardTitle className="text-base text-red-600">Critical Issues</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    qa-team@company.com
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    +1 (555) 123-4567
                  </div>
                  <div className="text-xs text-muted-foreground">24/7 for critical issues only</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">General Questions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Slack: #qa-testing
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    support@company.com
                  </div>
                  <div className="text-xs text-muted-foreground">Business hours: 9 AM - 6 PM</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
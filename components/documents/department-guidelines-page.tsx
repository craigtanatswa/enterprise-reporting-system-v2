import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, FileText, Upload, CheckCircle, AlertCircle, Users } from "lucide-react"

interface DepartmentGuidelinesPageProps {
  departmentLabel: string
}

export function DepartmentGuidelinesPage({ departmentLabel }: DepartmentGuidelinesPageProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <BookOpen className="h-8 w-8" />
          {departmentLabel} Submission Guidelines
        </h1>
        <p className="text-muted-foreground">
          Standards and procedures for document submission
        </p>
      </div>

      {/* Document Categories */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Document Categories
          </CardTitle>
          <CardDescription>Required report types for your department</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="border rounded-lg p-4">
              <h4 className="font-medium mb-2">Weekly Report</h4>
              <p className="text-sm text-muted-foreground">
                Submitted every Friday by 5:00 PM. Covers the week&apos;s activities, achievements, and challenges.
              </p>
            </div>
            <div className="border rounded-lg p-4">
              <h4 className="font-medium mb-2">Quarterly Report</h4>
              <p className="text-sm text-muted-foreground">
                Due within 5 working days after quarter end. Comprehensive review of quarterly performance.
              </p>
            </div>
            <div className="border rounded-lg p-4">
              <h4 className="font-medium mb-2">Balance Scorecard</h4>
              <p className="text-sm text-muted-foreground">
                Monthly submission. Key performance indicators and metrics tracking.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submission Process */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Submission Process
          </CardTitle>
          <CardDescription>Step-by-step guide for submitting documents</CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="space-y-4">
            <li className="flex gap-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">1</span>
              <div>
                <h4 className="font-medium">Prepare Your Document</h4>
                <p className="text-sm text-muted-foreground">
                  Ensure your report is complete and follows the department template. Supported formats: PDF, Word, Excel.
                </p>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">2</span>
              <div>
                <h4 className="font-medium">Upload and Fill Details</h4>
                <p className="text-sm text-muted-foreground">
                  Click &quot;Upload New Report&quot;, select your file, and fill in the required fields including title, reporting period, and category.
                </p>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">3</span>
              <div>
                <h4 className="font-medium">Save as Draft or Submit</h4>
                <p className="text-sm text-muted-foreground">
                  You can save as draft to continue later, or submit immediately for review. Once submitted, the document is locked.
                </p>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">4</span>
              <div>
                <h4 className="font-medium">Track Review Status</h4>
                <p className="text-sm text-muted-foreground">
                  Monitor your document status. If returned with comments, create a new version addressing the feedback.
                </p>
              </div>
            </li>
          </ol>
        </CardContent>
      </Card>

      {/* Review Workflow */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Review Workflow
          </CardTitle>
          <CardDescription>Understanding the approval process</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium">HOD Review</h4>
                <p className="text-sm text-muted-foreground">
                  Your Head of Department reviews all submitted documents. They may approve, return with comments, or forward to MD.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium">MD Review</h4>
                <p className="text-sm text-muted-foreground">
                  The Managing Director reviews forwarded documents and provides final approval or comments.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium">Audit Access</h4>
                <p className="text-sm text-muted-foreground">
                  The Audit team has read-only access to all documents, versions, and comments for compliance purposes.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Important Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Important Notes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>- Submitted documents cannot be edited. Create a new version if changes are needed.</li>
            <li>- All document actions are logged for audit purposes.</li>
            <li>- Previous versions are preserved and accessible in the document history.</li>
            <li>- Comments added by reviewers are immutable and part of the audit trail.</li>
            <li>- Maximum file size: 10MB per document.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}

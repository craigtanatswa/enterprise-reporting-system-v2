export default function PendingApprovalPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="max-w-md text-center space-y-4">
        <h1 className="text-2xl font-bold">Account Pending Approval</h1>
        <p className="text-muted-foreground">
          Your account has been created successfully but requires administrator approval
          before you can access the system.
        </p>
        <p className="text-sm text-muted-foreground">
          You will receive an email once your account is approved.
        </p>
      </div>
    </div>
  )
}

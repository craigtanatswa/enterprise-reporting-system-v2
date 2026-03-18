import Image from "next/image"
import Link from "next/link"

export default function PendingApprovalPage() {
  return (
    <div className="flex min-h-svh w-full flex-col items-center justify-center p-6 md:p-10 bg-muted/40">
      <div className="w-full max-w-md">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col items-center gap-2 text-center">
            <Link href="/" className="flex items-center justify-center">
              <div className="relative h-30 w-48">
                <Image src="/arda-logo.png" alt="ARDA Seeds" fill className="object-contain" priority />
              </div>
            </Link>
            <p className="text-sm text-muted-foreground">Enterprise Reporting Platform</p>
          </div>
          <div className="max-w-md text-center space-y-4 rounded-lg border bg-card p-6">
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
      </div>
    </div>
  )
}

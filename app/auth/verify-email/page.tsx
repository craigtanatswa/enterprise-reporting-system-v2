"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Mail, Clock, AlertCircle } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useSearchParams } from "next/navigation"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function VerifyEmailPage() {
  const searchParams = useSearchParams()
  const type = searchParams.get("type") // "bootstrap" or "pending"
  const error = searchParams.get("error") // "email-not-verified" or "pending-approval"

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10 bg-muted/40">
      <div className="w-full max-w-md">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="relative h-30 w-48">
              <Image src="/arda-logo.png" alt="ARDA Seeds" fill className="object-contain" priority />
            </div>
            <p className="text-sm text-muted-foreground">Enterprise Reporting Platform</p>
          </div>

          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                {error ? (
                  <AlertCircle className="h-8 w-8 text-destructive" />
                ) : type === "bootstrap" ? (
                  <Mail className="h-8 w-8 text-primary" />
                ) : (
                  <Clock className="h-8 w-8 text-primary" />
                )}
              </div>
              <CardTitle className="text-2xl">
                {error === "email-not-verified"
                  ? "Email Not Verified"
                  : error === "pending-approval"
                    ? "Account Pending Approval"
                    : type === "bootstrap"
                      ? "Check Your Email"
                      : "Account Created"}
              </CardTitle>
              <CardDescription>
                {error === "email-not-verified"
                  ? "You must verify your email address before accessing the system."
                  : error === "pending-approval"
                    ? "Your account is awaiting administrator approval."
                    : type === "bootstrap"
                      ? "We've sent you a verification link to confirm your email address."
                      : "Your account has been created and is pending administrator approval."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error === "email-not-verified" && (
                <>
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Verification Required</AlertTitle>
                    <AlertDescription>
                      You attempted to log in without verifying your email. Please check your inbox for the verification
                      link and click it before trying to log in again.
                    </AlertDescription>
                  </Alert>
                  <div className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
                    <p className="mb-2">Can't find the verification email?</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Check your spam or junk folder</li>
                      <li>Make sure you used the correct email address</li>
                      <li>Contact your administrator if you need help</li>
                    </ul>
                  </div>
                </>
              )}

              {error === "pending-approval" && (
                <>
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Approval Required</AlertTitle>
                    <AlertDescription>
                      Your email is verified, but an administrator must approve your account before you can access the
                      system. You will receive an email notification once approved.
                    </AlertDescription>
                  </Alert>
                  <div className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
                    <p className="mb-2">What happens next?</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>An administrator will review your account request</li>
                      <li>You'll receive an email when your account is activated</li>
                      <li>Once activated, you can sign in to access your dashboard</li>
                    </ul>
                  </div>
                </>
              )}

              {!error && type === "bootstrap" && (
                <>
                  <div className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
                    <p className="mb-2">
                      Please check your inbox and click the verification link to activate your Bootstrap Admin account.
                    </p>
                    <p>If you don't see the email, check your spam folder.</p>
                  </div>
                  <Alert>
                    <AlertTitle>First Admin Account</AlertTitle>
                    <AlertDescription>
                      As the Bootstrap Admin, you'll have full system access and the ability to create additional
                      administrators.
                    </AlertDescription>
                  </Alert>
                </>
              )}

              {!error && type === "pending" && (
                <>
                  <div className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
                    <p className="mb-2">
                      Your account has been created successfully. You must complete both steps below before you can
                      access the system:
                    </p>
                  </div>
                  <Alert>
                    <AlertTitle>Required Steps for Account Activation</AlertTitle>
                    <AlertDescription>
                      <ol className="list-decimal list-inside space-y-2 mt-2">
                        <li className="font-medium">
                          Verify your email address
                          <p className="text-xs font-normal text-muted-foreground ml-5 mt-1">
                            Check your inbox for the verification link and click it
                          </p>
                        </li>
                        <li className="font-medium">
                          Wait for administrator approval
                          <p className="text-xs font-normal text-muted-foreground ml-5 mt-1">
                            An admin will review and activate your account (you'll receive an email notification)
                          </p>
                        </li>
                        <li className="font-medium">
                          Sign in to your dashboard
                          <p className="text-xs font-normal text-muted-foreground ml-5 mt-1">
                            Once both steps are complete, you can log in
                          </p>
                        </li>
                      </ol>
                    </AlertDescription>
                  </Alert>
                </>
              )}

              <Button variant="outline" className="w-full bg-transparent" asChild>
                <Link href="/auth/login">Return to Sign In</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

"use client"

import type React from "react"

import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Suspense, useState } from "react"
import Image from "next/image"
import { ArrowLeft, Mail, CheckCircle2 } from "lucide-react"

/**
 * PKCE verifier lives in cookies. Exchange must run in a Route Handler (same cookies on redirect).
 * Add to Supabase → Authentication → Redirect URLs: .../auth/callback (and full URL with origin).
 */
function resetRedirectTo(): string {
  if (typeof window === "undefined") return ""
  const next = encodeURIComponent("/auth/reset-password")
  return `${window.location.origin}/auth/callback?next=${next}`
}

function decodeParam(raw: string) {
  try {
    return decodeURIComponent(raw)
  } catch {
    return raw
  }
}

function ForgotPasswordForm() {
  const searchParams = useSearchParams()
  const urlError = searchParams.get("error")

  const [email, setEmail] = useState("")
  const [error, setError] = useState<string | null>(urlError ? decodeParam(urlError) : null)
  const [isLoading, setIsLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const redirectTo = resetRedirectTo()
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: redirectTo || undefined,
      })
      if (resetError) throw resetError
      setSent(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10 bg-muted/40">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="relative h-30 w-48">
              <Image src="/arda-logo.png" alt="ARDA Seeds" fill className="object-contain" priority />
            </div>
            <p className="text-sm text-muted-foreground">Enterprise Reporting Platform</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Forgot password</CardTitle>
              <CardDescription>
                Enter your work email and we will send you a link to choose a new password.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {sent ? (
                <div className="space-y-4">
                  <Alert className="border-green-500/30 bg-green-500/10">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800 dark:text-green-400">
                      If an account exists for <strong>{email}</strong>, you will receive an email with a reset link
                      shortly. The link expires after a short time.
                    </AlertDescription>
                  </Alert>
                  <p className="text-sm text-muted-foreground">
                    In Supabase → Authentication → URL Configuration, add your app&apos;s{" "}
                    <code className="text-xs bg-muted px-1 py-0.5 rounded">/auth/callback</code> URL to{" "}
                    <strong>Redirect URLs</strong>. Use the same hostname you use here (e.g.{" "}
                    <code className="text-xs bg-muted px-1 py-0.5 rounded">localhost</code> vs{" "}
                    <code className="text-xs bg-muted px-1 py-0.5 rounded">127.0.0.1</code>).
                  </p>
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/auth/login">Back to sign in</Link>
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="user@ardaseed.com"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  {error && (
                    <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3">
                      <p className="text-sm text-destructive">{error}</p>
                    </div>
                  )}
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      "Sending…"
                    ) : (
                      <>
                        <Mail className="mr-2 h-4 w-4" />
                        Send reset link
                      </>
                    )}
                  </Button>
                  <Button variant="ghost" className="w-full" asChild>
                    <Link href="/auth/login">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back to sign in
                    </Link>
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default function ForgotPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-svh w-full items-center justify-center p-6 bg-muted/40">
          <p className="text-sm text-muted-foreground">Loading…</p>
        </div>
      }
    >
      <ForgotPasswordForm />
    </Suspense>
  )
}

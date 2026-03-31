"use client"

import type React from "react"

import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useEffect, useState } from "react"
import Image from "next/image"
import { KeyRound, Loader2 } from "lucide-react"

const MIN_PASSWORD_LENGTH = 8

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [sessionReady, setSessionReady] = useState(false)
  const [initError, setInitError] = useState<string | null>(null)
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [initializing, setInitializing] = useState(true)

  useEffect(() => {
    let cancelled = false

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (cancelled) return
      if (event === "PASSWORD_RECOVERY" && nextSession) {
        setSessionReady(true)
        setInitError(null)
        setInitializing(false)
      }
    })

    async function establishSession() {
      setInitError(null)
      const code = searchParams.get("code")

      try {
        // Legacy links pointed here with ?code=. Exchange must run in /auth/callback
        // so the PKCE verifier from cookies is available on the server request.
        if (code) {
          const next = encodeURIComponent("/auth/reset-password")
          window.location.replace(
            `${window.location.origin}/auth/callback?code=${encodeURIComponent(code)}&next=${next}`,
          )
          return
        }

        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!cancelled && session) {
          setSessionReady(true)
          setInitializing(false)
          return
        }

        // Hash-based recovery: client may apply tokens after first paint
        await new Promise<void>((resolve) => {
          requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
        })
        if (cancelled) return

        const {
          data: { session: sessionAfterPaint },
        } = await supabase.auth.getSession()

        if (!cancelled && sessionAfterPaint) {
          setSessionReady(true)
          setInitializing(false)
          return
        }

        if (!cancelled) {
          setInitializing(false)
          setInitError(
            "This reset link is invalid or has expired. Request a new one from the forgot password page.",
          )
        }
      } catch (e: unknown) {
        if (!cancelled) {
          setInitError(e instanceof Error ? e.message : "Could not validate reset link")
          setInitializing(false)
        }
      }
    }

    void establishSession()

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`)
      return
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    setIsLoading(true)
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password })
      if (updateError) throw updateError
      await supabase.auth.signOut()
      router.push("/auth/login?reset=success")
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not update password")
    } finally {
      setIsLoading(false)
    }
  }

  if (initializing) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-4 py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Verifying reset link…</p>
        </CardContent>
      </Card>
    )
  }

  if (initError || !sessionReady) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Link not valid</CardTitle>
          <CardDescription>{initError || "We could not start a password reset session."}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button className="w-full" asChild>
            <Link href="/auth/forgot-password">Request a new link</Link>
          </Button>
          <Button variant="outline" className="w-full" asChild>
            <Link href="/auth/login">Back to sign in</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Set new password</CardTitle>
        <CardDescription>Choose a strong password you have not used elsewhere.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="password">New password</Label>
            <Input
              id="password"
              type="password"
              required
              autoComplete="new-password"
              minLength={MIN_PASSWORD_LENGTH}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="confirm">Confirm new password</Label>
            <Input
              id="confirm"
              type="password"
              required
              autoComplete="new-password"
              minLength={MIN_PASSWORD_LENGTH}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
          {error && (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              "Saving…"
            ) : (
              <>
                <KeyRound className="mr-2 h-4 w-4" />
                Update password
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

export default function ResetPasswordPage() {
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

          <Suspense
            fallback={
              <Card>
                <CardContent className="flex flex-col items-center justify-center gap-4 py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Loading…</p>
                </CardContent>
              </Card>
            }
          >
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </div>
  )
}

import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

function safeNextPath(next: string | null): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return "/auth/reset-password"
  }
  return next
}

/**
 * Server-side PKCE exchange: reads the code_verifier from the incoming request
 * cookies (set in the browser when resetPasswordForEmail / OAuth started) and
 * swaps ?code= for a session. Attach refreshed auth cookies to the redirect
 * response. Fixes "PKCE code verifier not found in storage" when exchanging
 * only on the client after an email redirect.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const code = url.searchParams.get("code")
  const nextPath = safeNextPath(url.searchParams.get("next"))

  if (!code) {
    return NextResponse.redirect(new URL("/auth/forgot-password?error=missing_code", url.origin))
  }

  const redirectTarget = new URL(nextPath, url.origin)
  let response = NextResponse.redirect(redirectTarget)

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    },
  )

  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.redirect(
      new URL(`/auth/forgot-password?error=${encodeURIComponent(error.message)}`, url.origin),
    )
  }

  return response
}

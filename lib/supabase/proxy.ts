import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  // Check if Supabase is configured
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // If Supabase is not configured, skip authentication logic
  if (!supabaseUrl || !supabaseAnonKey) {
    console.log("[v0] Supabase not configured, skipping authentication")
    return supabaseResponse
  }

  // With Fluid compute, don't put this client in a global environment
  // variable. Always create a new one on each request.
  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    },
  )

  // Do not run code between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: If you remove getUser() and you use server-side rendering
  // with the Supabase client, your users may be randomly logged out.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Redirect unauthenticated users from protected routes
  if (request.nextUrl.pathname.startsWith("/dashboard") && !user) {
    const url = request.nextUrl.clone()
    url.pathname = "/auth/login"
    return NextResponse.redirect(url)
  }

  if (request.nextUrl.pathname.startsWith("/dashboard") && user) {
    const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

    // Check if email is verified
    if (!user.email_confirmed_at) {
      const url = request.nextUrl.clone()
      url.pathname = "/auth/verify-email"
      url.searchParams.set("type", "pending")
      url.searchParams.set("error", "email-not-verified")
      return NextResponse.redirect(url)
    }

    // Check if account is active (admin has approved)
    if (profile && !profile.is_active) {
      const url = request.nextUrl.clone()
      url.pathname = "/auth/verify-email"
      url.searchParams.set("type", "pending")
      url.searchParams.set("error", "pending-approval")
      return NextResponse.redirect(url)
    }
  }

  // Redirect authenticated users away from auth pages
  if (
    (request.nextUrl.pathname.startsWith("/auth/login") || request.nextUrl.pathname.startsWith("/auth/sign-up")) &&
    user
  ) {
    const url = request.nextUrl.clone()
    url.pathname = "/dashboard"
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

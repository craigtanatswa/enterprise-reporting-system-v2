import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { BarChart3, FileText, Factory, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default async function HomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Redirect authenticated users to dashboard
  if (user) {
    redirect("/dashboard")
  }

  return (
    <div className="flex min-h-svh flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative h-10 w-16">
              <Image src="/images/arda-logo.png" alt="ARDA Seeds" fill className="object-contain" />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link href="/auth/login">Sign In</Link>
            </Button>
            <Button asChild>
              <Link href="/auth/sign-up">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container flex flex-col items-center gap-8 py-16 md:py-24">
        <div className="flex max-w-3xl flex-col items-center gap-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border bg-muted px-4 py-1.5 text-sm">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            <span>Enterprise Reporting Platform</span>
          </div>
          <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            Streamline Your Agricultural Operations
          </h1>
          <p className="text-balance text-lg text-muted-foreground sm:text-xl">
            Comprehensive reporting and management system for ARDA Seeds. Track production, manage documents, and
            streamline approvals across all facilities.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Button size="lg" asChild>
              <Link href="/auth/sign-up">Request Access</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/auth/login">Sign In</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container py-16 md:py-24">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <BarChart3 className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-semibold">Executive Dashboard</h3>
            <p className="text-muted-foreground">
              Real-time KPIs and analytics for informed decision-making across all departments.
            </p>
          </div>
          <div className="flex flex-col gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
              <FileText className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-semibold">Document Repository</h3>
            <p className="text-muted-foreground">
              Centralized document management with version control and secure access.
            </p>
          </div>
          <div className="flex flex-col gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10 text-accent-foreground">
              <Factory className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-semibold">Factory Operations</h3>
            <p className="text-muted-foreground">
              Track production, processing, and dispatch across multiple facilities.
            </p>
          </div>
          <div className="flex flex-col gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-semibold">Approval Workflows</h3>
            <p className="text-muted-foreground">Multi-level approval system with notifications and audit trails.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t bg-muted/40 py-8">
        <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-2">
            <div className="relative h-8 w-14">
              <Image src="/images/arda-logo.png" alt="ARDA Seeds" fill className="object-contain" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">© 2025 ARDA Seeds Pvt Ltd. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

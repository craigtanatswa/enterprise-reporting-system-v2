import type React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import type { LucideIcon } from "lucide-react"

interface StatCardProps {
  title: string
  value: string | number
  description: string
  icon: LucideIcon
}

export function StatCard({ title, value, description, icon: Icon }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}

interface QuickAction {
  label: string
  href: string
  icon: LucideIcon
}

interface DepartmentDashboardLayoutProps {
  title: string
  description: string
  stats: StatCardProps[]
  quickActions: QuickAction[]
  children?: React.ReactNode
}

export function DepartmentDashboardLayout({
  title,
  description,
  stats,
  quickActions,
  children,
}: DepartmentDashboardLayoutProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        <p className="text-muted-foreground">{description}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {quickActions.map((action, index) => {
              const Icon = action.icon
              return (
                <Button key={index} variant="outline" className="w-full justify-start bg-transparent" asChild>
                  <Link href={action.href}>
                    <Icon className="mr-2 h-4 w-4" />
                    {action.label}
                  </Link>
                </Button>
              )
            })}
          </CardContent>
        </Card>

        {children}
      </div>
    </div>
  )
}

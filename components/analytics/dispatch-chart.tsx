"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Legend } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

interface DispatchData {
  month: string
  department: string
  total_dispatches: number
  total_quantity: number
  unique_customers: number
}

export function DispatchChart({ data }: { data: DispatchData[] }) {
  // Transform data for chart
  const chartData = data
    .slice(0, 6)
    .reverse()
    .map((item) => ({
      month: new Date(item.month).toLocaleDateString("en-US", { month: "short", year: "numeric" }),
      dispatches: Number(item.total_dispatches),
      quantity: Number(item.total_quantity) / 1000, // Convert to tons
      customers: Number(item.unique_customers),
    }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dispatch Analysis</CardTitle>
        <CardDescription>Monthly dispatch volumes and customer count (last 6 months)</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{
            dispatches: {
              label: "Dispatches",
              color: "hsl(var(--chart-3))",
            },
            customers: {
              label: "Customers",
              color: "hsl(var(--chart-4))",
            },
          }}
          className="h-[400px]"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="month" className="text-xs" />
              <YAxis className="text-xs" />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend />
              <Bar dataKey="dispatches" fill="hsl(var(--chart-3))" name="Dispatches" radius={[4, 4, 0, 0]} />
              <Bar dataKey="customers" fill="hsl(var(--chart-4))" name="Customers" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

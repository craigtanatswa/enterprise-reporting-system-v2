"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Line, LineChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Legend } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

interface ProductionData {
  report_date: string
  department: string
  total_target: number
  total_actual: number
  achievement_percentage: number
}

export function ProductionChart({ data }: { data: ProductionData[] }) {
  // Transform data for chart
  const chartData = data
    .slice(0, 14)
    .reverse()
    .map((item) => ({
      date: new Date(item.report_date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      target: Number(item.total_target),
      actual: Number(item.total_actual),
      achievement: Number(item.achievement_percentage),
    }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Production Trends</CardTitle>
        <CardDescription>Daily production vs targets (last 14 days)</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{
            target: {
              label: "Target",
              color: "hsl(var(--chart-1))",
            },
            actual: {
              label: "Actual",
              color: "hsl(var(--chart-2))",
            },
          }}
          className="h-[400px]"
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="date" className="text-xs" />
              <YAxis className="text-xs" />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend />
              <Line
                type="monotone"
                dataKey="target"
                stroke="hsl(var(--chart-1))"
                strokeWidth={2}
                name="Target"
                dot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="actual"
                stroke="hsl(var(--chart-2))"
                strokeWidth={2}
                name="Actual"
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

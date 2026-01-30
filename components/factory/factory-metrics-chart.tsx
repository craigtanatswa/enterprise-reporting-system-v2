"use client"

import { Bar, BarChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

interface FactoryMetricsChartProps {
  rawSeed: number
  processed: number
  packaged: number
  dispatched: number
}

export function FactoryMetricsChart({ rawSeed, processed, packaged, dispatched }: FactoryMetricsChartProps) {
  const data = [
    { name: "Raw Seed", value: rawSeed, fill: "#f59e0b" },
    { name: "Processed", value: processed, fill: "#3b82f6" },
    { name: "Packaged", value: packaged, fill: "#22c55e" },
    { name: "Dispatched", value: dispatched, fill: "#a855f7" },
  ]

  const chartConfig = {
    value: {
      label: "Tonnage (MT)",
    },
  }

  if (rawSeed === 0 && processed === 0 && packaged === 0 && dispatched === 0) {
    return (
      <div className="flex items-center justify-center h-[200px] text-muted-foreground">
        No data available. Start logging factory activities.
      </div>
    )
  }

  return (
    <ChartContainer config={chartConfig} className="h-[200px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
          <XAxis type="number" tickFormatter={(value) => `${value} MT`} />
          <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 12 }} />
          <ChartTooltip 
            content={<ChartTooltipContent />}
            formatter={(value) => [`${value} MT`, "Tonnage"]}
          />
          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}

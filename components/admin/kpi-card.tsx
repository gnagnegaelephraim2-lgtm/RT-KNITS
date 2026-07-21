"use client"

import { useEffect, useState } from "react"
import { type LucideIcon } from "lucide-react"
import { Card } from "@/components/ui/card"

interface KPICardProps {
  title: string
  value: number | string
  icon: LucideIcon
  iconColor?: string
  iconBgColor?: string
  trend?: "up" | "down" | "neutral"
  trendValue?: string
}

export function KPICard({
  title,
  value,
  icon: Icon,
  iconColor = "text-primary",
  iconBgColor = "bg-primary/10",
  trend,
  trendValue,
}: KPICardProps) {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    const num = typeof value === "number" ? value : parseInt(String(value), 10)
    if (Number.isNaN(num)) {
      setDisplayValue(0)
      return
    }

    if (num === 0) {
      setDisplayValue(0)
      return
    }

    let start = 0
    const duration = 600
    const startTime = performance.now()

    function animate(now: number) {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      start = Math.round(eased * num)
      setDisplayValue(start)
      if (progress < 1) requestAnimationFrame(animate)
    }

    requestAnimationFrame(animate)
  }, [value])

  return (
    <Card className="rounded-lg border-border bg-card p-4 transition-all hover-lift">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {title}
          </p>
          <p className="mt-2 text-3xl font-bold text-foreground tabular-nums">
            {typeof value === "number" ? displayValue : value}
          </p>
          {trend && trendValue && (
            <p
              className={`mt-1 text-xs font-medium ${
                trend === "up"
                  ? "text-green-600"
                  : trend === "down"
                    ? "text-red-600"
                    : "text-muted-foreground"
              }`}
            >
              {trend === "up" ? "\u2191" : trend === "down" ? "\u2193" : "\u2192"} {trendValue}
            </p>
          )}
        </div>
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-lg ${iconBgColor} ${iconColor} transition-transform group-hover:scale-110`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  )
}

import { ReactNode } from "react"
import { Card } from "@/components/ui/card"

interface DataTableProps {
  columns: { header: string; className?: string }[]
  children: ReactNode
  loading?: boolean
  empty?: boolean
  emptyMessage?: string
}

export function DataTable({ columns, children, loading, empty, emptyMessage }: DataTableProps) {
  if (loading) {
    return (
      <Card className="rounded-lg border-border bg-card p-8">
        <div className="flex items-center justify-center">
          <div className="text-sm text-muted-foreground">Loading...</div>
        </div>
      </Card>
    )
  }

  if (empty) {
    return (
      <Card className="rounded-lg border-border bg-card p-8">
        <div className="flex items-center justify-center">
          <div className="text-sm text-muted-foreground">{emptyMessage || "No data available"}</div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="rounded-lg border-border bg-card overflow-hidden">
      <table className="w-full text-sm">
        <thead className="border-b border-border bg-muted/30">
          <tr>
            {columns.map((col, idx) => (
              <th key={idx} className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground ${col.className || ""}`}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </Card>
  )
}

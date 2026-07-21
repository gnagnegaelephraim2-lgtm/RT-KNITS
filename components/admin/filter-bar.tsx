import { ReactNode } from "react"
import { Search } from "lucide-react"
import { Card } from "@/components/ui/card"

interface FilterBarProps {
  searchPlaceholder?: string
  searchValue?: string
  onSearchChange?: (value: string) => void
  filters?: Array<{
    label: string
    value: string
    onChange: (value: string) => void
    options: Array<{ value: string; label: string }>
  }>
  actions?: ReactNode
}

export function FilterBar({ searchPlaceholder, searchValue, onSearchChange, filters, actions }: FilterBarProps) {
  return (
    <Card className="rounded-lg border-border bg-card p-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        {onSearchChange && (
          <div className="flex flex-1 items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="flex-1 rounded-md border border-border bg-background px-3 py-1.5 text-sm"
            />
          </div>
        )}
        {filters && filters.map((filter, idx) => (
          <select
            key={idx}
            value={filter.value}
            onChange={(e) => filter.onChange(e.target.value)}
            className="rounded-md border border-border bg-background px-3 py-1.5 text-sm"
          >
            {filter.options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        ))}
        {actions && <div className="flex gap-2">{actions}</div>}
      </div>
    </Card>
  )
}

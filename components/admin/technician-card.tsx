import { Technician } from "@/lib/types"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Wrench } from "lucide-react"

interface TechnicianCardProps {
  technician: Technician
  onEdit?: (technician: Technician) => void
  onToggleActive?: (technician: Technician) => void
}

export function TechnicianCard({ technician, onEdit, onToggleActive }: TechnicianCardProps) {
  return (
    <Card className="rounded-lg border-border bg-card p-4">
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{technician.full_name}</p>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Wrench className="h-3 w-3" />
              <span className="capitalize">{technician.trade}</span>
            </div>
          </div>
          {onToggleActive && (
            <button
              onClick={() => onToggleActive(technician)}
              className={`shrink-0 rounded-md px-2 py-1 text-xs font-medium ${
                technician.active
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {technician.active ? "Active" : "Inactive"}
            </button>
          )}
        </div>

        {onEdit && (
          <Button
            size="sm"
            variant="outline"
            className="rounded-md"
            onClick={() => onEdit(technician)}
          >
            Edit
          </Button>
        )}
      </div>
    </Card>
  )
}

import { AppUser } from "@/lib/types"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RoleBadge } from "@/components/shared/badges"
import { KeyRound } from "lucide-react"

interface UserCardProps {
  user: AppUser
  departmentName?: string
  onEdit?: (user: AppUser) => void
  onResetPin?: (user: AppUser) => void
}

export function UserCard({ user, departmentName, onEdit, onResetPin }: UserCardProps) {
  return (
    <Card className="rounded-lg border-border bg-card p-4">
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{user.full_name}</p>
            <p className="mt-1 font-mono text-xs text-muted-foreground">{user.phone_number}</p>
            {user.email && <p className="mt-0.5 truncate text-xs text-muted-foreground">{user.email}</p>}
          </div>
          <RoleBadge role={user.role} />
        </div>

        {departmentName && (
          <div className="text-xs text-muted-foreground">Dept: {departmentName}</div>
        )}

        <div className="flex gap-2">
          {onEdit && (
            <Button size="sm" variant="outline" className="flex-1 rounded-md" onClick={() => onEdit(user)}>
              Edit
            </Button>
          )}
          {onResetPin && (
            <Button size="sm" variant="outline" className="gap-1.5 rounded-md" onClick={() => onResetPin(user)}>
              <KeyRound className="h-3 w-3" />
              Reset PIN
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}

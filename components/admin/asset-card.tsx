import { Asset } from "@/lib/types"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MapPin, Wrench, AlertTriangle } from "lucide-react"

interface AssetCardProps {
  asset: Asset
  overdue?: boolean
  onEdit?: (asset: Asset) => void
}

export function AssetCard({ asset, overdue, onEdit }: AssetCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "in_use":
        return "text-green-600"
      case "down":
        return "text-red-600"
      case "maintenance":
        return "text-orange-600"
      case "retired":
        return "text-gray-500"
      default:
        return "text-muted-foreground"
    }
  }

  return (
    <Card className={`rounded-lg border-border bg-card p-4 ${overdue ? "border-orange-500" : ""}`}>
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="truncate text-sm font-semibold">{asset.name}</span>
              {overdue && <AlertTriangle className="h-3 w-3 shrink-0 text-orange-500" />}
            </div>
            <p className="mt-1 font-mono text-xs text-muted-foreground">{asset.asset_code}</p>
          </div>
          <span className={`text-xs font-medium uppercase ${getStatusColor(asset.status)}`}>
            {asset.status.replace("_", " ")}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          {asset.location && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {asset.location}
            </span>
          )}
          {asset.required_trade && (
            <span className="flex items-center gap-1">
              <Wrench className="h-3 w-3" />
              {asset.required_trade}
            </span>
          )}
        </div>

        {asset.last_preventive_check && (
          <div className="text-xs text-muted-foreground">
            Last preventive: {new Date(asset.last_preventive_check).toLocaleDateString()}
            {asset.preventive_interval_days && ` (every ${asset.preventive_interval_days} days)`}
          </div>
        )}

        {onEdit && (
          <Button size="sm" variant="outline" className="rounded-md" onClick={() => onEdit(asset)}>
            Edit
          </Button>
        )}
      </div>
    </Card>
  )
}

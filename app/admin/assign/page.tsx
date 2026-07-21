"use client"

import { useState } from "react"
import { Send, Search, AlertCircle } from "lucide-react"
import { useLookups } from "@/lib/hooks/use-lookups"
import { NitaApi } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { toast } from "sonner"
import type { TaskType, Trade, Asset, Technician } from "@/lib/types"

const TASK_TYPES: TaskType[] = ["repair", "preventive", "emergency", "inspection"]
const TRADES: Trade[] = ["mechanic", "electrician", "welder", "plumber", "hvac", "general"]

export default function AdminDirectAssign() {
  const { assets, technicians } = useLookups()
  const [assetSearch, setAssetSearch] = useState("")
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)
  const [selectedTechnician, setSelectedTechnician] = useState<Technician | null>(null)
  const [taskType, setTaskType] = useState<TaskType>("repair")
  const [priority, setPriority] = useState<0 | 1 | 2>(2)
  const [instructions, setInstructions] = useState("")
  const [loading, setLoading] = useState(false)

  const filteredAssets = assets.filter(
    (a) =>
      a.name.toLowerCase().includes(assetSearch.toLowerCase()) ||
      a.asset_code.toLowerCase().includes(assetSearch.toLowerCase())
  )

  const activeTechnicians = technicians.filter((t) => t.active)

  const handleSubmit = async () => {
    if (!selectedAsset) {
      toast.error("Please select an asset")
      return
    }
    if (!selectedTechnician) {
      toast.error("Please select a technician")
      return
    }
    if (!instructions.trim()) {
      toast.error("Please provide instructions")
      return
    }

    setLoading(true)
    try {
      const res = await NitaApi.adminAssign({
        asset_id: selectedAsset.asset_id,
        technician_id: selectedTechnician.technician_id,
        task_type: taskType,
        priority,
        description: instructions,
      })

      if (res.ok) {
        toast.success("Task assigned successfully")
        // Reset form
        setSelectedAsset(null)
        setSelectedTechnician(null)
        setInstructions("")
        setAssetSearch("")
      } else {
        // Check for duplicate task
        if ((res.data as any)?.is_duplicate) {
          toast.error(
            `Duplicate task blocked. Existing task ID: ${(res.data as any).existing_task_id}. ${(res.data as any).message || ""}`
          )
        } else {
          toast.error(res.error || "Failed to assign task")
        }
      }
    } catch (err) {
      toast.error("Failed to assign task")
    } finally {
      setLoading(false)
    }
  }

  const getPriorityColor = (p: number) => {
    switch (p) {
      case 0:
        return "bg-red-100 text-red-700 border-red-200"
      case 1:
        return "bg-orange-100 text-orange-700 border-orange-200"
      case 2:
        return "bg-green-100 text-green-700 border-green-200"
    }
  }

  const getPriorityLabel = (p: number) => {
    switch (p) {
      case 0:
        return "Critical"
      case 1:
        return "Urgent"
      case 2:
        return "Non-urgent"
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Direct Assignment</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Assign a task directly to a technician without going through the approval queue
        </p>
      </div>

      <Card className="rounded-lg border-border bg-card p-6">
        <div className="flex flex-col gap-6">
          {/* Asset Selection */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Select Asset</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={assetSearch}
                  onChange={(e) => setAssetSearch(e.target.value)}
                  placeholder="Search by name or code..."
                  className="w-full rounded-md border border-border bg-background pl-9 pr-3 py-2 text-sm"
                />
              </div>
            </div>

            {assetSearch && filteredAssets.length > 0 && !selectedAsset && (
              <div className="max-h-48 overflow-y-auto rounded-md border border-border bg-background">
                {filteredAssets.map((asset) => (
                  <button
                    key={asset.asset_id}
                    onClick={() => {
                      setSelectedAsset(asset)
                      setAssetSearch("")
                    }}
                    className="w-full border-b border-border px-3 py-2 text-left text-sm hover:bg-muted"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{asset.name}</span>
                      <span className="font-mono text-xs text-muted-foreground">{asset.asset_code}</span>
                    </div>
                    {asset.location && <div className="mt-0.5 text-xs text-muted-foreground">{asset.location}</div>}
                  </button>
                ))}
              </div>
            )}

            {selectedAsset && (
              <div className="flex items-center justify-between rounded-md border border-border bg-muted/30 px-3 py-2">
                <div>
                  <span className="text-sm font-medium">{selectedAsset.name}</span>
                  <span className="ml-2 font-mono text-xs text-muted-foreground">{selectedAsset.asset_code}</span>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 rounded-md text-xs"
                  onClick={() => setSelectedAsset(null)}
                >
                  Change
                </Button>
              </div>
            )}
          </div>

          {/* Technician Selection */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Select Technician</label>
            <select
              value={selectedTechnician?.technician_id || ""}
              onChange={(e) => {
                const tech = activeTechnicians.find((t) => t.technician_id === e.target.value)
                setSelectedTechnician(tech || null)
              }}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="">Select a technician...</option>
              {activeTechnicians.map((tech) => (
                <option key={tech.technician_id} value={tech.technician_id}>
                  {tech.full_name} ({tech.trade})
                </option>
              ))}
            </select>
          </div>

          {/* Task Type */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Task Type</label>
            <select
              value={taskType}
              onChange={(e) => setTaskType(e.target.value as TaskType)}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              {TASK_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Priority */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Priority</label>
            <div className="flex gap-2">
              {[0, 1, 2].map((p) => (
                <button
                  key={p}
                  onClick={() => setPriority(p as 0 | 1 | 2)}
                  className={`flex-1 rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                    priority === p
                      ? getPriorityColor(p)
                      : "border-border bg-background hover:bg-muted"
                  }`}
                >
                  {getPriorityLabel(p)}
                </button>
              ))}
            </div>
          </div>

          {/* Instructions */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Instructions</label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Describe the task and any specific instructions..."
              rows={4}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
          </div>

          {/* Submit */}
          <Button
            size="lg"
            className="gap-2 rounded-md"
            disabled={loading}
            onClick={handleSubmit}
          >
            <Send className="h-4 w-4" />
            {loading ? "Assigning..." : "Assign Task"}
          </Button>

          {/* Info Note */}
          <div className="flex items-start gap-2 rounded-md bg-muted/50 p-3">
            <AlertCircle className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
            <p className="text-xs text-muted-foreground">
              Direct assignments bypass the approval queue and immediately create a work order. Use this for urgent
              situations or when you already know the right technician for the job.
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}

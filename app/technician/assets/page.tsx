"use client"

import { useState } from "react"
import { Search, MapPin, Wrench, AlertTriangle } from "lucide-react"
import { NitaApi } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { toast } from "sonner"
import type { Asset } from "@/lib/types"

interface AssetResult {
  asset_id: string
  asset_code: string
  name: string
  status: string
  location: string | null
  required_trade: string | null
  last_preventive_check: string | null
  preventive_interval_days: number | null
  repair_history?: Array<{
    date: string
    description: string
    technician: string
  }>
}

export default function TechnicianAssetLookup() {
  const [query, setQuery] = useState("")
  const [searchType, setSearchType] = useState<"code" | "keyword">("code")
  const [results, setResults] = useState<AssetResult[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSearch = async () => {
    if (!query.trim()) {
      setError("Please enter a search term")
      return
    }

    setLoading(true)
    setError(null)
    setResults(null)

    try {
      let res
      if (searchType === "code") {
        res = await NitaApi.getAsset(query)
      } else {
        res = await NitaApi.findAsset(undefined, query)
      }

      if (res.ok && res.data) {
        const data = Array.isArray(res.data) ? res.data : [res.data]
        setResults(data as AssetResult[])
      } else {
        setError(res.error || "No assets found")
      }
    } catch (err) {
      setError("Search failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch()
  }

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
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Asset Lookup</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Search for assets by code or keyword to view details and repair history.
        </p>
      </div>

      <Card className="rounded-lg border-border bg-card p-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setSearchType("code")}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                searchType === "code"
                  ? "bg-primary text-primary-foreground"
                  : "bg-background text-muted-foreground hover:bg-muted"
              }`}
            >
              By Code
            </button>
            <button
              type="button"
              onClick={() => setSearchType("keyword")}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                searchType === "keyword"
                  ? "bg-primary text-primary-foreground"
                  : "bg-background text-muted-foreground hover:bg-muted"
              }`}
            >
              By Keyword
            </button>
          </div>
          <div className="flex flex-1 gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={searchType === "code" ? "Enter asset code (e.g., MCH-001)" : "Enter keyword or location"}
              className="flex-1 rounded-md border border-border bg-background px-3 py-1.5 text-sm"
            />
            <Button
              size="sm"
              className="gap-2 rounded-md"
              disabled={loading}
              onClick={handleSearch}
            >
              <Search className="h-4 w-4" />
              Search
            </Button>
          </div>
        </div>
      </Card>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="text-sm text-muted-foreground">Searching...</div>
        </div>
      )}

      {results && results.length === 0 && (
        <div className="rounded-md border border-border bg-muted/50 p-8 text-center">
          <p className="text-sm text-muted-foreground">No assets found matching your search.</p>
        </div>
      )}

      {results && results.length > 0 && (
        <div className="flex flex-col gap-3">
          {results.map((asset) => (
            <Card key={asset.asset_id} className="rounded-lg border-border bg-card p-4">
              <div className="flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-semibold">{asset.name}</span>
                      <span className="shrink-0 font-mono text-xs text-muted-foreground">{asset.asset_code}</span>
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {asset.location || "Unknown location"}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium uppercase ${getStatusColor(asset.status)}`}>
                      {asset.status.replace("_", " ")}
                    </span>
                    {asset.required_trade && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Wrench className="h-3 w-3" />
                        {asset.required_trade}
                      </div>
                    )}
                  </div>
                </div>

                {asset.last_preventive_check && (
                  <div className="text-xs text-muted-foreground">
                    Last preventive check: {new Date(asset.last_preventive_check).toLocaleDateString()}
                    {asset.preventive_interval_days && ` (every ${asset.preventive_interval_days} days)`}
                  </div>
                )}

                {asset.repair_history && asset.repair_history.length > 0 && (
                  <div className="mt-2 border-t border-border pt-3">
                    <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Recent Repairs
                    </div>
                    <div className="flex flex-col gap-2">
                      {asset.repair_history.slice(0, 3).map((repair, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-xs">
                          <span className="shrink-0 text-muted-foreground">
                            {new Date(repair.date).toLocaleDateString()}
                          </span>
                          <span className="text-muted-foreground">{repair.description}</span>
                          <span className="shrink-0 text-muted-foreground">— {repair.technician}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

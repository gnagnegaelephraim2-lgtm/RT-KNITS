import { ReactNode } from "react"
import { Card } from "@/components/ui/card"

interface KanbanColumn {
  id: string
  title: string
  tasks: any[]
  color: string
}

interface KanbanBoardProps {
  columns: KanbanColumn[]
  renderTask: (task: any) => ReactNode
}

export function KanbanBoard({ columns, renderTask }: KanbanBoardProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-4">
      {columns.map((column) => (
        <div key={column.id} className="flex flex-col gap-3">
          <div className="flex items-center justify-between border-b-2 pb-2">
            <div className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${column.color.replace("border-", "bg-")}`} />
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {column.title}
              </h3>
            </div>
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-muted px-1.5 text-[10px] font-bold text-muted-foreground">
              {column.tasks.length}
            </span>
          </div>

          <div className="flex flex-col gap-2">
            {column.tasks.map((task, i) => (
              <Card
                key={task.id || task.task_request_id}
                className="rounded-lg border-border bg-card p-3 transition-all hover-lift animate-slide-up"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                {renderTask(task)}
              </Card>
            ))}

            {column.tasks.length === 0 && (
              <div className="rounded-lg border border-dashed border-border bg-muted/20 py-8 text-center">
                <p className="text-xs text-muted-foreground">No tasks</p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

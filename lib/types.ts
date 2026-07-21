export type Role = "operator" | "technician" | "admin"

export type Trade = "mechanic" | "electrician" | "welder" | "plumber" | "hvac" | "general"

export type AssetStatus = "in_use" | "down" | "maintenance" | "retired"

export type TaskRequestStatus = "pending_approval" | "approved" | "rejected"

export type Priority = 0 | 1 | 2

export type TaskType = "repair" | "preventive" | "emergency" | "inspection"

export type WorkOrderStatus = "pending" | "in_progress" | "paused" | "completed" | "cancelled"

export type WorkOrderTechStatus =
  | "assigned"
  | "acknowledged"
  | "accepted"
  | "in_progress"
  | "paused"
  | "completed"
  | "declined"

export interface AppUser {
  user_id: string
  department_id: string | null
  full_name: string
  email: string | null
  role: Role
  phone_number: string
  preferred_language: string | null
  whatsapp_verified: boolean | null
  created_at: string | null
}

export interface SessionUser {
  user_id: string
  role: Role
  full_name: string
  phone_number: string
  department_id: string | null
  preferred_language: string | null
}

export interface Department {
  department_id: string
  name: string
  created_at: string | null
}

export interface Technician {
  technician_id: string
  user_id: string | null
  full_name: string
  trade: Trade
  active: boolean
}

export interface Asset {
  asset_id: string
  asset_code: string
  name: string
  status: AssetStatus
  location: string | null
  required_trade: Trade | null
  last_preventive_check: string | null
  preventive_interval_days: number | null
  created_at: string | null
}

export interface MediaEntry {
  type: string
  media_id: string
  caption?: string
}

export interface TaskRequest {
  task_request_id: string
  asset_id: string | null
  created_by_user_id: string | null
  status: TaskRequestStatus
  priority: Priority
  requested_at: string | null
  description: string | null
  task_type: TaskType | null
  required_trade: Trade | null
  created_by_role: Role | null
  approved_by_user_id: string | null
  approved_at: string | null
  rejection_reason: string | null
  media_urls: MediaEntry[] | null
}

export interface WorkOrder {
  work_order_id: string
  task_request_id: string | null
  status: WorkOrderStatus
  priority: Priority
  scheduled_start: string | null
  created_at: string | null
  completed_at: string | null
  recommended_technician_id: string | null
  recommendation_reason: string | null
}

export interface WorkOrderTechnician {
  work_order_id: string
  technician_id: string
  start_time: string | null
  stop_time: string | null
  assigned_at: string | null
  status: WorkOrderTechStatus
}

export interface WorkOrderFeedback {
  feedback_id: string
  work_order_id: string | null
  rated_by_user_id: string | null
  feedback_type: "text" | "voice"
  feedback_text: string | null
  voice_duration_seconds: number | null
  derived_sentiment: string | null
  derived_rating: number | null
  key_issues: string | null
  flagged_for_review: boolean | null
  reviewed_by_user_id: string | null
  reviewed_at: string | null
  created_at: string | null
}

export interface MessageLog {
  log_id: string
  user_id: string | null
  user_name: string | null
  phone_number: string
  direction: "inbound" | "outbound"
  message_type: string | null
  content: string | null
  media_url: string | null
  media_duration_seconds: number | null
  media_size_bytes: number | null
  transcription: string | null
  metadata: Record<string, unknown> | null
  created_at: string
}

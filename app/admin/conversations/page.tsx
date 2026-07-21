"use client"

import { useState, useEffect, useRef } from "react"
import { MessagesSquare, Search, RefreshCw, X, Image as ImageIcon, Video, Mic, Download } from "lucide-react"
import { useSupabaseQuery } from "@/lib/hooks/use-supabase-query"
import { useLookups } from "@/lib/hooks/use-lookups"
import { ListSkeleton, EmptyState, ErrorState, NotConfiguredState } from "@/components/shared/states"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { NitaApi } from "@/lib/api"
import { useAuth } from "@/components/auth/auth-provider"
import { toast } from "sonner"
import type { MessageLog, AppUser } from "@/lib/types"

interface ConversationContact {
  phone_number: string
  name: string
  role?: string
  message_count: number
  last_message: string
  last_message_time: string
  last_message_direction: "inbound" | "outbound"
}

function formatTime(dt: string) {
  const date = new Date(dt)
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}

function formatDate(dt: string) {
  const date = new Date(dt)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (date.toDateString() === today.toDateString()) {
    return "Today"
  } else if (date.toDateString() === yesterday.toDateString()) {
    return "Yesterday"
  } else {
    return date.toLocaleDateString()
  }
}

function timeAgo(dt: string) {
  const d = new Date(dt).getTime()
  if (Number.isNaN(d)) return ""
  const diff = Date.now() - d
  const mins = Math.round(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.round(hrs / 24)}d ago`
}

export default function AdminConversations() {
  const { userMap } = useLookups()
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [contacts, setContacts] = useState<ConversationContact[]>([])
  const [selectedContact, setSelectedContact] = useState<ConversationContact | null>(null)
  const [messages, setMessages] = useState<MessageLog[]>([])
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [loadingContacts, setLoadingContacts] = useState(true)
  const [messagesEndRef, setMessagesEndRef] = useState<HTMLDivElement | null>(null)

  const { data: allMessages, isLoading, error, notConfigured, mutate } = useSupabaseQuery<MessageLog[]>(
    "admin:conversations",
    (sb) =>
      sb
        .from("message_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000),
    { refreshInterval: 60000 },
  )

  useEffect(() => {
    if (allMessages) {
      // Group by phone number to create contact list
      const contactMap = new Map<string, ConversationContact>()

      allMessages.forEach((msg) => {
        const existing = contactMap.get(msg.phone_number)
        const userInfo = msg.user_id ? userMap.get(msg.user_id) : null

        if (existing) {
          existing.message_count++
          existing.last_message = msg.content || "[Media]"
          existing.last_message_time = msg.created_at
          existing.last_message_direction = msg.direction
        } else {
          contactMap.set(msg.phone_number, {
            phone_number: msg.phone_number,
            name: userInfo?.full_name || "Unknown",
            role: userInfo?.role,
            message_count: 1,
            last_message: msg.content || "[Media]",
            last_message_time: msg.created_at,
            last_message_direction: msg.direction,
          })
        }
      })

      const contactsArray = Array.from(contactMap.values()).sort(
        (a, b) => new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime()
      )

      setContacts(contactsArray)
      setLoadingContacts(false)
    }
  }, [allMessages, userMap])

  useEffect(() => {
    if (messagesEndRef) {
      messagesEndRef.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, messagesEndRef])

  const handleRefresh = () => {
    mutate()
  }

  const handleContactClick = async (contact: ConversationContact) => {
    setSelectedContact(contact)
    setLoadingMessages(true)

    // Load messages for this contact
    if (allMessages) {
      const contactMessages = allMessages
        .filter((m) => m.phone_number === contact.phone_number)
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      setMessages(contactMessages)
    }

    setLoadingMessages(false)
  }

  const handleForwardMedia = async (message: MessageLog) => {
    if (!user) {
      toast.error("You must be logged in to forward media")
      return
    }

    try {
      const res = await NitaApi.forwardMedia({
        task_id: message.metadata?.task_id as string || message.log_id,
        recipient_phone: user.phone_number,
      })

      if (res.ok) {
        toast.success("Media forwarded to your WhatsApp")
      } else {
        toast.error(res.error || "Failed to forward media")
      }
    } catch (err) {
      toast.error("Failed to forward media")
    }
  }

  const filteredContacts = contacts.filter((c) => {
    const query = searchQuery.toLowerCase()
    return (
      c.phone_number.includes(query) ||
      c.name.toLowerCase().includes(query)
    )
  })

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Conversations Log</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Audit trail of all WhatsApp exchanges with Nita
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="gap-2 rounded-md"
          onClick={handleRefresh}
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Search */}
      <Card className="rounded-lg border-border bg-card p-4">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by phone number or name..."
            className="flex-1 rounded-md border border-border bg-background px-3 py-1.5 text-sm"
          />
        </div>
      </Card>

      {/* Contacts List */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <MessagesSquare className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {filteredContacts.length} contact{filteredContacts.length !== 1 ? "s" : ""}
          </h2>
        </div>

        {notConfigured ? (
          <NotConfiguredState />
        ) : isLoading || loadingContacts ? (
          <ListSkeleton />
        ) : error ? (
          <ErrorState message={error.message} onRetry={() => mutate()} />
        ) : filteredContacts.length === 0 ? (
          <EmptyState
            title="No conversations found"
            description={contacts.length === 0 ? "No conversations have been recorded yet." : "Try adjusting your search."}
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredContacts.map((contact) => (
              <Card
                key={contact.phone_number}
                className="cursor-pointer rounded-lg border-border bg-card p-4 transition-colors hover:border-primary"
                onClick={() => handleContactClick(contact)}
              >
                <div className="flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{contact.name}</p>
                      <p className="font-mono text-xs text-muted-foreground">{contact.phone_number}</p>
                    </div>
                    {contact.role && (
                      <span className="shrink-0 rounded-md bg-muted px-2 py-0.5 text-xs font-medium capitalize">
                        {contact.role}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{contact.message_count} message{contact.message_count !== 1 ? "s" : ""}</span>
                    <span>{timeAgo(contact.last_message_time)}</span>
                  </div>

                  <div className="truncate text-xs text-muted-foreground">
                    <span className="font-medium">
                      {contact.last_message_direction === "inbound" ? "→" : "←"}
                    </span>
                    {" "}{contact.last_message}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Conversation Viewer Dialog */}
      <Dialog open={!!selectedContact} onOpenChange={(open) => !open && setSelectedContact(null)}>
        <DialogContent className="max-w-2xl h-[80vh] rounded-lg p-0 flex flex-col">
          {selectedContact && (
            <>
              {/* Header */}
              <div className="flex items-center justify-between border-b border-border bg-muted/30 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold">{selectedContact.name}</p>
                  <p className="text-xs text-muted-foreground font-mono">{selectedContact.phone_number}</p>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="rounded-md"
                  onClick={() => setSelectedContact(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto bg-[#efeae2] p-4">
                {loadingMessages ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-sm text-muted-foreground">Loading messages...</div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-sm text-muted-foreground">No messages found</div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {messages.map((msg, idx) => {
                      const isInbound = msg.direction === "inbound"
                      return (
                        <div
                          key={msg.log_id}
                          className={`flex ${isInbound ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-lg px-3 py-2 shadow-sm ${
                              isInbound
                                ? "bg-[#dcf8c6] text-foreground"
                                : "bg-white text-foreground"
                            }`}
                          >
                            {msg.message_type === "image" && (
                              <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
                                <ImageIcon className="h-3 w-3" />
                                <span>Image attached</span>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-5 gap-1 rounded-md px-2 text-xs"
                                  onClick={() => handleForwardMedia(msg)}
                                >
                                  <Download className="h-3 w-3" />
                                  Forward to me
                                </Button>
                              </div>
                            )}
                            {msg.message_type === "video" && (
                              <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
                                <Video className="h-3 w-3" />
                                <span>Video attached</span>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-5 gap-1 rounded-md px-2 text-xs"
                                  onClick={() => handleForwardMedia(msg)}
                                >
                                  <Download className="h-3 w-3" />
                                  Forward to me
                                </Button>
                              </div>
                            )}
                            {msg.message_type === "audio" && (
                              <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
                                <Mic className="h-3 w-3" />
                                <span>Voice note ({msg.media_duration_seconds}s)</span>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-5 gap-1 rounded-md px-2 text-xs"
                                  onClick={() => handleForwardMedia(msg)}
                                >
                                  <Download className="h-3 w-3" />
                                  Forward to me
                                </Button>
                              </div>
                            )}

                            {msg.content && (
                              <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                            )}

                            {msg.transcription && (
                              <p className="mt-2 text-xs italic text-muted-foreground">
                                "{msg.transcription}"
                              </p>
                            )}

                            <div className={`mt-1 text-[10px] text-muted-foreground ${isInbound ? "text-right" : "text-left"}`}>
                              {formatTime(msg.created_at)}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                    <div ref={(el) => setMessagesEndRef(el)} />
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

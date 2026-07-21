import Link from "next/link"
import { MessageCircle, ClipboardList, Wrench, ShieldCheck, Factory, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { LoginCard } from "@/components/landing/login-card"
import { NITA_WHATSAPP } from "@/lib/constants"

const HOW_IT_WORKS = [
  {
    role: "Operator",
    icon: ClipboardList,
    step: 1,
    body: "Report a fault by chatting with Nita in plain language. Describe the machine and the problem — Nita identifies the asset, sets a priority, and files the request for approval.",
  },
  {
    role: "Technician",
    icon: Wrench,
    step: 2,
    body: "Get dispatched the moment a job is approved. Nita sends you the asset, priority, and details on WhatsApp. Acknowledge, start, and complete jobs with a single reply — never idle.",
  },
  {
    role: "Admin",
    icon: ShieldCheck,
    step: 3,
    body: "Approve or reject incoming requests and let Nita recommend the best technician for the trade. Monitor every job, asset, and conversation from one live dashboard.",
  },
]

export default function LandingPage() {
  return (
    <main className="min-h-dvh bg-background">
      {/* Hero */}
      <section className="gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="relative mx-auto max-w-5xl px-4 py-16 md:py-24">
          <div className="animate-slide-up">
            <div className="flex items-center gap-2 text-sm font-medium text-white/60">
              <Factory className="h-4 w-4" />
              RT Knits &middot; Mauritius &middot; 24/7 Textile Maintenance
            </div>
            <h1 className="mt-6 text-5xl font-bold tracking-tight text-white md:text-7xl">
              Nita
            </h1>
            <p className="mt-2 text-lg font-semibold text-white/80">
              RT Knits Intelligent Technical Assistant
            </p>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/60 text-pretty">
              Nita is an AI-powered WhatsApp maintenance dispatch system. Operators
              report faults conversationally, admins approve the work, and
              technicians get dispatched automatically — all through natural
              conversation. This dashboard is the visual companion to the bot,
              showing the exact same live data your team acts on in WhatsApp.
            </p>
          </div>

          {/* WhatsApp CTA */}
          <div className="animate-slide-up mt-10 flex max-w-md flex-col gap-3 rounded-lg border border-white/10 bg-white/5 p-4 backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-white/50">
                Nita on WhatsApp
              </p>
              <p className="mt-1 font-mono text-lg font-semibold text-white">
                +{NITA_WHATSAPP.replace(/(\d{3})(\d+)/, "$1 $2")}
              </p>
            </div>
            <Button
              className="gap-2 rounded-lg bg-[#16A34A] text-white hover:bg-[#15803d] shadow-lg shadow-green-900/20"
              render={<a href={`https://wa.me/${NITA_WHATSAPP}`} target="_blank" rel="noopener noreferrer" />}
              nativeButton={false}
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
              </span>
              Chat with Nita
            </Button>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-5xl px-4 py-16">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          How it works
        </h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {HOW_IT_WORKS.map(({ role, icon: Icon, step, body }) => (
            <div
              key={role}
              className="group relative flex flex-col gap-3 border border-border bg-card p-6 transition-all hover-lift"
            >
              <div className="absolute -top-3 -left-3 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground shadow-md">
                {step}
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-accent text-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold text-foreground">{role}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground text-pretty">
                {body}
              </p>
              <div className="mt-auto pt-2">
                <span className="inline-flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                  Learn more <ChevronRight className="h-3 w-3" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Login */}
      <section className="border-t border-border bg-card">
        <div className="mx-auto flex max-w-5xl flex-col items-center px-4 py-14">
          <h2 className="mb-2 text-center text-lg font-semibold text-foreground">
            Access your portal
          </h2>
          <p className="mb-6 max-w-md text-center text-sm text-muted-foreground text-pretty">
            Operators, technicians, and admins all log in here. You&apos;ll be
            routed to the right portal automatically.
          </p>
          <LoginCard />
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto max-w-5xl px-4 py-6 text-xs text-muted-foreground">
          Nita &middot; RT Knits Intelligent Technical Assistant &middot;{" "}
          <Link
            href={`https://wa.me/${NITA_WHATSAPP}`}
            className="underline underline-offset-2 hover:text-foreground transition-colors"
          >
            WhatsApp
          </Link>
        </div>
      </footer>
    </main>
  )
}

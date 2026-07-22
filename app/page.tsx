"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Factory, MessageCircle, ArrowRight, ShieldCheck, Zap, Cpu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { LoginCard } from "@/components/landing/login-card"
import { NITA_WHATSAPP } from "@/lib/constants"
import { useT } from "@/lib/i18n/i18n-provider"

const SLIDES = [
  {
    image: "/factory-campus.png",
    titleKey: "landing.slides.0.title",
    descriptionKey: "landing.slides.0.description",
    metricKey: "landing.slides.0.metric",
    icon: Zap,
  },
  {
    image: "/factory-4.png",
    titleKey: "landing.slides.1.title",
    descriptionKey: "landing.slides.1.description",
    metricKey: "landing.slides.1.metric",
    icon: MessageCircle,
  },
  {
    image: "/factory-3.jpg",
    titleKey: "landing.slides.2.title",
    descriptionKey: "landing.slides.2.description",
    metricKey: "landing.slides.2.metric",
    icon: ShieldCheck,
  },
  {
    image: "/factory-1.jpg",
    titleKey: "landing.slides.3.title",
    descriptionKey: "landing.slides.3.description",
    metricKey: "landing.slides.3.metric",
    icon: Cpu,
  },
]

export default function LandingPage() {
  const t = useT()
  const [activeSlide, setActiveSlide] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % SLIDES.length)
    }, 6000)
    return () => clearInterval(timer)
  }, [])

  return (
    <main className="min-h-dvh flex flex-col lg:flex-row bg-background">
      
      {/* Left Pane - Branding & Login Card (40% width on desktop) */}
      <section className="w-full lg:w-[42%] flex flex-col justify-between p-6 sm:p-8 lg:p-12 xl:p-16 border-r border-border/10 z-10 bg-gradient-to-b from-background to-background/95">
        
        {/* Top Header Branding */}
        <div className="flex items-center gap-2.5 transition-all duration-300">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
            <Factory className="h-5.5 w-5.5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-bold tracking-tight text-foreground">Nita</span>
              <span className="text-[10px] font-semibold uppercase tracking-wider bg-primary/10 text-primary px-1.5 py-0.5 rounded-md">
                v2.0
              </span>
            </div>
            <p className="text-xs text-muted-foreground font-medium">RT Knits Intelligent Assistant</p>
          </div>
        </div>

        {/* Center Login Interface */}
        <div className="my-10 lg:my-auto flex flex-col items-center justify-center w-full max-w-md mx-auto">
          <div className="mb-6 text-center lg:text-left lg:w-full">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              {t("landing.technicalPortal")}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("landing.portalDescription")}
            </p>
          </div>
          
          <LoginCard />

          {/* WhatsApp Secondary CTA */}
          <div className="mt-8 w-full border border-border/30 bg-muted/30 p-4.5 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition-all hover:bg-muted/40">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {t("landing.nitaWhatsapp")}
              </p>
              <p className="mt-1 font-mono text-sm font-semibold text-foreground">
                +{NITA_WHATSAPP.replace(/(\d{3})(\d+)/, "$1 $2")}
              </p>
            </div>
            <Button
              className="h-9 gap-1.5 rounded-xl bg-[#16A34A] text-white hover:bg-[#15803d] shadow-md shadow-green-950/10 font-medium text-xs sm:self-center"
              render={<a href={`https://wa.me/${NITA_WHATSAPP}`} target="_blank" rel="noopener noreferrer" />}
              nativeButton={false}
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
              </span>
              {t("landing.chatWithNita")}
            </Button>
          </div>
        </div>

        {/* Footer info inside the left column */}
        <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border/40 pt-6">
          <span>&copy; {new Date().getFullYear()} RT Knits Ltd.</span>
          <Link
            href={`https://wa.me/${NITA_WHATSAPP}`}
            className="flex items-center gap-1 underline underline-offset-2 hover:text-foreground transition-colors"
            target="_blank"
          >
            {t("landing.whatsappDispatch")} <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </section>

      {/* Right Pane - Automated Visual Slideshow (60% width on desktop) */}
      <section className="hidden lg:flex w-full lg:w-[58%] relative overflow-hidden bg-slate-950">
        
        {/* Dynamic Image Slideshow with Ken Burns Effect */}
        {SLIDES.map((slide, idx) => {
          const isActive = idx === activeSlide
          return (
            <div
              key={slide.image}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                isActive ? "opacity-100 z-0" : "opacity-0 -z-10"
              }`}
            >
              {/* Ken Burns zoomed image background */}
              <div
                className={`absolute inset-0 bg-cover bg-center transition-transform duration-[6000ms] ease-out ${
                  isActive ? "scale-105" : "scale-100"
                }`}
                style={{ backgroundImage: `url('${slide.image}')` }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-slate-950/20" />
            </div>
          )
        })}

        {/* Floating Stat Widget (Top-Right) */}
        <div className="absolute top-8 right-8 z-20 flex flex-col gap-3">
          {SLIDES.map((slide, idx) => {
            const Icon = slide.icon
            const isActive = idx === activeSlide
            return (
              <div
                key={`metric-${idx}`}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border border-white/10 backdrop-blur-md transition-all duration-500 transform ${
                  isActive
                    ? "bg-white/10 text-white translate-x-0 shadow-lg"
                    : "bg-black/20 text-white/40 translate-x-4 opacity-50 pointer-events-none"
                }`}
              >
                <div className="p-1 rounded-lg bg-primary/20 text-primary-foreground">
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider">{t(slide.metricKey)}</span>
              </div>
            )
          })}
        </div>

        {/* Slide Info Content Overlay (Bottom-Left) */}
        <div className="absolute bottom-16 left-16 right-16 z-20 max-w-xl text-white">
          <div className="overflow-hidden">
            {SLIDES.map((slide, idx) => {
              const isActive = idx === activeSlide
              return (
                <div
                  key={`text-${idx}`}
                  className={`transition-all duration-700 ${
                    isActive ? "block opacity-100 translate-y-0" : "hidden opacity-0 translate-y-4"
                  }`}
                >
                  <span className="inline-block text-[10px] font-bold uppercase tracking-widest text-primary bg-primary/20 px-2.5 py-1 rounded-md mb-3.5">
                    {t("landing.campusTag")}
                  </span>
                  <h3 className="text-3xl font-extrabold tracking-tight text-white mb-2.5">
                    {t(slide.titleKey)}
                  </h3>
                  <p className="text-sm leading-relaxed text-white/70 font-medium">
                    {t(slide.descriptionKey)}
                  </p>
                </div>
              )
            })}
          </div>

          {/* Slider indicator bar */}
          <div className="mt-8 flex items-center gap-2">
            {SLIDES.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveSlide(idx)}
                className={`h-1 rounded-full transition-all duration-300 ${
                  idx === activeSlide ? "w-8 bg-primary" : "w-2 bg-white/30 hover:bg-white/50"
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Decorative Grid Overlay for texture */}
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03] pointer-events-none z-10" />
      </section>

    </main>
  )
}


"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import {
  TrendingUp,
  UserCheck,
  Landmark,
  Award,
  Handshake,
  PiggyBank,
  HeartHandshake,
  Users,
  ShieldCheck,
  Mail,
  Settings as SettingsIcon,
  HelpCircle,
  Briefcase,
  CircleDollarSign,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Shield,
  CheckCircle2,
  Star,
  Sparkles,
  Lock,
  Phone,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Logo } from "@/components/logo";
import Image from "next/image";

const IconMap: Record<string, React.ComponentType<any>> = {
  TrendingUp, UserCheck, Landmark, Award, Handshake, PiggyBank,
  HeartHandshake, Users, ShieldCheck, Mail, SettingsIcon, HelpCircle,
  Briefcase, CircleDollarSign,
};

interface IBanner {
  _id: string; title: string; subtitle?: string; description: string;
  imageUrl?: string; bgGradient?: string; ctaText?: string; ctaLink?: string;
  isActive: boolean; order: number;
}

interface IBenefit {
  _id: string; title: string; description: string; icon: string;
  isActive: boolean; order: number;
}

const STATS = [
  { value: "Since 1994", label: "Years of Trust", icon: ShieldCheck },
  { value: "100+", label: "Active Members", icon: Users },
  { value: "₹1Cr+", label: "Reserve Capital", icon: CircleDollarSign },
  { value: "99%", label: "Satisfaction Rate", icon: Star },
];

const OFFERINGS = [
  {
    title: "Secure & Fair Loans",
    description: "Quick personal loan disbursements up to ₹6,00,000 at competitive and transparent interest rates.",
    icon: Handshake,
    gradient: "from-blue-500/20 to-indigo-600/10",
    iconColor: "text-blue-500 dark:text-blue-400",
    iconBg: "bg-blue-500/10 dark:bg-blue-400/10 border-blue-500/20",
  },
  {
    title: "Savings & Wealth Growth",
    description: "Grow your reserve capital safely using our Share, Guaranteed, and monthly Thrift funds.",
    icon: PiggyBank,
    gradient: "from-emerald-500/20 to-teal-600/10",
    iconColor: "text-emerald-500 dark:text-emerald-400",
    iconBg: "bg-emerald-500/10 dark:bg-emerald-400/10 border-emerald-500/20",
  },
  {
    title: "Mutual Financial Trust",
    description: "A cooperative structure built entirely on transparency and mutual growth, supporting teachers in need.",
    icon: HeartHandshake,
    gradient: "from-rose-500/20 to-pink-600/10",
    iconColor: "text-rose-500 dark:text-rose-400",
    iconBg: "bg-rose-500/10 dark:bg-rose-400/10 border-rose-500/20",
  },
];

export function HomeLandingPage({
  banners,
  benefits,
}: {
  banners: any[];
  benefits: any[];
}) {
  const [api, setApi] = React.useState<CarouselApi>();
  const [current, setCurrent] = React.useState(0);
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  React.useEffect(() => {
    if (!api) return;
    setCurrent(api.selectedScrollSnap());
    api.on("select", () => setCurrent(api.selectedScrollSnap()));
  }, [api]);

  React.useEffect(() => {
    if (!api) return;
    const interval = setInterval(() => {
      if (api.canScrollNext()) api.scrollNext();
      else api.scrollTo(0);
    }, 6000);
    return () => clearInterval(interval);
  }, [api]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/30">

      {/* ════════════════════════════════════════
          NAVBAR
      ════════════════════════════════════════ */}
      <header className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? "glass border-b border-white/30 dark:border-white/[0.07] shadow-sm"
          : "bg-transparent"
      }`}>
        <div className="container mx-auto px-4 md:px-8 h-[68px] flex items-center justify-between">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-0">
            <Logo showText size="md" />
          </Link>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="hidden sm:inline-flex text-muted-foreground hover:text-foreground rounded-xl"
            >
              <Link href="#contact">Contact</Link>
            </Button>
            <Button
              asChild
              size="sm"
              className="rounded-xl font-semibold shadow-lg shadow-[hsl(var(--primary)_/_0.3)] hover:shadow-[hsl(var(--primary)_/_0.5)] hover:scale-[1.02] active:scale-[0.98] transition-all"
              style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--gold)))", color: "white" }}
            >
              <Link href="/login">
                Sign In <ArrowRight className="ml-1.5 size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* ════════════════════════════════════════
          HERO BANNER SLIDER
      ════════════════════════════════════════ */}
      <section className="container mx-auto px-4 md:px-8 pt-8 pb-12 relative">
        {/* Background decorations */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-1/4 size-[500px] bg-[hsl(var(--primary))] rounded-full blur-[100px] opacity-10 dark:opacity-[0.07]" />
          <div className="absolute bottom-0 right-1/4 size-[400px] bg-[hsl(var(--gold))] rounded-full blur-[100px] opacity-10 dark:opacity-[0.06]" />
        </div>

        <div className="relative">
          <Carousel setApi={setApi} className="w-full overflow-hidden rounded-3xl border border-white/30 dark:border-white/[0.08] shadow-2xl shadow-[hsl(var(--primary)_/_0.1)]">
            <CarouselContent className="-ml-0">
              {banners.map((banner) => (
                <CarouselItem key={banner._id} className="pl-0">
                  <div
                    className={`relative min-h-[440px] md:min-h-[520px] w-full flex items-center overflow-hidden p-8 md:p-16`}
                    style={{
                      background: banner.bgGradient
                        ? `linear-gradient(135deg, ${banner.bgGradient})`
                        : "linear-gradient(135deg, hsl(220,75%,27%,0.2) 0%, hsl(199,80%,60%,0.1) 100%)",
                    }}
                  >
                    {/* Frosted overlay */}
                    <div className="absolute inset-0 glass-card opacity-70" />
                    {/* Orbs */}
                    <div className="absolute right-0 top-0 size-80 bg-[hsl(var(--primary)_/_0.12)] rounded-full blur-3xl" />
                    <div className="absolute left-1/3 bottom-0 size-64 bg-[hsl(var(--gold)_/_0.08)] rounded-full blur-3xl" />

                    <div className="relative z-10 max-w-2xl space-y-6">
                      {banner.subtitle && (
                        <Badge
                          variant="outline"
                          className="bg-[hsl(var(--primary)_/_0.1)] text-[hsl(var(--primary))] border-[hsl(var(--primary)_/_0.3)] backdrop-blur-sm font-semibold tracking-wider uppercase px-4 py-1.5 text-xs rounded-full"
                        >
                          <Sparkles className="size-3 mr-1.5 inline" />
                          {banner.subtitle}
                        </Badge>
                      )}
                      <h1
                        className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight"
                        style={{ fontFamily: "Sora, sans-serif" }}
                      >
                        <span className="gradient-text">{banner.title}</span>
                      </h1>
                      <p className="text-base sm:text-lg text-muted-foreground max-w-xl leading-relaxed">
                        {banner.description}
                      </p>
                      {banner.ctaText && (
                        <div className="pt-2 flex flex-wrap gap-3">
                          <Button
                            asChild
                            size="lg"
                            className="rounded-xl font-semibold shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
                            style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--gold)))", color: "white" }}
                          >
                            <Link href={banner.ctaLink || "/login"}>
                              {banner.ctaText} <ArrowRight className="ml-2 size-5" />
                            </Link>
                          </Button>
                          <Button asChild size="lg" variant="outline" className="rounded-xl backdrop-blur-sm border-[hsl(var(--border)_/_0.6)]">
                            <Link href="/login">Learn More</Link>
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>

          {/* Dots */}
          {banners.length > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20 glass px-3.5 py-2 rounded-full">
              {banners.map((_, index) => (
                <button
                  key={index}
                  onClick={() => api?.scrollTo(index)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index === current
                      ? "bg-[hsl(var(--gold))] w-6 shadow-sm shadow-[hsl(var(--gold)_/_0.5)]"
                      : "bg-muted-foreground/30 hover:bg-muted-foreground/60 w-2"
                  }`}
                  aria-label={`Slide ${index + 1}`}
                />
              ))}
            </div>
          )}

          {/* Arrows */}
          {banners.length > 1 && (
            <>
              <button
                onClick={() => api?.scrollPrev()}
                className="absolute left-4 top-1/2 -translate-y-1/2 hidden md:flex size-10 items-center justify-center rounded-xl glass border border-white/40 dark:border-white/10 text-foreground hover:bg-white/80 dark:hover:bg-white/10 transition-all shadow-lg active:scale-90"
                aria-label="Previous slide"
              >
                <ChevronLeft className="size-5" />
              </button>
              <button
                onClick={() => api?.scrollNext()}
                className="absolute right-4 top-1/2 -translate-y-1/2 hidden md:flex size-10 items-center justify-center rounded-xl glass border border-white/40 dark:border-white/10 text-foreground hover:bg-white/80 dark:hover:bg-white/10 transition-all shadow-lg active:scale-90"
                aria-label="Next slide"
              >
                <ChevronRight className="size-5" />
              </button>
            </>
          )}
        </div>
      </section>

      {/* ════════════════════════════════════════
          STATS STRIP
      ════════════════════════════════════════ */}
      <section className="container mx-auto px-4 md:px-8 pb-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {STATS.map(({ value, label, icon: Icon }) => (
            <div
              key={label}
              className="glass-card rounded-2xl p-5 flex flex-col items-center text-center gap-2 card-lift"
            >
              <div className="flex items-center justify-center size-11 rounded-xl bg-gradient-to-br from-[hsl(var(--primary)_/_0.15)] to-[hsl(var(--gold)_/_0.1)] border border-[hsl(var(--primary)_/_0.2)]">
                <Icon className="size-5 text-[hsl(var(--primary))] dark:text-[hsl(var(--primary))]" />
              </div>
              <p className="stat-number text-2xl md:text-3xl font-extrabold gradient-text">{value}</p>
              <p className="text-xs text-muted-foreground font-medium">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════
          CORE OFFERINGS
      ════════════════════════════════════════ */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-muted/20 to-transparent pointer-events-none" />

        <div className="container mx-auto px-4 md:px-8 relative">
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-4">
            <Badge className="px-4 py-1.5 rounded-full font-semibold text-[hsl(var(--gold))] bg-[hsl(var(--gold)_/_0.1)] border-[hsl(var(--gold)_/_0.3)] text-xs uppercase tracking-wider">
              Core Offerings
            </Badge>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight" style={{ fontFamily: "Sora, sans-serif" }}>
              Services Built for Teachers
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Competitive rates and absolute transparency, fully managed by the teacher community for the teacher community.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {OFFERINGS.map((o, i) => (
              <div
                key={i}
                className="glass-card rounded-3xl p-8 flex flex-col gap-5 card-lift group"
              >
                <div className={`flex items-center justify-center size-16 rounded-2xl border ${o.iconBg} ${o.iconColor} group-hover:scale-110 transition-transform duration-300`}>
                  <o.icon className="size-8" strokeWidth={1.5} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold" style={{ fontFamily: "Sora, sans-serif" }}>{o.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{o.description}</p>
                </div>
                <div className={`h-1 w-12 rounded-full bg-gradient-to-r ${o.gradient} group-hover:w-20 transition-all duration-500`} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          BENEFITS SHOWCASE
      ════════════════════════════════════════ */}
      {benefits.length > 0 && (
        <section className="py-20 relative">
          <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--primary)_/_0.04)] to-transparent pointer-events-none" />
          <div className="container mx-auto px-4 md:px-8">
            <div className="text-center max-w-2xl mx-auto mb-14 space-y-4">
              <Badge className="px-4 py-1.5 rounded-full font-semibold text-[hsl(var(--primary))] dark:text-[hsl(var(--primary))] bg-[hsl(var(--primary)_/_0.1)] border-[hsl(var(--primary)_/_0.3)] text-xs uppercase tracking-wider">
                Exclusive Perks
              </Badge>
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight" style={{ fontFamily: "Sora, sans-serif" }}>
                Membership Benefits
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                As a registered cooperative member, you get access to exceptional yearly benefits and social initiatives.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {benefits.map((benefit) => {
                const BenefitIcon = IconMap[benefit.icon] || HelpCircle;
                return (
                  <div
                    key={benefit._id}
                    className="glass-card rounded-2xl p-6 flex flex-col gap-4 card-lift group border border-transparent hover:border-[hsl(var(--primary)_/_0.2)] transition-all duration-300"
                  >
                    <div className="flex items-center justify-center size-12 rounded-xl bg-gradient-to-br from-[hsl(var(--primary)_/_0.2)] to-[hsl(var(--gold)_/_0.1)] border border-[hsl(var(--primary)_/_0.2)] text-[hsl(var(--primary))] dark:text-[hsl(var(--primary))] group-hover:from-[hsl(var(--primary)_/_0.3)] group-hover:to-[hsl(var(--gold)_/_0.2)] group-hover:scale-110 transition-all duration-300">
                      <BenefitIcon className="size-5" />
                    </div>
                    <div className="space-y-1.5">
                      <h3 className="font-bold text-base" style={{ fontFamily: "Sora, sans-serif" }}>{benefit.title}</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">{benefit.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ════════════════════════════════════════
          CTA SECTION
      ════════════════════════════════════════ */}
      <section className="py-24 relative overflow-hidden" id="contact">
        {/* Premium gradient background */}
        <div className="absolute inset-0"
          style={{ background: "linear-gradient(135deg, hsl(var(--primary),0.12) 0%, transparent 50%, hsl(var(--gold),0.06) 100%)" }}
        />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[hsl(var(--border))] to-transparent" />
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 size-[600px] bg-[hsl(var(--primary)_/_0.06)] rounded-full blur-3xl pointer-events-none" />

        <div className="container mx-auto px-4 md:px-8 text-center relative z-10">
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-[hsl(var(--gold)_/_0.3)] text-[hsl(var(--gold))] text-sm font-semibold mb-2">
              <Lock className="size-3.5" />
              Secure & Government Registered
            </div>
            <h2
              className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight"
              style={{ fontFamily: "Sora, sans-serif" }}
            >
              Ready to Partner with{" "}
              <span className="gradient-text">SKGPPST Co-op?</span>
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
              Register and submit your application online. Our admin committee reviews and approves new memberships regularly.
            </p>
            <div className="pt-4 flex flex-col sm:flex-row justify-center items-center gap-4">
              <Button
                asChild
                size="lg"
                className="w-full sm:w-auto rounded-xl font-bold shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all px-8"
                style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--gold)))", color: "white" }}
              >
                <Link href="/login">Apply for Membership</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="w-full sm:w-auto rounded-xl backdrop-blur-sm border-[hsl(var(--border))] hover:border-[hsl(var(--primary)_/_0.4)] transition-all px-8"
              >
                <Link href="/login">Access Portal Account</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          FOOTER
      ════════════════════════════════════════ */}
      <footer className="mt-auto border-t border-border/30 bg-muted/20 backdrop-blur-sm">
        <div className="container mx-auto px-4 md:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-10">
            {/* Brand column */}
            <div className="space-y-4">
              <Logo showText size="md" />
              <p className="text-xs text-muted-foreground leading-relaxed max-w-sm">
                Sarisha &amp; Khorda G P Primary School Teachers Co Operative Credit Society LTD.
                Built on transparency, trust, and shared financial values.
              </p>
              <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                <CheckCircle2 className="size-4 shrink-0" />
                Govt. Regd. Cooperative Credit Society
              </div>
            </div>

            {/* Links column */}
            <div className="space-y-4">
              <h4 className="font-bold text-sm" style={{ fontFamily: "Sora, sans-serif" }}>Portal Links</h4>
              <ul className="space-y-2.5 text-sm">
                {[
                  ["Member Sign In", "/login"],
                  ["Apply for Membership", "/login"],
                  ["Loan Calculator", "/login"],
                ].map(([label, href]) => (
                  <li key={label}>
                    <Link href={href} className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5 group">
                      <ArrowRight className="size-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact column */}
            <div className="space-y-4">
              <h4 className="font-bold text-sm" style={{ fontFamily: "Sora, sans-serif" }}>Contact</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-center gap-2.5">
                  <div className="flex items-center justify-center size-8 rounded-lg bg-[hsl(var(--primary)_/_0.1)] text-[hsl(var(--primary))]">
                    <Mail className="size-4" />
                  </div>
                  <span>sarikhor94@gmail.com</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <div className="flex items-center justify-center size-8 rounded-lg bg-[hsl(var(--gold)_/_0.1)] text-[hsl(var(--gold))]">
                    <Shield className="size-4" />
                  </div>
                  <span>Certified Financial Cooperative</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Footer bottom bar */}
          <div className="border-t border-border/20 pt-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} SKGPPST Co-op Credit Society Ltd. All rights reserved.</p>
            <p className="flex items-center gap-1.5">
              <Shield className="size-3.5 text-[hsl(var(--primary))]" />
              Certified Cooperative · Govt. Regd.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

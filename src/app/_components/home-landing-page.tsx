"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Star,
  CheckCircle2,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

const IconMap: Record<string, React.ComponentType<any>> = {
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
  SettingsIcon,
  HelpCircle,
  Briefcase,
  CircleDollarSign,
};

interface IBanner {
  _id: string;
  title: string;
  subtitle?: string;
  description: string;
  imageUrl?: string;
  bgGradient?: string;
  ctaText?: string;
  ctaLink?: string;
  isActive: boolean;
  order: number;
}

interface IBenefit {
  _id: string;
  title: string;
  description: string;
  icon: string;
  isActive: boolean;
  order: number;
}

export function HomeLandingPage({
  banners,
  benefits,
}: {
  banners: any[];
  benefits: any[];
}) {
  const [api, setApi] = React.useState<CarouselApi>();
  const [current, setCurrent] = React.useState(0);

  React.useEffect(() => {
    if (!api) return;
    setCurrent(api.selectedScrollSnap());
    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  React.useEffect(() => {
    if (!api) return;
    const interval = setInterval(() => {
      if (api.canScrollNext()) {
        api.scrollNext();
      } else {
        api.scrollTo(0);
      }
    }, 6000);
    return () => clearInterval(interval);
  }, [api]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary selection:text-primary-foreground">
      {/* Dynamic Glassmorphic Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 p-2 rounded-lg border border-primary/20 text-primary">
              <Landmark className="size-6" />
            </div>
            <div>
              <span className="font-bold text-lg leading-none tracking-tight block text-primary">S&KGPPS Co-op</span>
              <span className="text-[10px] text-muted-foreground font-medium hidden sm:block">Primary School Teachers Credit Society</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex text-muted-foreground hover:text-foreground">
              <Link href="/login">Contact</Link>
            </Button>
            <Button asChild size="sm" className="shadow-md hover:shadow-lg transition-all">
              <Link href="/login">Sign In <ArrowRight className="ml-1.5 size-4" /></Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Banner Slider Section */}
      <section className="container mx-auto px-4 md:px-8 pt-8 pb-12">
        <div className="w-full relative">
          <Carousel setApi={setApi} className="w-full overflow-hidden rounded-3xl border border-primary/10 shadow-xl shadow-primary/5">
            <CarouselContent className="-ml-0">
              {banners.map((banner) => (
                <CarouselItem key={banner._id} className="pl-0">
                  <div className={`relative min-h-[420px] md:min-h-[480px] w-full h-full flex items-center bg-gradient-to-br ${banner.bgGradient || "from-blue-600/20 via-indigo-600/10 to-transparent"} p-8 md:p-16 overflow-hidden`}>
                    {/* Background abstract artwork */}
                    <div className="absolute right-0 top-0 w-96 h-96 bg-primary/5 rounded-full filter blur-3xl -z-10 translate-x-12 -translate-y-12"></div>
                    <div className="absolute left-1/3 bottom-0 w-80 h-80 bg-accent/5 rounded-full filter blur-3xl -z-10 translate-y-12"></div>

                    <div className="max-w-2xl space-y-6 relative z-10 text-left">
                      {banner.subtitle && (
                        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 backdrop-blur-sm animate-fade-in font-semibold tracking-wide uppercase px-3 py-1">
                          {banner.subtitle}
                        </Badge>
                      )}
                      <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-foreground via-foreground to-muted-foreground bg-clip-text text-transparent">
                        {banner.title}
                      </h1>
                      <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-xl font-normal leading-relaxed">
                        {banner.description}
                      </p>
                      {banner.ctaText && (
                        <div className="pt-2">
                          <Button asChild size="lg" className="shadow-lg hover:shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
                            <Link href={banner.ctaLink || "/login"}>
                              {banner.ctaText}
                              <ArrowRight className="ml-2 size-5" />
                            </Link>
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>

          {/* Dots Navigation */}
          {banners.length > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20 bg-background/40 backdrop-blur-md px-3.5 py-2 rounded-full border border-white/5">
              {banners.map((_, index) => (
                <button
                  key={index}
                  onClick={() => api?.scrollTo(index)}
                  className={`size-2.5 rounded-full transition-all duration-300 ${index === current
                      ? "bg-primary w-6"
                      : "bg-muted-foreground/30 hover:bg-muted-foreground/60"
                    }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          )}

          {/* Arrows */}
          {banners.length > 1 && (
            <>
              <Button
                size="icon"
                variant="outline"
                className="absolute left-4 top-1/2 -translate-y-1/2 hidden md:inline-flex rounded-full bg-background/60 backdrop-blur-sm border border-border/40 hover:bg-background/90"
                onClick={() => api?.scrollPrev()}
              >
                <ChevronLeft className="size-5" />
              </Button>
              <Button
                size="icon"
                variant="outline"
                className="absolute right-4 top-1/2 -translate-y-1/2 hidden md:inline-flex rounded-full bg-background/60 backdrop-blur-sm border border-border/40 hover:bg-background/90"
                onClick={() => api?.scrollNext()}
              >
                <ChevronRight className="size-5" />
              </Button>
            </>
          )}
        </div>
      </section>

      {/* Core Offerings Section */}
      <section className="py-16 bg-muted/30 border-y border-border/40">
        <div className="container mx-auto px-4 md:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <Badge variant="outline" className="px-3 py-1 font-semibold text-primary border-primary/20 bg-primary/5 uppercase">
              Core Offerings
            </Badge>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">Services Custom-Built for Teachers</h2>
            <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
              We provide competitive rates and absolute transparency, fully managed by the teacher community.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "Secure & Fair Loans",
                description: "Quick personal loan disbursements up to ₹6,00,000 at competitive and transparent interest rates.",
                icon: <Handshake className="size-8 text-primary" />,
              },
              {
                title: "Savings & Wealth Growth",
                description: "Grow your reserve capital safely using our Share, Guaranteed, and monthly Thrift funds.",
                icon: <PiggyBank className="size-8 text-primary" />,
              },
              {
                title: "Mutual Financial Trust",
                description: "A cooperative structure built entirely on transparency and mutual growth, supporting teachers in need.",
                icon: <HeartHandshake className="size-8 text-primary" />,
              },
            ].map((offering, idx) => (
              <Card key={idx} className="group hover:border-primary/40 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                <CardContent className="pt-8 text-center space-y-4">
                  <div className="mx-auto w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20 group-hover:scale-110 transition-transform">
                    {offering.icon}
                  </div>
                  <h3 className="text-xl font-bold">{offering.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{offering.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Dynamic Benefits Showcase Section */}
      <section className="container mx-auto px-4 md:px-8 py-20">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <Badge variant="outline" className="px-3 py-1 font-semibold text-primary border-primary/20 bg-primary/5 uppercase">
            Exclusive Perks
          </Badge>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">Exclusive Membership Benefits</h2>
          <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
            As a registered cooperative member, you get access to exceptional yearly benefits and social initiatives.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {benefits.map((benefit) => {
            const BenefitIcon = IconMap[benefit.icon] || HelpCircle;
            return (
              <div
                key={benefit._id}
                className="relative group rounded-2xl p-[1.5px] bg-gradient-to-br from-primary/20 via-border/60 to-primary/10 hover:from-primary/60 hover:via-accent/40 hover:to-primary/30 transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-1"
              >
                <div className="bg-card rounded-[15px] p-6 h-full flex flex-col justify-between space-y-6">
                  <div className="space-y-4">
                    <div className="bg-primary/15 p-3 rounded-xl border border-primary/20 text-primary group-hover:bg-primary group-hover:text-primary-foreground group-hover:scale-105 transition-all duration-300 w-fit shadow-sm">
                      <BenefitIcon className="size-6" />
                    </div>
                    <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">{benefit.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{benefit.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {benefits.length === 0 && (
          <div className="text-center py-12 text-muted-foreground text-sm">
            No benefits active at the moment. Please check back later.
          </div>
        )}
      </section>

      {/* CTA Join Section */}
      <section className="py-20 bg-gradient-to-br from-primary/10 via-background to-accent/5 border-t border-border/40 relative overflow-hidden">
        <div className="absolute right-1/4 top-1/4 w-[300px] h-[300px] bg-primary/5 rounded-full filter blur-3xl -z-10"></div>
        <div className="absolute left-1/4 bottom-1/4 w-[300px] h-[300px] bg-accent/5 rounded-full filter blur-3xl -z-10"></div>

        <div className="container mx-auto px-4 md:px-8 text-center max-w-3xl space-y-6">
          <Badge variant="outline" className="px-3 py-1 font-semibold text-primary border-primary/20 bg-primary/5 uppercase">
            Become a Member
          </Badge>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight">
            Ready to Partner with S&KGPPS Co-op?
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Register and submit your application online. Our admin committee reviews and approves new memberships regularly.
          </p>
          <div className="pt-4 flex flex-col sm:flex-row justify-center items-center gap-4">
            <Button asChild size="lg" className="w-full sm:w-auto shadow-lg hover:shadow-primary/20">
              <Link href="/login">Apply for Membership</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full sm:w-auto bg-background/50 backdrop-blur-sm">
              <Link href="/login">Access Portal Account</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Modern Professional Footer */}
      <footer className="mt-auto border-t border-border/40 bg-muted/30">
        <div className="container mx-auto px-4 md:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8 text-left">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="bg-primary/10 p-2 rounded-lg border border-primary/20 text-primary">
                  <Landmark className="size-5" />
                </div>
                <span className="font-bold text-base text-primary">S&KGPPS Co-op</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-sm">
                Sarisha & Khorda G P Primary School Teachers Co Operative Credit Society LTD. Built on transparency, trust, and shared teachers' financial values.
              </p>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-sm uppercase tracking-wider text-primary">Portal Links</h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <Link href="/login" className="text-muted-foreground hover:text-foreground transition-colors">Member Sign In</Link>
                </li>
                <li>
                  <Link href="/login" className="text-muted-foreground hover:text-foreground transition-colors">Apply for Membership</Link>
                </li>
                <li>
                  <Link href="/login" className="text-muted-foreground hover:text-foreground transition-colors">Loan Interest Calculator</Link>
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-sm uppercase tracking-wider text-primary">Contact Support</h4>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Mail className="size-4 shrink-0 text-primary" />
                  <span>sarikhor94@gmail.com</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 shrink-0 text-emerald-500" />
                  <span>Govt. Regd. Cooperative Credit Society</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border/20 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} S&KGPPS Co-op Credit Society Ltd. All rights reserved.</p>
            <p className="flex items-center gap-1.5">
              <Shield className="size-3.5 text-primary" />
              <span>Certified Financial Cooperative</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

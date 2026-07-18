"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition, useEffect } from "react";
import {
  LogIn,
  AlertTriangle,
  Eye,
  EyeOff,
  Shield,
  Users,
  TrendingUp,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { login } from "./actions";
import { getBanners } from "@/app/admin/homepage/actions";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";

const FEATURE_PILLS = [
  { icon: Shield, label: "Secure & Encrypted" },
  { icon: Users, label: "500+ Members" },
  { icon: TrendingUp, label: "Trusted Since 2010" },
];

export default function LoginPage() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [banners, setBanners] = useState<any[]>([]);
  const [currentBanner, setCurrentBanner] = useState(0);

  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    getBanners(true).then(setBanners).catch(console.error);
  }, []);

  useEffect(() => {
    if (banners.length <= 1) return;
    const id = setInterval(() => {
      setCurrentBanner((p) => (p + 1) % banners.length);
    }, 5000);
    return () => clearInterval(id);
  }, [banners.length]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await login({ identifier, password });
      if (result?.error) {
        setError(result.error);
      } else {
        router.refresh();
      }
    });
  }

  const activeBanner = banners[currentBanner];

  return (
    <div className="min-h-screen flex" style={{ fontFamily: "Inter, sans-serif" }}>
      {/* ════════════════════════════════════════
          LEFT PANEL — Art + Brand (desktop only)
      ════════════════════════════════════════ */}
      <div className="hidden lg:flex lg:w-[55%] xl:w-[60%] relative overflow-hidden">
        {/* Animated gradient mesh background */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, hsl(220,75%,20%) 0%, hsl(199,80%,30%) 40%, hsl(220,60%,15%) 80%, hsl(35,80%,30%) 100%)",
          }}
        />

        {/* Animated orbs */}
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute size-[600px] rounded-full animate-pulse-glow"
            style={{
              background: "radial-gradient(circle, hsl(199,80%,60%,0.25) 0%, transparent 70%)",
              top: "-100px",
              right: "-100px",
            }}
          />
          <div
            className="absolute size-[400px] rounded-full"
            style={{
              background: "radial-gradient(circle, hsl(35,90%,55%,0.2) 0%, transparent 70%)",
              bottom: "-60px",
              left: "10%",
              animation: "pulse-glow 4s ease-in-out infinite",
              animationDelay: "2s",
            }}
          />
          <div
            className="absolute size-[300px] rounded-full animate-float"
            style={{
              background: "radial-gradient(circle, hsl(220,75%,60%,0.15) 0%, transparent 70%)",
              top: "40%",
              left: "30%",
            }}
          />
        </div>

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "linear-gradient(hsl(0,0%,100%) 1px, transparent 1px), linear-gradient(90deg, hsl(0,0%,100%) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col w-full p-10 xl:p-14">
          {/* Logo */}
          <div className="mb-auto">
            <Logo showText size="lg" />
          </div>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2.5 mb-8">
            {FEATURE_PILLS.map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/15 text-white/90 text-xs font-semibold"
              >
                <Icon className="size-3.5" />
                {label}
              </div>
            ))}
          </div>

          {/* Dynamic banner content */}
          <div className="space-y-4 mb-12">
            {activeBanner ? (
              <>
                <div className="flex items-center gap-2 text-[hsl(35,90%,70%)] text-xs font-semibold uppercase tracking-widest">
                  <Sparkles className="size-3.5" />
                  {activeBanner.subtitle || "Featured"}
                </div>
                <h2
                  className="text-3xl xl:text-4xl font-extrabold text-white leading-tight"
                  style={{ fontFamily: "Sora, sans-serif" }}
                >
                  {activeBanner.title}
                </h2>
                <p className="text-white/65 text-sm leading-relaxed max-w-md">
                  {activeBanner.description}
                </p>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 text-[hsl(35,90%,70%)] text-xs font-semibold uppercase tracking-widest">
                  <Sparkles className="size-3.5" />
                  Welcome Back
                </div>
                <h2
                  className="text-3xl xl:text-4xl font-extrabold text-white leading-tight"
                  style={{ fontFamily: "Sora, sans-serif" }}
                >
                  Your Financial Partner for Teachers
                </h2>
                <p className="text-white/65 text-sm leading-relaxed max-w-md">
                  Access your cooperative account, track loans, and manage your savings — all in one secure place.
                </p>
              </>
            )}
          </div>

          {/* Floating glass stats card */}
          <div className="rounded-2xl bg-white/[0.08] backdrop-blur-md border border-white/15 p-5 flex items-center gap-5">
            <div className="flex flex-col gap-1">
              <p className="text-[hsl(35,90%,70%)] text-xs font-semibold uppercase tracking-wider">Quick Stats</p>
              <div className="flex gap-6 mt-1">
                {[
                  { v: "500+", l: "Members" },
                  { v: "₹2Cr+", l: "Disbursed" },
                  { v: "15 Yrs", l: "Experience" },
                ].map(({ v, l }) => (
                  <div key={l}>
                    <p className="text-white font-bold text-lg leading-none" style={{ fontFamily: "Sora, sans-serif" }}>{v}</p>
                    <p className="text-white/50 text-[11px] mt-0.5">{l}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Banner dots */}
          {banners.length > 1 && (
            <div className="flex gap-1.5 mt-5">
              {banners.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentBanner(i)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === currentBanner ? "w-5 bg-[hsl(35,90%,60%)]" : "w-1.5 bg-white/30"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ════════════════════════════════════════
          RIGHT PANEL — Login Form
      ════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col min-h-screen bg-background">
        {/* Top bar on mobile */}
        <div className="flex items-center justify-between p-4 lg:hidden">
          <Logo showText size="sm" className="[--sidebar-foreground:hsl(var(--foreground))] [--sidebar-muted-foreground:hsl(var(--muted-foreground))]" />
          <ThemeToggle />
        </div>
        <div className="hidden lg:flex justify-end p-5">
          <ThemeToggle />
        </div>

        {/* Centered form */}
        <div className="flex-1 flex items-center justify-center px-5 py-8">
          <div className="w-full max-w-[420px] space-y-8 animate-slide-up">
            {/* Header */}
            <div className="space-y-2">
              <h1
                className="text-2xl sm:text-3xl font-extrabold tracking-tight"
                style={{ fontFamily: "Sora, sans-serif" }}
              >
                Welcome back
              </h1>
              <p className="text-sm text-muted-foreground">
                Sign in to access your cooperative account
              </p>
            </div>

            {/* Error */}
            {error && (
              <Alert variant="destructive" className="rounded-xl">
                <AlertTriangle className="size-4" />
                <AlertTitle>Sign In Failed</AlertTitle>
                <AlertDescription className="text-xs">{error}</AlertDescription>
              </Alert>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email / Phone */}
              <div className="space-y-1.5">
                <Label htmlFor="identifier" className="text-sm font-semibold">
                  Email or Phone
                </Label>
                <Input
                  id="identifier"
                  type="text"
                  placeholder="you@example.com or 9XXXXXXXXX"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                  autoComplete="username"
                  className="h-12 rounded-xl border-border/60 bg-muted/30 focus:bg-background transition-colors text-sm"
                />
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-semibold">
                    Password
                  </Label>
                  <Link
                    href="/login"
                    className="text-xs text-[hsl(var(--primary))] hover:underline font-medium"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className="h-12 rounded-xl border-border/60 bg-muted/30 focus:bg-background transition-colors pr-12 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1 rounded-lg"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="size-4.5" /> : <Eye className="size-4.5" />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <Button
                type="submit"
                disabled={isPending}
                className="w-full h-12 rounded-xl font-bold text-sm shadow-xl hover:shadow-2xl hover:scale-[1.01] active:scale-[0.99] transition-all"
                style={{
                  background: isPending
                    ? undefined
                    : "linear-gradient(135deg, hsl(var(--primary)), hsl(220,75%,40%), hsl(var(--gold)))",
                  color: "white",
                }}
              >
                {isPending ? (
                  <span className="flex items-center gap-2">
                    <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in…
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <LogIn className="size-4.5" />
                    Sign In
                    <ChevronRight className="size-4 ml-auto" />
                  </span>
                )}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border/40" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-background px-3 text-xs text-muted-foreground">
                  New to the society?
                </span>
              </div>
            </div>

            {/* Signup CTA */}
            <Button
              asChild
              variant="outline"
              className="w-full h-12 rounded-xl font-semibold border-border/60 hover:border-[hsl(var(--primary)_/_0.4)] transition-all text-sm"
            >
              <Link href="/signup">Create an Account</Link>
            </Button>

            {/* Trust badges */}
            <div className="flex items-center justify-center gap-4 pt-2">
              {[
                { icon: Shield, label: "SSL Secured" },
                { icon: Users, label: "Verified Coop" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <Icon className="size-3 text-[hsl(var(--primary))]" />
                  {label}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer note */}
        <div className="p-5 text-center">
          <p className="text-[11px] text-muted-foreground">
            &copy; {new Date().getFullYear()} SKGPPST Co-op Credit Society Ltd.
          </p>
        </div>
      </div>
    </div>
  );
}

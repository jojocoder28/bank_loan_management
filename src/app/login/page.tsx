
"use client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition, useEffect } from "react";
import { LogIn, AlertTriangle, Eye, EyeOff, Landmark } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { login } from "./actions";
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel";
import { Badge } from "@/components/ui/badge";
import { getBanners } from "@/app/admin/homepage/actions";


export default function LoginPage() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Banner State
  const [banners, setBanners] = useState<any[]>([]);
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    async function loadBanners() {
      try {
        const activeBanners = await getBanners(true);
        setBanners(activeBanners);
      } catch (err) {
        console.error("Failed to load banners on login page", err);
      }
    }
    loadBanners();
  }, []);

  useEffect(() => {
    if (!api) return;
    setCurrent(api.selectedScrollSnap());
    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });

    const interval = setInterval(() => {
      if (api.canScrollNext()) {
        api.scrollNext();
      } else {
        api.scrollTo(0);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [api]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    startTransition(async () => {
      const formData = new FormData();
      formData.append('identifier', identifier);
      formData.append('password', password);
      
      const result = await login(formData);

      if (result.error) {
        setError(result.error);
      } else {
        if (result.requiresPasswordChange) {
            router.push('/force-password-change');
        } else if (result.role === 'admin') {
            router.push('/admin/dashboard');
        } else {
            router.push('/dashboard');
        }
        // We call router.refresh() to ensure the new session is picked up by the layout
        router.refresh();
      }
    });
  };

  return (
    <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2 xl:min-h-screen">
      <div className="flex items-center justify-center py-12">
        <div className="mx-auto grid w-[350px] gap-6">
          <div className="grid gap-2 text-center">
            <h1 className="text-3xl font-bold">Login</h1>
            <p className="text-balance text-muted-foreground">
              Enter your email or phone to access your account
            </p>
          </div>
           {error && (
             <Alert variant="destructive" className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Login Failed</AlertTitle>
                <AlertDescription>
                    {error}
                </AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="identifier">Email or Phone Number</Label>
              <Input
                id="identifier"
                type="text"
                placeholder="email@example.com or 9876543210"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                disabled={isPending}
              />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="password">Password</Label>
                 {/* <Link
                  href="/forgot-password"
                  className="ml-auto inline-block text-sm underline"
                >
                  Forgot your password?
                </Link> */}
              </div>
              <div className="relative">
                <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isPending}
                />
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                    onClick={() => setShowPassword(!showPassword)}
                >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    <span className="sr-only">{showPassword ? 'Hide password' : 'Show password'}</span>
                </Button>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? "Logging in..." : "Login"}
            </Button>
          </form>
          {/* <div className="mt-4 text-center text-sm">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="underline">
              Sign up
            </Link>
          </div> */}
        </div>
      </div>
      <div className="hidden bg-muted lg:flex items-center justify-center flex-col p-8 overflow-hidden relative">
        {banners.length > 0 ? (
          <div className="w-full max-w-lg mx-auto">
            <Carousel setApi={setApi} className="w-full">
              <CarouselContent>
                {banners.map((banner) => (
                  <CarouselItem key={banner._id.toString()}>
                    <div className="flex flex-col items-center justify-center text-center p-6 space-y-6">
                      <div className="bg-primary/10 p-4 rounded-2xl border border-primary/20 text-primary">
                        <Landmark className="size-12" />
                      </div>
                      {banner.subtitle && (
                        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                          {banner.subtitle}
                        </Badge>
                      )}
                      <h2 className="text-3xl font-bold tracking-tight">
                        {banner.title}
                      </h2>
                      <p className="text-balance text-muted-foreground max-w-md leading-relaxed">
                        {banner.description}
                      </p>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>

            {/* Dots */}
            {banners.length > 1 && (
              <div className="flex justify-center gap-1.5 mt-4">
                {banners.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => api?.scrollTo(index)}
                    className={`size-2 rounded-full transition-all duration-300 ${
                      index === current
                        ? "bg-primary w-4"
                        : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                    }`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center max-w-md">
            <Landmark className="size-16 text-primary mb-4" />
            <h2 className="text-3xl font-bold">
                Sarisha & Khorda G P Primary School Teachers Co Operative Credit Society LTD
            </h2>
             <p className="text-balance text-muted-foreground mt-4">
                Your trusted financial partner, dedicated to serving the teacher community with integrity and excellence.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

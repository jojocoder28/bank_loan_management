"use client";

import * as React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import { ArrowRight, Landmark } from "lucide-react";

export function DashboardBanners({ banners }: { banners: any[] }) {
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

  if (!banners || banners.length === 0) return null;

  return (
    <div className="w-full relative">
      <Carousel setApi={setApi} className="w-full overflow-hidden rounded-2xl border border-primary/10 shadow-md bg-card">
        <CarouselContent className="-ml-0">
          {banners.map((banner) => (
            <CarouselItem key={banner._id.toString()} className="pl-0">
              <div className={`relative min-h-[160px] sm:min-h-[200px] w-full h-full flex items-center bg-gradient-to-br ${banner.bgGradient || "from-blue-600/10 via-indigo-600/5 to-transparent"} p-6 sm:p-10 overflow-hidden`}>
                <div className="max-w-2xl space-y-3 relative z-10 text-left">
                  {banner.subtitle && (
                    <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-[10px] py-0.5 px-2">
                      {banner.subtitle}
                    </Badge>
                  )}
                  <h3 className="text-xl sm:text-2xl font-bold tracking-tight">
                    {banner.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground max-w-xl font-normal line-clamp-2">
                    {banner.description}
                  </p>
                  {banner.ctaText && (
                    <div className="pt-1.5">
                      <Button asChild size="sm" className="h-8 shadow-sm">
                        <Link href={banner.ctaLink || "#"}>
                          {banner.ctaText}
                          <ArrowRight className="ml-1.5 size-3.5" />
                        </Link>
                      </Button>
                    </div>
                  )}
                </div>
                {/* Decorative Landmark Icon background */}
                <div className="absolute right-10 top-1/2 -translate-y-1/2 opacity-5 text-primary hidden md:block">
                  <Landmark className="size-36" />
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      {/* Dots Navigation */}
      {banners.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-20 bg-background/50 backdrop-blur-sm px-2.5 py-1 rounded-full border border-white/5">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => api?.scrollTo(index)}
              className={`size-2 rounded-full transition-all duration-300 ${
                index === current
                  ? "bg-primary w-4"
                  : "bg-muted-foreground/35 hover:bg-muted-foreground/60"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

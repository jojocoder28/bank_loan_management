import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getProfileData } from "./actions";
import { notFound } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  User,
  Mail,
  Phone,
  Briefcase,
  MapPin,
  Banknote,
  Shield,
  Calendar,
  Building,
  ClipboardList,
  Edit3,
  Coins,
  PiggyBank,
  TrendingUp,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await getProfileData();

  if (!user) {
    notFound();
  }

  const roleVariant: { [key: string]: "default" | "secondary" | "outline" } = {
    admin: "default",
    board_member: "secondary",
    member: "outline",
    user: "outline",
  };

  const formatAgeDisplay = (age: number | null | undefined, dob: string | Date | null | undefined) => {
    if (dob) {
      return `${age} (DOB: ${new Date(dob).toLocaleDateString()})`;
    }
    return age ? `${age} (DOB not set)` : "N/A";
  };

  return (
    <div className="flex justify-center animate-fade-in px-2 sm:px-4">
      <Card className="w-full max-w-4xl overflow-hidden glass-card border-none shadow-2xl">
        {/* ── COVER ART & PROFILE METADATA ── */}
        <div className="relative">
          {/* Cover gradient with floating blur orbs */}
          <div className="h-44 md:h-52 w-full bg-gradient-to-br from-[hsl(var(--primary))] via-slate-900 to-indigo-950 relative overflow-hidden flex items-end">
            <div className="absolute top-[-50px] right-[-50px] size-48 rounded-full bg-[hsl(var(--gold))] opacity-15 blur-2xl" />
            <div className="absolute bottom-[-30px] left-[10%] size-36 rounded-full bg-[hsl(var(--primary))] opacity-25 blur-xl" />
            <div
              className="absolute inset-0 opacity-[0.06]"
              style={{
                backgroundImage:
                  "linear-gradient(hsl(0,0%,100%) 1px, transparent 1px), linear-gradient(90deg, hsl(0,0%,100%) 1px, transparent 1px)",
                backgroundSize: "32px 32px",
              }}
            />
          </div>

          {/* Edit button in top right of cover */}
          <div className="absolute top-4 right-4 z-10">
            <Button
              asChild
              variant="outline"
              className="rounded-xl glass border-white/20 hover:border-white/40 text-white hover:text-white bg-black/20 hover:bg-black/40 backdrop-blur-md transition-all font-semibold flex items-center gap-1.5"
            >
              <Link href="/settings">
                <Edit3 className="size-4" />
                Edit Profile
              </Link>
            </Button>
          </div>

          {/* Avatar and name header container (overlaps cover) */}
          <div className="px-6 md:px-8 pb-6 relative flex flex-col md:flex-row items-center md:items-end gap-5 -mt-16 md:-mt-20">
            <Avatar className="size-28 md:size-36 ring-4 ring-background shadow-xl shrink-0">
              <AvatarImage src={user.photoUrl ?? undefined} alt={user.name ?? "User"} />
              <AvatarFallback
                className="text-4xl font-extrabold text-white"
                style={{
                  background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--gold)))",
                }}
              >
                {user.name?.[0]?.toUpperCase() ?? "U"}
              </AvatarFallback>
            </Avatar>
            <div className="text-center md:text-left space-y-1 mb-2">
              <h1
                className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight leading-none"
                style={{ fontFamily: "Sora, sans-serif" }}
              >
                {user.name}
              </h1>
              <p className="text-sm md:text-base text-muted-foreground flex items-center justify-center md:justify-start gap-1.5">
                <Mail className="size-4 shrink-0 text-muted-foreground/60" />
                {user.email || "No email set"}
              </p>
              <div className="pt-1">
                <Badge
                  variant={roleVariant[user.role] || "outline"}
                  className="capitalize font-semibold text-xs px-3 py-1 rounded-full border-[hsl(var(--gold)_/_0.3)] bg-[hsl(var(--gold)_/_0.06)] text-[hsl(var(--gold))]"
                >
                  {user.role.replace("_", " ")}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <CardContent className="px-6 md:px-8 space-y-8 pb-10">
          {/* ── FUND HOLDINGS STRIP ── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                title: "Share Fund",
                val: user.shareFund,
                icon: Coins,
                gradient: "from-blue-500/10 to-indigo-500/5 border-blue-500/20",
                iconColor: "text-blue-500 dark:text-blue-400",
              },
              {
                title: "Thrift Fund",
                val: user.thriftFund,
                icon: PiggyBank,
                gradient: "from-emerald-500/10 to-teal-500/5 border-emerald-500/20",
                iconColor: "text-emerald-500 dark:text-emerald-400",
              },
              {
                title: "Guaranteed Fund",
                val: user.guaranteedFund,
                icon: TrendingUp,
                gradient: "from-rose-500/10 to-pink-500/5 border-rose-500/20",
                iconColor: "text-rose-500 dark:text-rose-400",
              },
            ].map((fund, idx) => (
              <div
                key={idx}
                className={`rounded-2xl p-5 border bg-gradient-to-br ${fund.gradient} flex items-center justify-between card-lift`}
              >
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                    {fund.title}
                  </p>
                  <p
                    className="stat-number text-xl md:text-2xl font-extrabold leading-none"
                    style={{ fontFamily: "Sora, sans-serif" }}
                  >
                    ₹{(fund.val || 0).toLocaleString()}
                  </p>
                </div>
                <div className="size-11 rounded-xl bg-background/50 border flex items-center justify-center">
                  <fund.icon className={`size-5.5 ${fund.iconColor}`} />
                </div>
              </div>
            ))}
          </div>

          <Separator className="opacity-60" />

          {/* ── PROFILE DETAILS SECTION ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left Column: Personal Info */}
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-[hsl(var(--primary)_/_0.15)] text-[hsl(var(--primary))] border border-[hsl(var(--primary)_/_0.2)]">
                  <User className="size-4.5" />
                </div>
                <h3 className="font-extrabold text-lg" style={{ fontFamily: "Sora, sans-serif" }}>
                  Personal Information
                </h3>
              </div>

              <div className="glass-card rounded-2xl p-6 border border-border/50 space-y-4">
                {[
                  { label: "Gender", val: user.gender, icon: User },
                  { label: "Age / DOB", val: formatAgeDisplay(user.age, user.dob), icon: Calendar },
                  { label: "Phone Number", val: user.phone, icon: Phone },
                  { label: "Membership ID", val: user.membershipNumber, icon: ClipboardList },
                  { label: "Permanent Address", val: user.personalAddress, icon: MapPin },
                  { label: "Bank Account #", val: user.bankAccountNumber, icon: Banknote },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3.5 group">
                    <div className="size-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-all shrink-0">
                      <item.icon className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider leading-none">
                        {item.label}
                      </p>
                      <p className="text-sm font-medium mt-1 text-foreground leading-normal truncate">
                        {item.val || "N/A"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: Professional + Nominee Info */}
            <div className="space-y-6">
              {/* Professional */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-[hsl(var(--gold)_/_0.15)] text-[hsl(var(--gold))] border border-[hsl(var(--gold)_/_0.2)]">
                    <Briefcase className="size-4.5" />
                  </div>
                  <h3 className="font-extrabold text-lg" style={{ fontFamily: "Sora, sans-serif" }}>
                    Professional Status
                  </h3>
                </div>

                <div className="glass-card rounded-2xl p-6 border border-border/50 space-y-4">
                  {[
                    { label: "Profession", val: user.profession, icon: Briefcase },
                    { label: "Workplace / School", val: user.workplace, icon: Building },
                    { label: "Workplace Address", val: user.workplaceAddress, icon: MapPin },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3.5 group">
                      <div className="size-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-gold/10 group-hover:text-[hsl(var(--gold))] transition-all shrink-0">
                        <item.icon className="size-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider leading-none">
                          {item.label}
                        </p>
                        <p className="text-sm font-medium mt-1 text-foreground leading-normal truncate">
                          {item.val || "N/A"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Nominee */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-purple-500/15 text-purple-500 border border-purple-500/20">
                    <Shield className="size-4.5" />
                  </div>
                  <h3 className="font-extrabold text-lg" style={{ fontFamily: "Sora, sans-serif" }}>
                    Nominee & Beneficiary
                  </h3>
                </div>

                <div className="glass-card rounded-2xl p-6 border border-border/50 space-y-4">
                  {[
                    { label: "Nominee Full Name", val: user.nomineeName, icon: User },
                    { label: "Relation with Nominee", val: user.nomineeRelation, icon: Shield },
                    { label: "Nominee Age / DOB", val: formatAgeDisplay(user.nomineeAge, user.nomineeDob), icon: Calendar },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3.5 group">
                      <div className="size-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-purple-500/10 group-hover:text-purple-500 transition-all shrink-0">
                        <item.icon className="size-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider leading-none">
                          {item.label}
                        </p>
                        <p className="text-sm font-medium mt-1 text-foreground leading-normal truncate">
                          {item.val || "N/A"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


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
} from "lucide-react";
import { Separator } from "@/components/ui/separator";

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const user = await getProfileData();

  if (!user) {
    notFound();
  }
  
  const roleVariant: { [key: string]: "default" | "secondary" | "outline" } = {
    admin: "default",
    board_member: "secondary",
    member: "outline",
    user: "outline"
  };

  const InfoField = ({ icon, label, value }: { icon: React.ReactNode, label: string, value?: string | number | null }) => (
      <div className="flex items-start gap-3">
        <div className="text-muted-foreground mt-1">{icon}</div>
        <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="font-medium">{value || "N/A"}</p>
        </div>
      </div>
  )

  const formatAgeDisplay = (age: number | null | undefined, dob: string | Date | null | undefined) => {
    if (dob) {
      return `${age} (DOB: ${new Date(dob).toLocaleDateString()})`;
    }
    return age ? `${age} (DOB not set)` : "N/A";
  }

  return (
    <div className="flex justify-center animate-fade-in">
        <Card className="w-full max-w-3xl glass-card">
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-24 w-24 ring-4 ring-primary/10">
                <AvatarImage src={user.photoUrl ?? undefined} alt={user.name ?? "User"} />
                <AvatarFallback className="text-3xl font-bold bg-primary/10 text-primary">
                  {user.name?.[0]?.toUpperCase() ?? "U"}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-3xl font-extrabold tracking-tight" style={{ fontFamily: 'Sora, sans-serif' }}>
                  {user.name}
                </CardTitle>
                <CardDescription className="text-base text-muted-foreground">{user.email}</CardDescription>
                <Badge variant={roleVariant[user.role] || "outline"} className="mt-2 capitalize text-xs font-semibold px-2.5 py-0.5">
                  {user.role.replace("_", " ")}
                </Badge>
              </div>
            </div>
            <Button asChild variant="outline" className="rounded-xl flex items-center gap-2 border-border/60 hover:border-primary/30 transition-all font-semibold shrink-0">
              <Link href="/settings">
                <User className="size-4" />
                Edit Profile
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="grid gap-6">
            <Separator />
            <h3 className="font-semibold text-lg">Personal Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-y-4 gap-x-2">
                 <InfoField icon={<User className="size-4"/>} label="Gender" value={user.gender} />
                 <InfoField icon={<Calendar className="size-4"/>} label="Age" value={formatAgeDisplay(user.age, user.dob)} />
                 <InfoField icon={<Phone className="size-4"/>} label="Phone" value={user.phone} />
                 <InfoField icon={<ClipboardList className="size-4"/>} label="Membership #" value={user.membershipNumber} />
                 <InfoField icon={<MapPin className="size-4"/>} label="Address" value={user.personalAddress} />
                 <InfoField icon={<Banknote className="size-4"/>} label="Bank Account" value={user.bankAccountNumber} />
            </div>
            <Separator />
             <h3 className="font-semibold text-lg">Professional Details</h3>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-y-4 gap-x-2">
                 <InfoField icon={<Briefcase className="size-4"/>} label="Profession" value={user.profession} />
                 <InfoField icon={<Building className="size-4"/>} label="Workplace" value={user.workplace} />
                 <InfoField icon={<MapPin className="size-4"/>} label="Workplace Address" value={user.workplaceAddress} />
             </div>
            <Separator />
             <h3 className="font-semibold text-lg">Nominee Details</h3>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-y-4 gap-x-2">
                 <InfoField icon={<User className="size-4"/>} label="Nominee Name" value={user.nomineeName} />
                 <InfoField icon={<Shield className="size-4"/>} label="Relation" value={user.nomineeRelation} />
                 <InfoField icon={<Calendar className="size-4"/>} label="Nominee Age" value={formatAgeDisplay(user.nomineeAge, user.nomineeDob)} />
             </div>
          </CardContent>
        </Card>
    </div>
  );
}

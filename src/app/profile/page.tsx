
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

  return (
    <div className="flex justify-center">
        <Card className="w-full max-w-3xl">
          <CardHeader className="flex-row items-center gap-4">
            <Avatar className="h-24 w-24">
              <AvatarImage src={user.photoUrl ?? undefined} />
              <AvatarFallback className="text-3xl">{user.name?.[0]}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-3xl">{user.name}</CardTitle>
              <CardDescription className="text-base">{user.email}</CardDescription>
              <Badge variant={roleVariant[user.role] || "outline"} className="mt-2 capitalize text-sm">
                {user.role.replace("_", " ")}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="grid gap-6">
            <Separator />
            <h3 className="font-semibold text-lg">Personal Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-y-4 gap-x-2">
                 <InfoField icon={<User className="size-4"/>} label="Gender" value={user.gender} />
                 <InfoField icon={<Calendar className="size-4"/>} label="Age" value={user.age} />
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
                 <InfoField icon={<Calendar className="size-4"/>} label="Nominee Age" value={user.nomineeAge} />
             </div>
          </CardContent>
        </Card>
    </div>
  );
}

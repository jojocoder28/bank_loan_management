
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Mail, Phone, MapPin, Building } from "lucide-react";

export default function ContactUsPage() {
  return (
    <div className="flex justify-center items-start pt-8">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="size-6" />
            About Our Society
          </CardTitle>
          <CardDescription>
            Sarisha & Khorda G P Primary School Teachers Co Operative Credit Society LTD
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          <div className="flex items-start gap-4">
            <MapPin className="size-6 text-primary mt-1" />
            <div>
              <h3 className="font-semibold">Registered Address</h3>
              <p className="text-muted-foreground">Regd No 11/1994/South 24 Parganas</p>
              <p className="text-muted-foreground">Date: 30/08/1994</p>
            </div>
          </div>
           <div className="flex items-start gap-4">
            <Phone className="size-6 text-primary mt-1" />
            <div>
              <h3 className="font-semibold">Contact Number</h3>
              <p className="text-muted-foreground">Our support team is available for any queries.</p>
              <p>9233092709</p>
            </div>
          </div>
           <div className="flex items-start gap-4">
            <Mail className="size-6 text-primary mt-1" />
            <div>
              <h3 className="font-semibold">Email</h3>
              <p className="text-muted-foreground">For general inquiries, please email us at:</p>
              <a href="mailto:info@coopbank.com" className="text-primary hover:underline">
                info@coopbank.com
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

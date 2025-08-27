
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Mail, Phone, MapPin } from "lucide-react";

export default function ContactUsPage() {
  return (
    <div className="flex justify-center items-start pt-8">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Contact Us
          </CardTitle>
          <CardDescription>
            We'd love to hear from you. Here's how you can reach us.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
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
           <div className="flex items-start gap-4">
            <Phone className="size-6 text-primary mt-1" />
            <div>
              <h3 className="font-semibold">Phone</h3>
              <p className="text-muted-foreground">Our support team is available from 9am to 5pm, Mon-Fri.</p>
              <p>+1 (555) 123-4567</p>
            </div>
          </div>
           <div className="flex items-start gap-4">
            <MapPin className="size-6 text-primary mt-1" />
            <div>
              <h3 className="font-semibold">Office Address</h3>
              <p className="text-muted-foreground">123 Cooperation Drive, Finance City, 12345</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

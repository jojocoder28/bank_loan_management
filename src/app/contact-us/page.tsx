
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Phone, MapPin } from "lucide-react";
import Image from "next/image";

const contactInfo = [
    {
        icon: <MapPin className="size-8 text-primary" />,
        title: "Registered Address",
        details: [
            "Sarisha & Khorda G P Primary School Teachers Co Operative Credit Society LTD",
            "Regd No 11/1994/South 24 Parganas",
            "Date: 30/08/1994"
        ]
    },
    {
        icon: <Phone className="size-8 text-primary" />,
        title: "Contact Number",
        details: ["9233092709"]
    },
    {
        icon: <Mail className="size-8 text-primary" />,
        title: "Email Address",
        details: ["info@coopbank.com"],
        isLink: true
    },
];

export default function ContactUsPage() {
  return (
    <div className="space-y-12">
        <div className="relative h-64 w-full rounded-xl overflow-hidden">
             <Image 
                src="https://picsum.photos/1200/400" 
                alt="Abstract background"
                fill
                className="object-cover"
                data-ai-hint="office building"
            />
            <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-center text-white p-4">
                 <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Contact Us</h1>
                <p className="mt-2 text-lg md:text-xl max-w-2xl">
                    We're here to help. Reach out to us through any of the methods below.
                </p>
            </div>
        </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {contactInfo.map((info, index) => (
             <Card key={index} className="text-center hover:shadow-lg transition-shadow duration-300">
                <CardHeader className="items-center space-y-4">
                    <div className="p-4 bg-primary/10 rounded-full">
                        {info.icon}
                    </div>
                    <CardTitle>{info.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 text-muted-foreground">
                    {info.details.map((detail, i) => (
                        info.isLink ? (
                             <a 
                                key={i}
                                href={`mailto:${detail}`} 
                                className="block text-primary hover:underline"
                            >
                                {detail}
                            </a>
                        ) : (
                            <p key={i}>{detail}</p>
                        )
                    ))}
                </CardContent>
            </Card>
        ))}
      </div>
    </div>
  );
}

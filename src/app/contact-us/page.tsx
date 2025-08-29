
import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Mail, Phone, MapPin, Send } from "lucide-react";
import { Button } from "@/components/ui/button";

const contactInfo = [
    {
        icon: <MapPin className="size-6 text-primary" />,
        title: "Registered Address",
        details: [
            "Sarisha & Khorda G P Primary School Teachers Co Operative Credit Society LTD",
            "Regd No 11/1994/South 24 Parganas, Date 30/08/1994"
        ]
    },
    {
        icon: <Phone className="size-6 text-primary" />,
        title: "Contact Number",
        details: ["9233092709"]
    },
    {
        icon: <Mail className="size-6 text-primary" />,
        title: "Email Address",
        details: ["sarikhor94@gmail.com"],
        isLink: true
    },
];

export default function ContactUsPage() {
  return (
    <div className="flex justify-center items-start pt-8">
        <Card className="w-full max-w-2xl">
            <CardHeader className="text-center">
                <CardTitle className="text-3xl font-bold tracking-tight">Contact Us</CardTitle>
                <p className="text-muted-foreground">
                    We're here to help. Reach out to us through any of the methods below.
                </p>
            </CardHeader>
            <CardContent className="space-y-6">
                {contactInfo.map((info, index) => (
                    <React.Fragment key={info.title}>
                        <div className="flex items-start gap-4 p-4">
                            <div className="flex-shrink-0 pt-1">
                                {info.icon}
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold">{info.title}</h3>
                                <div className="text-muted-foreground">
                                     {info.details.map((detail) => (
                                        info.isLink ? (
                                            <a 
                                                key={detail}
                                                href={`mailto:${detail}`} 
                                                className="block text-primary hover:underline"
                                            >
                                                {detail}
                                            </a>
                                        ) : (
                                            <p key={detail}>{detail}</p>
                                        )
                                    ))}
                                </div>
                            </div>
                        </div>
                        {index < contactInfo.length - 1 && <Separator />}
                    </React.Fragment>
                ))}
                <Separator />
                <div className="flex flex-col items-center gap-4 p-4 text-center">
                    <h3 className="text-lg font-semibold">Send a Query</h3>
                    <p className="text-muted-foreground">Have a specific question? Click the button below to send us an email directly.</p>
                    <Button asChild>
                        <a href="mailto:sarikhor94@gmail.com?subject=Query from Website">
                            <Send className="mr-2"/> Send Email
                        </a>
                    </Button>
                </div>
            </CardContent>
        </Card>
    </div>
  );
}

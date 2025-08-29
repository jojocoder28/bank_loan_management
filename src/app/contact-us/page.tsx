
"use client";

import * as React from "react";
import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Send, Loader2, CheckCircle, Building, ClipboardList, Phone } from "lucide-react";
import { submitContactForm } from "./actions";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";


function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" className="w-full" disabled={pending}>
            {pending ? (
                <>
                    <Loader2 className="mr-2 animate-spin" /> Sending...
                </>
            ) : (
                <>
                    <Send className="mr-2" /> Send Message
                </>
            )}
        </Button>
    )
}

export default function ContactUsPage() {
    const { toast } = useToast();
    const [state, formAction] = useActionState(submitContactForm, { error: null, success: false });

    useEffect(() => {
        if (state.error) {
            toast({
                variant: "destructive",
                title: "Submission Failed",
                description: state.error,
            });
        }
        if (state.success) {
             toast({
                title: "Message Sent!",
                description: "Thank you for contacting us. We will get back to you shortly.",
            });
        }
    }, [state, toast]);

    if (state.success) {
        return (
            <div className="flex items-center justify-center rounded-lg border bg-card text-card-foreground shadow-sm p-8 md:p-12 text-center">
                <div className="flex flex-col items-center gap-4">
                    <CheckCircle className="size-16 text-green-500" />
                    <h2 className="text-2xl font-bold">Thank You!</h2>
                    <p className="text-muted-foreground">Your message has been sent successfully.</p>
                    <Button onClick={() => window.location.reload()}>Send Another Message</Button>
                </div>
            </div>
        )
    }

  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
        <div className="grid md:grid-cols-2 items-center">
            {/* Left side: About Us */}
            <div className="p-8 md:p-12 flex flex-col justify-center bg-secondary/30 h-full rounded-l-lg">
                <div className="space-y-6">
                    <div className="flex items-start gap-4">
                         <div className="bg-primary/10 p-3 rounded-full mt-1">
                            <Building className="size-6 text-primary" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold">About Our Society</h3>
                            <p className="text-muted-foreground">
                                Sarisha & Khorda G P Primary School Teachers Co Operative Credit Society LTD
                            </p>
                        </div>
                    </div>
                    <Separator />
                     <div className="flex items-start gap-4">
                         <div className="bg-primary/10 p-3 rounded-full mt-1">
                            <ClipboardList className="size-6 text-primary" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold">Registration Details</h3>
                            <p className="text-muted-foreground">
                                Regd No 11/1994/South 24 Parganas, Date 30/08/1994
                            </p>
                        </div>
                    </div>
                     <Separator />
                     <div className="flex items-start gap-4">
                         <div className="bg-primary/10 p-3 rounded-full mt-1">
                            <Phone className="size-6 text-primary" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold">Contact Number</h3>
                            <p className="text-muted-foreground">
                                Mob No. 9233092709
                            </p>
                        </div>
                    </div>
                </div>
            </div>
            {/* Right side: Form */}
            <div className="p-8 md:p-12">
                 <div className="mb-6">
                    <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <Mail className="size-8" />
                        Have Some Questions?
                    </h2>
                    <p className="text-muted-foreground mt-2">
                        Fill out the form below and we will get back to you as soon as possible.
                    </p>
                </div>
                 <form action={formAction} className="space-y-4">
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="firstName">First Name</Label>
                            <Input id="firstName" name="firstName" placeholder="John" required />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="lastName">Last Name</Label>
                            <Input id="lastName" name="lastName" placeholder="Doe" required />
                        </div>
                     </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">What's your email?</Label>
                        <Input id="email" name="email" type="email" placeholder="john.doe@example.com" required />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="message">Your questions...</Label>
                        <Textarea id="message" name="message" placeholder="Type your message here." required />
                    </div>

                    <SubmitButton />
                </form>
            </div>
        </div>
    </div>
  );
}

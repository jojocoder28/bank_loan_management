
"use client";

import * as React from "react";
import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Send, Loader2, CheckCircle, AlertTriangle } from "lucide-react";
import { submitContactForm } from "./actions";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";


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
            {/* Left side: Illustration */}
            <div className="p-8 md:p-12 flex flex-col items-center justify-center bg-secondary/30 h-full rounded-l-lg">
                <Image 
                    src="https://picsum.photos/600/500"
                    alt="Contact illustration"
                    width={600}
                    height={500}
                    className="max-w-xs md:max-w-sm"
                    data-ai-hint="illustration envelope"
                />
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

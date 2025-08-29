
"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, User, UserRound, Building, Banknote, Shield, Save, AlertTriangle } from "lucide-react";
import { useActionState, useEffect, useState, useRef } from "react";
import { useFormStatus } from "react-dom";
import { updateUserProfile, getProfileForEditing } from "./actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { IUser } from "@/models/user";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";


const initialState = {
    error: null,
    success: null
}

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button className="w-full md:w-auto" type="submit" disabled={pending}>
            {pending ? (
                <>
                    <Loader2 className="mr-2 animate-spin" /> Updating Profile...
                </>
            ) : <> <Save className="mr-2" /> Update Profile </>
            }
        </Button>
    )
}

function FormSkeleton() {
    return (
        <Card className="w-full max-w-4xl">
            <CardHeader>
                <Skeleton className="h-8 w-1/2" />
                <Skeleton className="h-4 w-3/4" />
            </CardHeader>
            <CardContent className="space-y-6">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
            </CardContent>
             <CardFooter>
                <Skeleton className="h-10 w-32" />
            </CardFooter>
        </Card>
    )
}


export default function SettingsPage() {
    const [state, formAction] = useActionState(updateUserProfile, initialState as any);
    const { toast } = useToast();
    const [user, setUser] = useState<IUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
      async function fetchProfile() {
        setIsLoading(true);
        const data = await getProfileForEditing();
        setUser(data);
        if (data?.photoUrl) {
            setPhotoPreview(data.photoUrl);
        }
        setIsLoading(false);
      }
      fetchProfile();
    }, []);

    useEffect(() => {
        if (state?.error) {
            const errorMsg = typeof state.error === 'object' 
                ? Object.values(state.error).flat().join('\n') 
                : state.error;
            toast({
                variant: 'destructive',
                title: 'Update Failed',
                description: errorMsg
            })
        }
        if (state?.success) {
            toast({
                title: 'Success!',
                description: state.success
            })
        }
    }, [state, toast])

    const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhotoPreview(reader.result as string);
            }
            reader.readAsDataURL(file);
        }
    }
    
    if (isLoading) {
        return <FormSkeleton />
    }

    if (!user) {
        return (
             <Card className="w-full max-w-lg">
                <CardHeader>
                    <CardTitle>Error</CardTitle>
                    <CardDescription>Could not load user profile. Please try logging in again.</CardDescription>
                </CardHeader>
            </Card>
        )
    }

    return (
      <div className="flex justify-center items-start">
        <Card className="w-full max-w-4xl">
           <form action={formAction}>
              <CardHeader>
                <CardTitle className="text-2xl">Account Settings</CardTitle>
                <CardDescription>
                  View and update your personal, professional, and nominee information.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">

                {state?.error?.form && (
                    <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Update Failed</AlertTitle>
                        <AlertDescription>{state.error.form}</AlertDescription>
                    </Alert>
                 )}
                 
                 <Accordion type="single" collapsible defaultValue="item-1" className="w-full">
                    <AccordionItem value="item-1">
                        <AccordionTrigger className="text-lg font-semibold"><UserRound className="mr-2" />Personal Details</AccordionTrigger>
                        <AccordionContent className="pt-4">
                             <div className="grid md:grid-cols-2 gap-x-6 gap-y-4">
                               <div className="md:col-span-2 grid gap-4 items-center" style={{gridTemplateColumns: "auto 1fr"}}>
                                    <Avatar className="size-24">
                                        {photoPreview ? (
                                            <AvatarImage src={photoPreview} alt="Profile preview" />
                                        ) : (
                                            <AvatarFallback><User className="size-12"/></AvatarFallback>
                                        )}
                                    </Avatar>
                                    <div className="grid gap-1.5">
                                        <Label htmlFor="photo">Update Profile Photo</Label>
                                        <Input id="photo" name="photo" type="file" accept="image/*" onChange={handlePhotoChange} ref={fileInputRef}/>
                                        <p className="text-xs text-muted-foreground">Recommended: 200x200px. Max 2MB.</p>
                                         {state?.error?.photo && <p className="text-sm text-destructive">{state.error.photo[0]}</p>}
                                    </div>
                                </div>
                                <div className="grid gap-1.5">
                                    <Label htmlFor="name">Full Name</Label>
                                    <Input id="name" name="name" defaultValue={user.name} required />
                                     {state?.error?.name && <p className="text-sm text-destructive">{state.error.name[0]}</p>}
                                </div>
                                 <div className="grid gap-1.5">
                                    <Label htmlFor="phone">Phone Number (cannot be changed)</Label>
                                    <Input id="phone" name="phone" defaultValue={user.phone} disabled />
                                </div>
                                { !user.email && (
                                    <div className="grid gap-1.5">
                                        <Label htmlFor="email">Email Address</Label>
                                        <Input id="email" name="email" type="email" placeholder="e.g. you@example.com" defaultValue={user.email ?? ''} />
                                        {state?.error?.email && <p className="text-sm text-destructive">{state.error.email[0]}</p>}
                                    </div>
                                )}
                                 <div className="grid gap-1.5">
                                    <Label htmlFor="personalAddress">Personal Address</Label>
                                    <Input id="personalAddress" name="personalAddress" defaultValue={user.personalAddress} required />
                                    {state?.error?.personalAddress && <p className="text-sm text-destructive">{state.error.personalAddress[0]}</p>}
                                </div>
                                <div className="grid gap-1.5">
                                    <Label htmlFor="age">Age</Label>
                                    <Input id="age" name="age" type="number" defaultValue={user.age} required />
                                    {state?.error?.age && <p className="text-sm text-destructive">{state.error.age[0]}</p>}
                                </div>
                                <div className="grid gap-1.5">
                                    <Label htmlFor="gender">Gender</Label>
                                    <Select name="gender" defaultValue={user.gender} required>
                                        <SelectTrigger id="gender"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="male">Male</SelectItem>
                                            <SelectItem value="female">Female</SelectItem>
                                            <SelectItem value="other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                     {state?.error?.gender && <p className="text-sm text-destructive">{state.error.gender[0]}</p>}
                                </div>
                             </div>
                        </AccordionContent>
                    </AccordionItem>

                     <AccordionItem value="item-2">
                        <AccordionTrigger className="text-lg font-semibold"><Building className="mr-2"/>Professional & Bank Details</AccordionTrigger>
                        <AccordionContent className="pt-4">
                            <div className="grid md:grid-cols-2 gap-x-6 gap-y-4">
                                <div className="grid gap-1.5">
                                    <Label htmlFor="profession">Profession</Label>
                                    <Input id="profession" name="profession" defaultValue={user.profession} required />
                                     {state?.error?.profession && <p className="text-sm text-destructive">{state.error.profession[0]}</p>}
                                </div>
                                 <div className="grid gap-1.5">
                                    <Label htmlFor="workplace">Workplace</Label>
                                    <Input id="workplace" name="workplace" defaultValue={user.workplace} required />
                                     {state?.error?.workplace && <p className="text-sm text-destructive">{state.error.workplace[0]}</p>}
                                </div>
                                <div className="md:col-span-2 grid gap-1.5">
                                    <Label htmlFor="workplaceAddress">Workplace Address</Label>
                                    <Input id="workplaceAddress" name="workplaceAddress" defaultValue={user.workplaceAddress} required />
                                     {state?.error?.workplaceAddress && <p className="text-sm text-destructive">{state.error.workplaceAddress[0]}</p>}
                                </div>
                                 <div className="md:col-span-2 grid gap-1.5">
                                    <Label htmlFor="bankAccountNumber">Salary Account Number</Label>
                                    <Input id="bankAccountNumber" name="bankAccountNumber" defaultValue={user.bankAccountNumber} required />
                                     {state?.error?.bankAccountNumber && <p className="text-sm text-destructive">{state.error.bankAccountNumber[0]}</p>}
                                </div>
                                 <div className="md:col-span-2 p-3 rounded-md bg-secondary/50 border">
                                    <p className="font-semibold">Bank Name: <span className="font-normal">The West Bengal State Co-Operative Bank Limited</span></p>
                                    <p className="font-semibold">IFSC: <span className="font-normal">WBSC0000016</span></p>
                                 </div>
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                    
                    <AccordionItem value="item-3">
                        <AccordionTrigger className="text-lg font-semibold"><Shield className="mr-2"/>Nominee Details</AccordionTrigger>
                        <AccordionContent className="pt-4">
                             <div className="grid md:grid-cols-3 gap-x-6 gap-y-4">
                                <div className="grid gap-1.5">
                                    <Label htmlFor="nomineeName">Nominee's Full Name</Label>
                                    <Input id="nomineeName" name="nomineeName" defaultValue={user.nomineeName} required />
                                    {state?.error?.nomineeName && <p className="text-sm text-destructive">{state.error.nomineeName[0]}</p>}
                                </div>
                                 <div className="grid gap-1.5">
                                    <Label htmlFor="nomineeRelation">Relation to Nominee</Label>
                                    <Input id="nomineeRelation" name="nomineeRelation" defaultValue={user.nomineeRelation} required />
                                    {state?.error?.nomineeRelation && <p className="text-sm text-destructive">{state.error.nomineeRelation[0]}</p>}
                                </div>
                                 <div className="grid gap-1.5">
                                    <Label htmlFor="nomineeAge">Nominee's Age</Label>
                                    <Input id="nomineeAge" name="nomineeAge" type="number" defaultValue={user.nomineeAge} required />
                                    {state?.error?.nomineeAge && <p className="text-sm text-destructive">{state.error.nomineeAge[0]}</p>}
                                </div>
                            </div>
                        </AccordionContent>
                    </AccordionItem>

                 </Accordion>
              </CardContent>
              <CardFooter className="flex justify-end border-t pt-6">
                  <SubmitButton />
              </CardFooter>
          </form>
        </Card>
      </div>
      );
}

import { getBankSettings } from "../../settings/actions";
import { AnnualDuesClient } from "./_components/annual-dues-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Gift } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function AnnualDuesPage() {
    const bankSettings = await getBankSettings();
    const defaultGfRate = bankSettings?.guaranteedFundInterestRate ?? 4;
    const defaultTfRate = bankSettings?.thriftFundInterestRate ?? 6;
    const currentYear = new Date().getFullYear();

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Gift />
                    Annual Dues Management
                </CardTitle>
                <CardDescription>
                    Calculate and credit annual interest for Thrift and Guaranteed Funds. You can manually adjust the calculated interest values in the preview table before finalizing.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <AnnualDuesClient 
                    defaultGfRate={defaultGfRate} 
                    defaultTfRate={defaultTfRate} 
                    defaultYear={currentYear} 
                />
            </CardContent>
        </Card>
    );
}

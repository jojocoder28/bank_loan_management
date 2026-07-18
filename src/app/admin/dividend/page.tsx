import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DividendReport } from "./_components/dividend-report";
import { Gift } from "lucide-react";
import { getBankSettings } from "../settings/actions";

export const dynamic = 'force-dynamic';

export default async function DividendReportPage() {
  const bankSettings = await getBankSettings();
  const defaultRate = bankSettings?.shareFundDividendRate ?? 12;
  const currentYear = new Date().getFullYear();

  return (
    <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <Gift />
                Share Fund Annual Dividend Management
            </CardTitle>
            <CardDescription>
                Calculate annual dividends for each member based on their share fund balance as of March. The admin can manually adjust the calculated amounts in the preview table before finalizing.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <DividendReport defaultRate={defaultRate} defaultYear={currentYear} />
        </CardContent>
    </Card>
  );
}

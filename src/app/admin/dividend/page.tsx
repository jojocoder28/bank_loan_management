
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getDividendReportData } from "./actions";
import { DividendReport } from "./_components/dividend-report";
import { Gift } from "lucide-react";


export default async function DividendReportPage() {
  const dividendData = await getDividendReportData();

  return (
    <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <Gift />
                Share Fund Annual Dividend Report
            </CardTitle>
            <CardDescription>
                This report calculates the annual dividend for each member based on their share fund balance.
                This is a view-only report and does not automatically apply these changes to member accounts.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <DividendReport data={dividendData} />
        </CardContent>
    </Card>
  );
}

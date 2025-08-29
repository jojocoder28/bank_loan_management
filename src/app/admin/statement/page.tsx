
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getMonthlyStatementData } from "./actions";
import { StatementTable } from "./_components/statement-table";
import { FileText } from "lucide-react";


export default async function StatementPage() {
  const statementData = await getMonthlyStatementData();

  return (
    <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <FileText />
                Monthly Member Statement
            </CardTitle>
            <CardDescription>
                A detailed summary of all expected member deductions for the current month.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <StatementTable data={statementData} />
        </CardContent>
    </Card>
  );
}

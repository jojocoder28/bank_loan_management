
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
  const currentDate = new Date();
  const month = currentDate.toLocaleString('default', { month: 'long' });
  const year = currentDate.getFullYear();


  return (
    <Card>
        <CardHeader>
             <div className="text-center p-4 border rounded-lg">
                <h2 className="text-xl font-bold">Sarisha & Khorda G P Primary School Teachers Co Operative Credit Society LTD</h2>
                <p className="text-sm">Regd No 11/1994/South 24 Parganas, Date 30/08/1994 Mob No. 9233092709</p>
                <p className="font-semibold mt-2">Deduction List for the month of {month}, {year}</p>
             </div>
        </CardHeader>
        <CardContent>
            <StatementTable data={statementData} month={month} year={year} />
        </CardContent>
    </Card>
  );
}

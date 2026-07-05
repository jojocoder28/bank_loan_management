
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { getMonthlyStatementData, getPendingMonths, getLastProcessedMonthInfo } from "./actions";
import { StatementDashboard } from "./_components/statement-dashboard";

export default async function StatementPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }>;
}) {
  const resolvedParams = await searchParams;
  const pendingMonths = await getPendingMonths();
  const { canUndo, lastProcessedLabel } = await getLastProcessedMonthInfo();

  let targetMonth: number;
  let targetYear: number;

  if (resolvedParams.month && resolvedParams.year) {
    targetMonth = Number(resolvedParams.month);
    targetYear = Number(resolvedParams.year);
  } else {
    // Default to the oldest pending month
    targetMonth = pendingMonths[0].month;
    targetYear = pendingMonths[0].year;
  }

  const selectedMonthName = new Date(Date.UTC(targetYear, targetMonth, 1)).toLocaleString('default', { month: 'long', timeZone: 'UTC' });
  const statementData = await getMonthlyStatementData(targetMonth, targetYear);

  return (
    <Card>
        <CardHeader>
             <div className="text-center p-4 border rounded-lg">
                <h2 className="text-xl font-bold">Sarisha & Khorda G P Primary School Teachers Co Operative Credit Society LTD</h2>
                <p className="text-sm">Regd No 11/1994/South 24 Parganas, Date 30/08/1994 Mob No. 9233092709</p>
                <p className="font-semibold mt-2">Deduction List for the month of {selectedMonthName}, {targetYear}</p>
             </div>
        </CardHeader>
        <CardContent className="pt-6">
            <StatementDashboard
              initialData={statementData}
              pendingMonths={pendingMonths}
              selectedMonth={targetMonth}
              selectedYear={targetYear}
              monthName={selectedMonthName}
              canUndo={canUndo}
              lastProcessedLabel={lastProcessedLabel}
            />
        </CardContent>
    </Card>
  );
}

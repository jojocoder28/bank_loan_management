
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ILoan } from "@/models/loan";
import { Download, Loader2 } from "lucide-react";
import { calculateMonthlyInterest } from "@/lib/coop-calculations";

interface ScheduleRow {
    month: number;
    openingBalance: number;
    interestPayment: number;
    principalPayment: number;
    totalPayment: number;
    closingBalance: number;
}

export function LoanWalkthrough({ loan }: { loan: ILoan }) {
    const [isGenerating, setIsGenerating] = useState(false);

    const generateSchedule = (): ScheduleRow[] => {
        const schedule: ScheduleRow[] = [];
        let currentPrincipal = loan.loanAmount;
        let month = 1;

        while (currentPrincipal > 0) {
            const interestPayment = calculateMonthlyInterest(currentPrincipal, loan.interestRate);
            const principalPayment = Math.min(currentPrincipal, loan.monthlyPrincipalPayment);
            const totalPayment = interestPayment + principalPayment;
            const closingBalance = currentPrincipal - principalPayment;

            schedule.push({
                month,
                openingBalance: currentPrincipal,
                interestPayment,
                principalPayment,
                totalPayment,
                closingBalance
            });
            
            currentPrincipal = closingBalance;
            month++;
            
            // Safety break to prevent infinite loops in case of bad data
            if (month > 1200) {
                 console.error("Loan schedule generation exceeded 100 years, breaking.");
                 break;
            }
        }
        return schedule;
    }
    
    const downloadCSV = () => {
        setIsGenerating(true);
        try {
            const schedule = generateSchedule();
            
            const headers = [
                "Month",
                "Opening Balance",
                "Principal Payment",
                "Interest Payment",
                "Total Monthly Payment",
                "Closing Balance"
            ];

            const totalLoanAmount = `Total Loan Amount,${loan.loanAmount.toFixed(2)}`;
            const totalInterest = `Total Interest Paid,${schedule.reduce((acc, row) => acc + row.interestPayment, 0).toFixed(2)}`;
            const totalPaid = `Total Amount Paid,${schedule.reduce((acc, row) => acc + row.totalPayment, 0).toFixed(2)}`;
            
            const summary = [totalLoanAmount, totalInterest, totalPaid].join("\n");

            const csvRows = schedule.map(row => 
                [
                    row.month,
                    row.openingBalance.toFixed(2),
                    row.principalPayment.toFixed(2),
                    row.interestPayment.toFixed(2),
                    row.totalPayment.toFixed(2),
                    row.closingBalance.toFixed(2)
                ].join(',')
            );
            
            const csvContent = "data:text/csv;charset=utf-8," 
                + summary + "\n\n"
                + headers.join(',') + "\n"
                + csvRows.join('\n');
            
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", `loan_walkthrough_${loan._id}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } finally {
            setIsGenerating(false);
        }
    }

    return (
        <Button onClick={downloadCSV} disabled={isGenerating} size="sm" variant="outline">
            {isGenerating ? (
                <Loader2 className="mr-2 animate-spin" />
            ) : (
                <Download className="mr-2" />
            )}
            Download
        </Button>
    )
}

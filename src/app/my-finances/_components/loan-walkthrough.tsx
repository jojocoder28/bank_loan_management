
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ILoan } from "@/models/loan";
import { Download, Loader2 } from "lucide-react";
import { calculateMonthlyInterest } from "@/lib/coop-calculations";

interface ScheduleRow {
    month: number;
    year: number;
    openingBalance: number;
    interestPayment: number;
    principalPayment: number;
    totalPayment: number;
    closingBalance: number;
    notes: string;
}

export function LoanWalkthrough({ loan }: { loan: ILoan }) {
    const [isGenerating, setIsGenerating] = useState(false);

    const generateSchedule = (): ScheduleRow[] => {
        const schedule: ScheduleRow[] = [];
        let currentPrincipal = loan.loanAmount;
        let currentDate = new Date(loan.issueDate || new Date());
        
        // Sort approved modifications by date
        const approvedAmountIncreases = [...loan.modificationRequests]
            .filter(r => r.type === 'increase_amount' && r.status === 'approved' && r.approvalDate)
            .sort((a, b) => new Date(a.approvalDate!).getTime() - new Date(b.approvalDate!).getTime());
            
        const approvedPaymentChanges = [...loan.modificationRequests]
            .filter(r => r.type === 'change_payment' && r.status === 'approved' && r.effectiveYear !== undefined && r.effectiveMonth !== undefined)
            .sort((a,b) => (a.effectiveYear!*12 + a.effectiveMonth!) - (b.effectiveYear!*12 + b.effectiveMonth!));

        let monthCounter = 1;

        while (currentPrincipal > 0) {
            let notes = "";
            let month = currentDate.getMonth();
            let year = currentDate.getFullYear();
            
            // Check for amount increases in the current month
            for (const increase of approvedAmountIncreases) {
                const approvalDate = new Date(increase.approvalDate!);
                if (approvalDate.getFullYear() === year && approvalDate.getMonth() === month) {
                     currentPrincipal += increase.requestedValue;
                     notes += `Loan increased by ₹${increase.requestedValue.toLocaleString()}. `;
                }
            }
            
            // Determine principal payment for the current month
            let principalPayment = loan.monthlyPrincipalPayment;
            const paymentChange = approvedPaymentChanges.find(c => c.effectiveYear === year && c.effectiveMonth === month);
            if (paymentChange) {
                principalPayment = paymentChange.requestedValue;
                notes += `Monthly payment for this month changed to ₹${principalPayment.toLocaleString()}. `;
            }

            const interestPayment = calculateMonthlyInterest(currentPrincipal, loan.interestRate);
            const actualPrincipalPayment = Math.min(currentPrincipal, principalPayment);
            const totalPayment = interestPayment + actualPrincipalPayment;
            const closingBalance = currentPrincipal - actualPrincipalPayment;

            schedule.push({
                month: month + 1,
                year: year,
                openingBalance: currentPrincipal,
                interestPayment,
                principalPayment: actualPrincipalPayment,
                totalPayment,
                closingBalance,
                notes: notes.trim()
            });
            
            currentPrincipal = closingBalance;
            currentDate.setMonth(currentDate.getMonth() + 1);
            
            monthCounter++;
            if (monthCounter > 1200) { // Safety break after 100 years
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
                "Year",
                "Opening Balance",
                "Principal Payment",
                "Interest Payment",
                "Total Monthly Payment",
                "Closing Balance",
                "Notes"
            ];
            
            const csvRows = schedule.map(row => 
                [
                    row.month,
                    row.year,
                    row.openingBalance.toFixed(2),
                    row.principalPayment.toFixed(2),
                    row.interestPayment.toFixed(2),
                    row.totalPayment.toFixed(2),
                    row.closingBalance.toFixed(2),
                    `"${row.notes.replace(/"/g, '""')}"` // Escape quotes
                ].join(',')
            );
            
            const csvContent = "data:text/csv;charset=utf-8," 
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

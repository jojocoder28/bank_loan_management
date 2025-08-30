
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { StatementRow, StatementSummary } from "../actions";
import { numberToWords } from "@/lib/number-to-words";

// Extend the jsPDF interface to include the autoTable method
declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

const mainHeader = `SARISHA & KHORDA G P PRIMARY SCHOOL TEACHERS CO OPERATIVE CREDIT SOCIETY LTD`;
const subHeader = `Regd No 11/1994/South 24 Parganas, Date 30/09/1994 Mob No. 9233092709`;
const tableHeaders = [`Sl. No`, `Name`, `S.B. A/C No`, `Bank Loan Prin`, `Bank Loan Int.`, `OWN LOAN Prin.`, `OWN LOAN Int.`, `S F`, `T.F`, `Total`];


export function StatementPDFGenerator({ data, summary, month, year }: { data: StatementRow[], summary: StatementSummary, month: string, year: number }) {
    const [isDownloading, setIsDownloading] = useState(false);

    const generatePdf = () => {
        setIsDownloading(true);
        try {
            const doc = new jsPDF();
            const totalInWords = numberToWords(summary.grandTotal);
            const depositText = `Please deposit the amount Rs. ${summary.grandTotal.toLocaleString()} (Rupees ${totalInWords} only) to the SBCS Number 129342134828 of the society and oblige.`;

            // --- 1. Summary Sheet ---
            doc.setFontSize(10);
            doc.setFont("helvetica", "bold");
            doc.text(mainHeader, doc.internal.pageSize.getWidth() / 2, 20, { align: "center" });

            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            doc.text(subHeader, doc.internal.pageSize.getWidth() / 2, 28, { align: "center" });

            doc.setFontSize(12);
            doc.setFont("helvetica", "bold");
            doc.text(`Summary for the month of ${month}, ${year}`, doc.internal.pageSize.getWidth() / 2, 40, { align: "center" });

            doc.autoTable({
                startY: 50,
                head: [['Category', 'Amount (Rs.)']],
                body: [
                    ["Thrift Fund(TF)", summary.totalThrift.toLocaleString()],
                    ["Share Fund(SF)", summary.totalShare.toLocaleString()],
                    ["Own Loan Principal", summary.totalLoanPrincipal.toLocaleString()],
                    ["Own Loan Interest", summary.totalLoanInterest.toLocaleString()],
                ],
                foot: [['Total Deduction', summary.grandTotal.toLocaleString()]],
                theme: 'grid',
                headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], fontStyle: 'bold' },
                footStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], fontStyle: 'bold' },
                margin: { horizontal: 'auto' },
            });
            
            const summaryFinalY = (doc as any).lastAutoTable.finalY;
            doc.setFontSize(10);
            doc.text(depositText, 14, summaryFinalY + 10, { maxWidth: 180 });
            
            // --- 2. Deduction List Sheets ---
            const recordsPerPage = 42;
            const numPages = Math.ceil(data.length / recordsPerPage);

            for (let i = 0; i < numPages; i++) {
                const start = i * recordsPerPage;
                const end = start + recordsPerPage;
                const pageData = data.slice(start, end);

                doc.addPage();
                doc.setFontSize(10);
                doc.setFont("helvetica", "bold");
                doc.text(mainHeader, doc.internal.pageSize.getWidth() / 2, 20, { align: "center" });
                doc.setFontSize(10);
                doc.setFont("helvetica", "normal");
                doc.text(subHeader, doc.internal.pageSize.getWidth() / 2, 28, { align: "center" });
                doc.setFontSize(12);
                doc.setFont("helvetica", "bold");
                doc.text(`Deduction List for the month of ${month}, ${year} (Page ${i + 1})`, doc.internal.pageSize.getWidth() / 2, 40, { align: "center" });

                const body = pageData.map(row => [
                    row.slNo,
                    row.name,
                    row.bankAccountNumber,
                    '', // Bank Loan Prin
                    '', // Bank Loan Int
                    row.loanPrincipalPayment,
                    row.loanInterestPayment,
                    row.shareFundContribution,
                    row.thriftFundContribution,
                    row.totalDeduction,
                ]);
                
                const pageTotal = body.reduce((acc, row) => {
                    acc[5] += row[5] as number;
                    acc[6] += row[6] as number;
                    acc[7] += row[7] as number;
                    acc[8] += row[8] as number;
                    acc[9] += row[9] as number;
                    return acc;
                }, [0,0,0,0,0,0,0,0,0,0]);
                
                const footer = [['', 'Page Total', '', '', '', pageTotal[5], pageTotal[6], pageTotal[7], pageTotal[8], pageTotal[9]]];

                doc.autoTable({
                    startY: 50,
                    head: [tableHeaders],
                    body: body,
                    foot: footer,
                    theme: 'grid',
                    headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], fontStyle: 'bold', halign: 'center', fontSize: 8 },
                    footStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], fontStyle: 'bold', fontSize: 8 },
                    styles: { fontSize: 8, lineColor: [0, 0, 0], lineWidth: 0.1 },
                    margin: { horizontal: 'auto' },
                    columnStyles: {
                        0: { halign: 'center', cellWidth: 10 },
                        1: { cellWidth: 30 },
                        2: { halign: 'center', cellWidth: 25 },
                        3: { halign: 'right', cellWidth: 15 },
                        4: { halign: 'right', cellWidth: 15 },
                        5: { halign: 'right', cellWidth: 15 },
                        6: { halign: 'right', cellWidth: 15 },
                        7: { halign: 'right', cellWidth: 10 },
                        8: { halign: 'right', cellWidth: 10 },
                        9: { halign: 'right', fontStyle: 'bold', cellWidth: 20 },
                    }
                });
            }

            doc.save(`monthly_statement_${month}_${year}.pdf`);

        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <Button onClick={generatePdf} disabled={isDownloading} variant="outline">
            {isDownloading ? (
                <Loader2 className="mr-2 animate-spin" />
            ) : (
                <Download className="mr-2" />
            )}
            Download PDF
        </Button>
    );
}

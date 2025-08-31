
"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { DividendReportRow } from "../actions";
import { useState } from "react";
import Link from "next/link";
import { ScrollArea } from "@/components/ui/scroll-area";

export function DividendReport({ data }: { data: DividendReportRow[] }) {
    const [isDownloading, setIsDownloading] = useState(false);

    const totals = data.reduce((acc, row) => {
        acc.shareFund += row.shareFund;
        acc.dividendAmount += row.dividendAmount;
        acc.finalShareFund += row.finalShareFund;
        return acc;
    }, { shareFund: 0, dividendAmount: 0, finalShareFund: 0 });

    const downloadCSV = () => {
        setIsDownloading(true);
        try {
            const headers = [
                "Name",
                "Membership #",
                "Current Share Fund",
                "Dividend Rate (%)",
                "Dividend Amount",
                "Final Share Fund"
            ];
            
            const csvRows = data.map(row => 
                [
                    `"${row.name.replace(/"/g, '""')}"`,
                    row.membershipNumber,
                    row.shareFund,
                    row.dividendRate,
                    row.dividendAmount, // Use the raw number for CSV
                    row.finalShareFund // Use the raw number for CSV
                ].join(',')
            );
            
            const csvContent = "data:text/csv;charset=utf-8," 
                + headers.join(',') + "\n"
                + csvRows.join('\n');
            
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", `share_fund_dividend_report.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

        } finally {
             setIsDownloading(false);
        }
    }

  return (
    <div className="space-y-4">
        <div className="flex justify-end">
             <Button onClick={downloadCSV} disabled={isDownloading}>
                {isDownloading ? (
                    <Loader2 className="mr-2 animate-spin" />
                ) : (
                    <Download className="mr-2" />
                )}
                Download CSV
            </Button>
        </div>
      <ScrollArea className="h-[65vh] border rounded-md">
      <Table>
        <TableHeader className="sticky top-0 bg-secondary">
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Membership #</TableHead>
            <TableHead className="text-right">Current Share Fund</TableHead>
            <TableHead className="text-right">Dividend Rate (%)</TableHead>
            <TableHead className="text-right">Dividend Amount</TableHead>
            <TableHead className="text-right font-bold">Final Share Fund</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row) => (
            <TableRow key={row.memberId}>
              <TableCell className="font-medium">
                <Link href={`/admin/users/${row.memberId}`} className="text-primary hover:underline">
                    {row.name}
                </Link>
              </TableCell>
              <TableCell>{row.membershipNumber}</TableCell>
              <TableCell className="text-right">₹{row.shareFund.toLocaleString()}</TableCell>
              <TableCell className="text-right">{row.dividendRate}%</TableCell>
              <TableCell className="text-right text-green-500 font-medium">₹{row.dividendAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
              <TableCell className="text-right font-bold">₹{row.finalShareFund.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter className="sticky bottom-0 bg-secondary">
            <TableRow className="font-bold text-base">
                <TableCell colSpan={2}>Totals</TableCell>
                <TableCell className="text-right">₹{totals.shareFund.toLocaleString()}</TableCell>
                <TableCell></TableCell>
                <TableCell className="text-right">₹{totals.dividendAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                <TableCell className="text-right">₹{totals.finalShareFund.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
            </TableRow>
        </TableFooter>
      </Table>
      </ScrollArea>
    </div>
  );
}

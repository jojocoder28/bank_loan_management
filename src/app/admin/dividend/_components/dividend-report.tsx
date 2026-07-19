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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, Loader2, Play, AlertTriangle, Search, Check, RefreshCw, X } from "lucide-react";
import { DividendReportRow, getDividendReportData, applyAnnualDividends } from "../actions";
import { useState, useTransition } from "react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DividendReportProps {
    defaultRate: number;
    defaultYear: number;
    /** ISO date string of the last dividend process run, or null */
    lastDividendProcess: string | null;
}

export function DividendReport({ defaultRate, defaultYear, lastDividendProcess }: DividendReportProps) {
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    // Derive which year dividends were last processed
    const lastProcessedYear = lastDividendProcess ? new Date(lastDividendProcess).getFullYear() : null;

    // Setup input state
    const [rate, setRate] = useState(defaultRate.toString());
    const [year, setYear] = useState(defaultYear.toString());

    // Track locally if this session just processed a year
    const [sessionProcessedYear, setSessionProcessedYear] = useState<number | null>(null);

    // Preview table state
    const [previewRows, setPreviewRows] = useState<DividendReportRow[] | null>(null);
    const [editedAmounts, setEditedAmounts] = useState<Record<string, number>>({});
    const [searchQuery, setSearchQuery] = useState("");

    // Confirmation dialog state
    const [showConfirm, setShowConfirm] = useState(false);

    // Fetch and calculate preview
    const handleGeneratePreview = (e: React.FormEvent) => {
        e.preventDefault();
        const numRate = Number(rate);
        const numYear = Number(year);

        if (isNaN(numRate) || numRate <= 0) {
            toast({
                variant: "destructive",
                title: "Invalid Rate",
                description: "Please enter a positive dividend rate percentage."
            });
            return;
        }

        if (isNaN(numYear) || numYear < 2000 || numYear > 2100) {
            toast({
                variant: "destructive",
                title: "Invalid Year",
                description: "Please enter a valid year."
            });
            return;
        }

        startTransition(async () => {
            try {
                const data = await getDividendReportData(numRate, numYear);
                setPreviewRows(data);
                
                // Initialize edited amounts map with calculated values
                const initialEdits: Record<string, number> = {};
                for (const row of data) {
                    initialEdits[row.memberId] = row.dividendAmount;
                }
                setEditedAmounts(initialEdits);

                toast({
                    title: "Preview Generated",
                    description: `Successfully loaded calculations for ${data.length} members as of March ${numYear}.`
                });
            } catch (err: any) {
                toast({
                    variant: "destructive",
                    title: "Error Generating Preview",
                    description: err.message || "Failed to load dividend data."
                });
            }
        });
    };

    // Handle manual adjustment of dividend amount for a specific member
    const handleAmountChange = (memberId: string, val: string) => {
        const numVal = Number(val);
        setEditedAmounts(prev => ({
            ...prev,
            [memberId]: isNaN(numVal) || numVal < 0 ? 0 : numVal
        }));
    };

    // Filter preview rows by search query
    const filteredRows = previewRows?.filter(row => 
        row.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        row.membershipNumber.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

    // Calculate totals of current preview
    const totalShareFund = previewRows?.reduce((sum, row) => sum + row.shareFund, 0) || 0;
    const totalCalculatedDividend = previewRows?.reduce((sum, row) => sum + row.dividendAmount, 0) || 0;
    const totalAdjustedDividend = previewRows?.reduce((sum, row) => sum + (editedAmounts[row.memberId] ?? 0), 0) || 0;

    // Handle finalize
    const handleFinalize = () => {
        if (!previewRows) return;

        const finalizedList = previewRows.map(row => ({
            memberId: row.memberId,
            dividendAmount: editedAmounts[row.memberId] ?? 0
        }));

        startTransition(async () => {
            try {
                const res = await applyAnnualDividends(Number(rate), Number(year), finalizedList);
                if (res.success) {
                    toast({
                        title: "Yearly Dividends Applied!",
                        description: `Successfully credited annual dividends to the dividend funds of ${finalizedList.length} members.`
                    });
                    setPreviewRows(null);
                    setEditedAmounts({});
                    setSearchQuery("");
                    setShowConfirm(false);
                    setSessionProcessedYear(Number(year)); // Lock the screen
                } else {
                    toast({
                        variant: "destructive",
                        title: "Application Failed",
                        description: res.error || "Failed to apply dividends."
                    });
                    setShowConfirm(false);
                }
            } catch (err: any) {
                toast({
                    variant: "destructive",
                    title: "Unexpected Error",
                    description: err.message || "An unexpected error occurred."
                });
            }
        });
    };

    // Determine if the currently selected year is already processed
    const numYear = Number(year);
    const isAlreadyProcessed = numYear === lastProcessedYear || numYear === sessionProcessedYear;

    // Download CSV of preview
    const downloadPreviewCSV = () => {
        if (!previewRows) return;
        try {
            const headers = [
                "Name",
                "Membership #",
                "Share Fund Balance (March)",
                "Dividend Rate (%)",
                "Dividend Amount (Calculated)",
                "Dividend Amount (Final Adjusted)"
            ];
            
            let sumShareFund = 0;
            let sumCalculatedDividend = 0;
            let sumAdjustedDividend = 0;

            const csvRows = previewRows.map(row => {
                const adjAmount = editedAmounts[row.memberId] ?? 0;
                sumShareFund += row.shareFund;
                sumCalculatedDividend += row.dividendAmount;
                sumAdjustedDividend += adjAmount;

                return [
                    `"${row.name.replace(/"/g, '""')}"`,
                    row.membershipNumber,
                    row.shareFund,
                    row.dividendRate,
                    row.dividendAmount,
                    adjAmount
                ].join(',');
            });

            // Column-wise totals row
            const totalsRow = [
                `"Total"`,
                `""`,
                sumShareFund,
                `""`,
                sumCalculatedDividend,
                sumAdjustedDividend
            ].join(',');
            
            const csvContent = [headers.join(','), ...csvRows, totalsRow].join('\n');
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement("a");
            link.setAttribute("href", url);
            link.setAttribute("download", `share_fund_dividend_preview_${year}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (e: any) {
            toast({ variant: "destructive", title: "Download failed", description: e.message });
        }
    };

    return (
        <div className="space-y-6">
            {/* --- ALREADY PROCESSED STATE --- */}
            {isAlreadyProcessed && previewRows === null && (
                <div className="max-w-xl mx-auto flex flex-col items-center justify-center gap-4 p-8 border border-green-500/30 bg-green-500/10 rounded-xl text-center">
                    <div className="size-14 rounded-full bg-green-500/20 flex items-center justify-center">
                        <Check className="size-8 text-green-600" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-green-700 dark:text-green-400">Dividends Already Processed</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                            Annual share fund dividends for <strong>March {numYear}</strong> have already been applied.
                            {lastDividendProcess && (
                                <> Processed on: <strong>{new Date(lastDividendProcess).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</strong>.</>
                            )}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                            To process dividends for a different year, change the year selection below.
                        </p>
                    </div>
                    <form onSubmit={(e) => { e.preventDefault(); }} className="flex items-center gap-3 mt-2">
                        <label className="text-sm font-medium" htmlFor="year-switch">Change Year:</label>
                        <select
                            id="year-switch"
                            value={year}
                            onChange={(e) => setYear(e.target.value)}
                            className="flex h-9 rounded-md border border-input bg-background px-3 py-1.5 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
                        >
                            {Array.from({ length: 6 }).map((_, idx) => {
                                const yr = new Date().getFullYear() - 3 + idx;
                                return <option key={yr} value={yr}>March {yr}</option>;
                            })}
                        </select>
                    </form>
                </div>
            )}

            {/* --- INITIAL CALCULATION FORM (only when not already processed) --- */}
            {!isAlreadyProcessed && previewRows === null && (
                <Card className="max-w-xl mx-auto">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Play className="size-5 text-primary" />
                            Calculate Yearly Dividends
                        </CardTitle>
                        <CardDescription>
                            Generate a preview of the annual share fund dividends. The calculations are based on the members' share fund balances as of March of the selected year.
                        </CardDescription>
                    </CardHeader>
                    <form onSubmit={handleGeneratePreview}>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="rate">Dividend Rate (%)</Label>
                                    <Input
                                        id="rate"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        placeholder="e.g. 12"
                                        value={rate}
                                        onChange={(e) => setRate(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="year">Target March Year</Label>
                                    <select
                                        id="year"
                                        value={year}
                                        onChange={(e) => setYear(e.target.value)}
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 cursor-pointer text-foreground"
                                    >
                                        {Array.from({ length: 6 }).map((_, idx) => {
                                            const yr = new Date().getFullYear() - 3 + idx;
                                            return (
                                                <option key={yr} value={yr}>
                                                    March {yr}
                                                </option>
                                            );
                                        })}
                                    </select>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-end">
                            <Button type="submit" disabled={isPending}>
                                {isPending ? (
                                    <>
                                        <Loader2 className="mr-2 size-4 animate-spin" />
                                        Calculating...
                                    </>
                                ) : (
                                    "Calculate & Preview Dues"
                                )}
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            )}

            {/* --- INTERACTIVE PREVIEW PANEL --- */}
            {previewRows !== null && (
                <div className="space-y-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-muted/30 p-4 rounded-lg border">
                        <div>
                            <h3 className="font-bold text-lg">Yearly Dividend Preview (March {year})</h3>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Rate: {rate}% | Adjust amounts below if needed. Hover over any amount to edit.
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={downloadPreviewCSV}>
                                <Download className="size-4 mr-1.5" /> Download Preview CSV
                            </Button>
                            <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10" onClick={() => setPreviewRows(null)}>
                                <X className="size-4 mr-1.5" /> Cancel Preview
                            </Button>
                            <Button variant="default" size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => setShowConfirm(true)}>
                                <Check className="size-4 mr-1.5" /> Approve & Apply Dividends
                            </Button>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 max-w-sm">
                        <Search className="size-4 text-muted-foreground" />
                        <Input
                            placeholder="Filter members..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="h-9"
                        />
                    </div>

                    <div className="border rounded-md max-h-[55vh] overflow-y-auto">
                        <Table>
                            <TableHeader className="sticky top-0 bg-background border-b z-10">
                                <TableRow>
                                    <TableHead>Sl. No</TableHead>
                                    <TableHead>Member Name</TableHead>
                                    <TableHead>Membership #</TableHead>
                                    <TableHead className="text-right">Share Fund Balance (March)</TableHead>
                                    <TableHead className="text-right">Rate</TableHead>
                                    <TableHead className="text-right w-[180px]">Dividend Amount (₹)</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredRows.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                            No members matched your search.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredRows.map((row, index) => (
                                        <TableRow key={row.memberId}>
                                            <TableCell className="text-xs text-muted-foreground">{index + 1}</TableCell>
                                            <TableCell className="font-semibold">{row.name}</TableCell>
                                            <TableCell>{row.membershipNumber}</TableCell>
                                            <TableCell className="text-right">₹{row.shareFund.toLocaleString()}</TableCell>
                                            <TableCell className="text-right">{rate}%</TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end items-center gap-1.5">
                                                    <Input
                                                        type="number"
                                                        value={editedAmounts[row.memberId] ?? 0}
                                                        onChange={(e) => handleAmountChange(row.memberId, e.target.value)}
                                                        className="h-8 w-28 text-right font-medium pr-1.5"
                                                        min="0"
                                                    />
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                            <TableFooter className="sticky bottom-0 bg-background border-t z-10 font-bold">
                                <TableRow>
                                    <TableCell colSpan={3}>Totals</TableCell>
                                    <TableCell className="text-right">₹{totalShareFund.toLocaleString()}</TableCell>
                                    <TableCell className="text-right"></TableCell>
                                    <TableCell className="text-right text-green-600 font-bold text-sm">
                                        ₹{totalAdjustedDividend.toLocaleString()}
                                    </TableCell>
                                </TableRow>
                            </TableFooter>
                        </Table>
                    </div>

                    {totalAdjustedDividend !== totalCalculatedDividend && (
                        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-start gap-2.5 max-w-2xl text-xs text-amber-700 dark:text-amber-400">
                            <AlertTriangle className="size-4 text-amber-600 shrink-0 mt-0.5" />
                            <div>
                                <p className="font-bold">Manual Adjustments Detected</p>
                                <p className="mt-0.5">
                                    The adjusted total dividend amount (₹{totalAdjustedDividend.toLocaleString()}) differs from the auto-calculated amount (₹{totalCalculatedDividend.toLocaleString()}). The manually entered values will be credited to user accounts upon approval.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* --- FINAL APPROVE ALERT DIALOG --- */}
            <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-green-600">
                            <AlertTriangle className="size-5" />
                            Approve & Finalize Yearly Dividend?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="space-y-3 mt-2 text-foreground/90">
                            <p>
                                Are you sure you want to finalize and apply the share fund dividends for the year <strong>{year}</strong>?
                            </p>
                            <div className="p-3.5 bg-muted rounded-lg space-y-1.5 text-xs text-muted-foreground">
                                <div className="flex justify-between">
                                    <span>Target Period:</span>
                                    <span className="font-semibold text-foreground">March {year}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Dividend Rate:</span>
                                    <span className="font-semibold text-foreground">{rate}%</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Total Share Fund (March):</span>
                                    <span className="font-semibold text-foreground">₹{totalShareFund.toLocaleString()}</span>
                                </div>
                                <div className="border-t pt-1.5 flex justify-between font-bold text-sm text-foreground">
                                    <span>Total Dividend Credited:</span>
                                    <span className="text-green-600 font-bold">₹{totalAdjustedDividend.toLocaleString()}</span>
                                </div>
                            </div>
                            <p className="text-xs text-muted-foreground italic">
                                This action will add the finalized dividend amounts directly to each active member's <strong>Dividend Fund</strong>. This process can only be run once per financial year and cannot be reverted.
                            </p>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setShowConfirm(false)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction asChild>
                            <Button variant="default" className="bg-green-600 hover:bg-green-700" onClick={handleFinalize} disabled={isPending}>
                                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Approve & Credit Accounts
                            </Button>
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

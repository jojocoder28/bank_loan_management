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
import { Download, Loader2, Play, AlertTriangle, Search, Check, X } from "lucide-react";
import { AnnualDuesPreviewRow, getAnnualDuesPreviewData, applyAnnualDues } from "../../actions";
import { useState, useTransition } from "react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
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

interface AnnualDuesClientProps {
    defaultGfRate: number;
    defaultTfRate: number;
    defaultYear: number;
}

export function AnnualDuesClient({ defaultGfRate, defaultTfRate, defaultYear }: AnnualDuesClientProps) {
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();
    const router = useRouter();

    // Setup input state
    const [gfRate, setGfRate] = useState(defaultGfRate.toString());
    const [tfRate, setTfRate] = useState(defaultTfRate.toString());
    const [year, setYear] = useState(defaultYear.toString());

    // Preview table state
    const [previewRows, setPreviewRows] = useState<AnnualDuesPreviewRow[] | null>(null);
    const [editedGfAmounts, setEditedGfAmounts] = useState<Record<string, number>>({});
    const [editedTfAmounts, setEditedTfAmounts] = useState<Record<string, number>>({});
    const [searchQuery, setSearchQuery] = useState("");

    // Confirmation dialog state
    const [showConfirm, setShowConfirm] = useState(false);

    // Fetch and calculate preview
    const handleGeneratePreview = (e: React.FormEvent) => {
        e.preventDefault();
        const numGfRate = Number(gfRate);
        const numTfRate = Number(tfRate);
        const numYear = Number(year);

        if (isNaN(numGfRate) || numGfRate < 0 || isNaN(numTfRate) || numTfRate < 0) {
            toast({
                variant: "destructive",
                title: "Invalid Rates",
                description: "Please enter positive interest rate percentages."
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
                const data = await getAnnualDuesPreviewData(numGfRate, numTfRate, numYear);
                setPreviewRows(data);
                
                // Initialize edited amounts maps with calculated values
                const initialGfEdits: Record<string, number> = {};
                const initialTfEdits: Record<string, number> = {};
                for (const row of data) {
                    initialGfEdits[row.memberId] = row.gfInterest;
                    initialTfEdits[row.memberId] = row.tfInterest;
                }
                setEditedGfAmounts(initialGfEdits);
                setEditedTfAmounts(initialTfEdits);

                toast({
                    title: "Preview Generated",
                    description: `Successfully computed GF & TF interest for ${data.length} active members.`
                });
            } catch (err: any) {
                toast({
                    variant: "destructive",
                    title: "Error Generating Preview",
                    description: err.message || "Failed to load annual dues calculation."
                });
            }
        });
    };

    // Handle manual adjustment of GF or TF amount
    const handleGfAmountChange = (memberId: string, val: string) => {
        const numVal = Number(val);
        setEditedGfAmounts(prev => ({
            ...prev,
            [memberId]: isNaN(numVal) || numVal < 0 ? 0 : numVal
        }));
    };

    const handleTfAmountChange = (memberId: string, val: string) => {
        const numVal = Number(val);
        setEditedTfAmounts(prev => ({
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
    const totalGfBalance = previewRows?.reduce((sum, row) => sum + row.gfBalance, 0) || 0;
    const totalTfBalance = previewRows?.reduce((sum, row) => sum + row.tfBalance, 0) || 0;
    const totalGfInterest = previewRows?.reduce((sum, row) => sum + (editedGfAmounts[row.memberId] ?? 0), 0) || 0;
    const totalTfInterest = previewRows?.reduce((sum, row) => sum + (editedTfAmounts[row.memberId] ?? 0), 0) || 0;
    const grandTotalInterest = totalGfInterest + totalTfInterest;

    // Handle finalize
    const handleFinalize = () => {
        if (!previewRows) return;

        const finalizedList = previewRows.map(row => ({
            memberId: row.memberId,
            gfInterest: editedGfAmounts[row.memberId] ?? 0,
            tfInterest: editedTfAmounts[row.memberId] ?? 0
        }));

        startTransition(async () => {
            try {
                const res = await applyAnnualDues(Number(year), Number(gfRate), Number(tfRate), finalizedList);
                if (res.success) {
                    toast({
                        title: "Annual Dues Finalized!",
                        description: `Successfully credited TF & GF interest to ${finalizedList.length} members for ${year}.`
                    });
                    setPreviewRows(null);
                    setEditedGfAmounts({});
                    setEditedTfAmounts({});
                    setSearchQuery("");
                    setShowConfirm(false);
                    router.push("/admin/statement");
                } else {
                    toast({
                        variant: "destructive",
                        title: "Execution Failed",
                        description: res.error || "Failed to finalize annual dues."
                    });
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

    // Download CSV of preview
    const downloadPreviewCSV = () => {
        if (!previewRows) return;
        try {
            const headers = [
                "Name",
                "Membership #",
                "GF Balance",
                "GF Interest (Adjusted)",
                "TF Balance",
                "TF Interest (Adjusted)",
                "Total Interest"
            ];
            
            const csvRows = previewRows.map(row => {
                const gfInt = editedGfAmounts[row.memberId] ?? 0;
                const tfInt = editedTfAmounts[row.memberId] ?? 0;
                return [
                    `"${row.name.replace(/"/g, '""')}"`,
                    row.membershipNumber,
                    row.gfBalance,
                    gfInt,
                    row.tfBalance,
                    tfInt,
                    gfInt + tfInt
                ].join(',');
            });
            
            const csvContent = [headers.join(','), ...csvRows].join('\n');
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement("a");
            link.setAttribute("href", url);
            link.setAttribute("download", `annual_dues_preview_${year}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (e: any) {
            toast({ variant: "destructive", title: "Download failed", description: e.message });
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* --- INITIAL CALCULATION FORM --- */}
            {previewRows === null && (
                <Card className="max-w-xl mx-auto">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Play className="size-5 text-primary" />
                            Calculate Yearly Interest
                        </CardTitle>
                        <CardDescription>
                            Enter rates to calculate annual interest. GF and TF balances are automatically computed as of March of the selected year by subtracting post-March contributions and top-ups.
                        </CardDescription>
                    </CardHeader>
                    <form onSubmit={handleGeneratePreview}>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="gfRate">Guaranteed Fund Rate (%)</Label>
                                    <Input
                                        id="gfRate"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={gfRate}
                                        onChange={(e) => setGfRate(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="tfRate">Thrift Fund Rate (%)</Label>
                                    <Input
                                        id="tfRate"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={tfRate}
                                        onChange={(e) => setTfRate(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="year">Target Financial Year End (March)</Label>
                                <select
                                    id="year"
                                    value={year}
                                    onChange={(e) => setYear(e.target.value)}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background cursor-pointer text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                                >
                                    {Array.from({ length: 6 }).map((_, idx) => {
                                        const yr = new Date().getFullYear() - 3 + idx;
                                        return (
                                            <option key={yr} value={yr}>
                                                March {yr} {yr === 2026 ? "(Bypass Enabled)" : ""}
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-end">
                            <Button type="submit" disabled={isPending}>
                                {isPending ? (
                                    <>
                                        <Loader2 className="mr-2 size-4 animate-spin" />
                                        Computing...
                                    </>
                                ) : (
                                    "Generate Preview"
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
                            <h3 className="font-bold text-lg">Yearly Interest Preview (March {year})</h3>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                GF Rate: {gfRate}% | TF Rate: {tfRate}% | Balances are auto-recovered as of March {year}. Excludes Share Fund dividends (calculated separately in the Dividend section).
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={downloadPreviewCSV}>
                                <Download className="size-4 mr-1.5" /> Export CSV
                            </Button>
                            <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10" onClick={() => setPreviewRows(null)}>
                                <X className="size-4 mr-1.5" /> Cancel Preview
                            </Button>
                            <Button variant="default" size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => setShowConfirm(true)}>
                                <Check className="size-4 mr-1.5" /> Approve & Apply Interest
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
                                    <TableHead className="text-right">GF Balance (March ₹)</TableHead>
                                    <TableHead className="text-right w-[150px]">GF Interest (₹)</TableHead>
                                    <TableHead className="text-right">TF Balance (March ₹)</TableHead>
                                    <TableHead className="text-right w-[150px]">TF Interest (₹)</TableHead>
                                    <TableHead className="text-right">Total Interest (₹)</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredRows.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                                            No members matched your search.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredRows.map((row, index) => {
                                        const gfVal = editedGfAmounts[row.memberId] ?? 0;
                                        const tfVal = editedTfAmounts[row.memberId] ?? 0;
                                        return (
                                            <TableRow key={row.memberId}>
                                                <TableCell className="text-xs text-muted-foreground">{index + 1}</TableCell>
                                                <TableCell className="font-semibold">{row.name}</TableCell>
                                                <TableCell>{row.membershipNumber}</TableCell>
                                                <TableCell className="text-right">₹{row.gfBalance.toLocaleString()}</TableCell>
                                                <TableCell className="text-right">
                                                    <Input
                                                        type="number"
                                                        value={gfVal}
                                                        onChange={(e) => handleGfAmountChange(row.memberId, e.target.value)}
                                                        className="h-8 w-24 text-right pr-1"
                                                        min="0"
                                                    />
                                                </TableCell>
                                                <TableCell className="text-right">₹{row.tfBalance.toLocaleString()}</TableCell>
                                                <TableCell className="text-right">
                                                    <Input
                                                        type="number"
                                                        value={tfVal}
                                                        onChange={(e) => handleTfAmountChange(row.memberId, e.target.value)}
                                                        className="h-8 w-24 text-right pr-1"
                                                        min="0"
                                                    />
                                                </TableCell>
                                                <TableCell className="text-right font-bold text-green-600">
                                                    ₹{(gfVal + tfVal).toLocaleString()}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                            <TableFooter className="sticky bottom-0 bg-background border-t z-10 font-bold">
                                <TableRow>
                                    <TableCell colSpan={3}>Totals</TableCell>
                                    <TableCell className="text-right">₹{totalGfBalance.toLocaleString()}</TableCell>
                                    <TableCell className="text-right text-green-600">₹{totalGfInterest.toLocaleString()}</TableCell>
                                    <TableCell className="text-right">₹{totalTfBalance.toLocaleString()}</TableCell>
                                    <TableCell className="text-right text-green-600">₹{totalTfInterest.toLocaleString()}</TableCell>
                                    <TableCell className="text-right text-green-600 font-bold text-sm">
                                        ₹{grandTotalInterest.toLocaleString()}
                                    </TableCell>
                                </TableRow>
                            </TableFooter>
                        </Table>
                    </div>

                    <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-start gap-2.5 text-xs text-amber-700 dark:text-amber-400">
                        <AlertTriangle className="size-4 text-amber-600 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                            <p className="font-bold">Note on Thrift Fund (TF) Balances</p>
                            <p>
                                The <strong>TF Balance (March)</strong> shown is an <em>estimate</em> calculated by subtracting
                                {" "}post-March monthly contributions from the current balance. This estimate may be <strong>inaccurate</strong> for members who had
                                {" "}<strong>paused deductions</strong>, <strong>custom contribution amounts</strong>, or <strong>skipped months</strong>.
                            </p>
                            <p>
                                Please verify and manually correct any TF balances that appear wrong before approving.
                                The input fields in the table above allow you to adjust individual amounts.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* --- FINAL APPROVE ALERT DIALOG --- */}
            <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-green-600">
                            <AlertTriangle className="size-5" />
                            Approve & Finalize Annual Interest?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="space-y-3 mt-2 text-foreground/90">
                            <p>
                                Are you sure you want to credit the calculated annual interest amounts for the year <strong>{year}</strong>?
                            </p>
                            <div className="p-3.5 bg-muted rounded-lg space-y-1.5 text-xs text-muted-foreground font-medium">
                                <div className="flex justify-between">
                                    <span>Target Period:</span>
                                    <span className="font-semibold text-foreground">March {year}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Total GF Interest Credited:</span>
                                    <span className="font-semibold text-foreground">₹{totalGfInterest.toLocaleString()} ({gfRate}%)</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Total TF Interest Credited:</span>
                                    <span className="font-semibold text-foreground">₹{totalTfInterest.toLocaleString()} ({tfRate}%)</span>
                                </div>
                                <div className="border-t pt-1.5 flex justify-between font-bold text-sm text-foreground">
                                    <span>Grand Total Credited:</span>
                                    <span className="text-green-600 font-bold">₹{grandTotalInterest.toLocaleString()}</span>
                                </div>
                            </div>
                            <p className="text-xs text-muted-foreground italic">
                                This action will credit these interest amounts directly to the respective Guaranteed and Thrift funds of the active members.
                            </p>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setShowConfirm(false)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction asChild>
                            <Button variant="default" className="bg-green-600 hover:bg-green-700" onClick={handleFinalize} disabled={isPending}>
                                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Approve & Credit Dues
                            </Button>
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

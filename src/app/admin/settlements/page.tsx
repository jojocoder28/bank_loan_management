"use client";

export const dynamic = 'force-dynamic';

import React, { useEffect, useState, useTransition } from "react";
import {
    Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    CheckCircle2, Loader2, RefreshCw, Handshake, AlertTriangle, Info, Edit,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getSettlements, settleMemberAccount, updateSettlementAmounts, cancelSettlement } from "../users/actions";

interface SettlementUser {
    _id: string;
    name: string;
    membershipNumber?: string;
    bankAccountNumber?: string;
    status: string;
}

interface SettlementRow {
    _id: string;
    user: SettlementUser;
    type: 'deactivation' | 'retirement';
    shareFund: number;
    guaranteedFund: number;
    thriftFund: number;
    totalFunds: number;
    totalOutstandingLoan: number;
    settlementBalance: number;
    status: 'pending' | 'settled';
    settledAt?: string;
    settledBy?: string;
    createdAt: string;
    updatedAt: string;
}

export default function SettlementsPage() {
    const [pendingRows, setPendingRows] = useState<SettlementRow[]>([]);
    const [settledRows, setSettledRows] = useState<SettlementRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    // Confirm settlement dialog state
    const [confirmDialog, setConfirmDialog] = useState<SettlementRow | null>(null);

    // Revert/Cancel settlement dialog state
    const [revertDialog, setRevertDialog] = useState<SettlementRow | null>(null);

    // Edit amounts dialog state
    const [editDialog, setEditDialog] = useState<SettlementRow | null>(null);
    const [editTotalFunds, setEditTotalFunds] = useState<string>("");
    const [editOutstandingLoan, setEditOutstandingLoan] = useState<string>("");

    const loadData = async () => {
        setLoading(true);
        try {
            const [pending, settled] = await Promise.all([
                getSettlements('pending'),
                getSettlements('settled')
            ]);
            setPendingRows(pending);
            setSettledRows(settled);
        } catch (e: any) {
            toast({
                variant: "destructive",
                title: "Error loading data",
                description: e.message || "Failed to load settlements."
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleSettle = () => {
        if (!confirmDialog) return;
        
        startTransition(async () => {
            const res = await settleMemberAccount(confirmDialog._id);
            if (res.success) {
                toast({
                    title: "Settlement Completed",
                    description: `Successfully settled account for ${confirmDialog.user.name}.`,
                });
                setConfirmDialog(null);
                loadData();
            } else {
                toast({
                    variant: "destructive",
                    title: "Settlement Failed",
                    description: res.error || "An error occurred.",
                });
            }
        });
    };

    const handleRevert = () => {
        if (!revertDialog) return;
        
        startTransition(async () => {
            const res = await cancelSettlement(revertDialog._id);
            if (res.success) {
                toast({
                    title: "Settlement Reverted",
                    description: `Successfully reactivated member ${revertDialog.user.name} and restored their fund balances.`,
                });
                setRevertDialog(null);
                loadData();
            } else {
                toast({
                    variant: "destructive",
                    title: "Reversion Failed",
                    description: res.error || "An error occurred.",
                });
            }
        });
    };

    const handleOpenEdit = (row: SettlementRow) => {
        setEditDialog(row);
        setEditTotalFunds(row.totalFunds.toString());
        setEditOutstandingLoan(row.totalOutstandingLoan.toString());
    };

    const handleSaveEdit = () => {
        if (!editDialog) return;
        const funds = Number(editTotalFunds);
        const loan = Number(editOutstandingLoan);
        if (isNaN(funds) || isNaN(loan) || funds < 0 || loan < 0) {
            toast({
                variant: "destructive",
                title: "Invalid input",
                description: "Amounts must be non-negative numbers."
            });
            return;
        }

        startTransition(async () => {
            const res = await updateSettlementAmounts(editDialog._id, funds, loan);
            if (res.success) {
                toast({
                    title: "Settlement Updated",
                    description: `Successfully adjusted settlement amounts for ${editDialog.user.name}.`,
                });
                setEditDialog(null);
                loadData();
            } else {
                toast({
                    variant: "destructive",
                    title: "Update Failed",
                    description: res.error || "An error occurred.",
                });
            }
        });
    };

    return (
        <div className="flex flex-col gap-6 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Manual Settlements</h1>
                    <p className="text-muted-foreground text-sm">
                        Manage manual settlements, fund offsets, and net payout/collection instructions for retired and deactivated members.
                    </p>
                </div>
                <Button variant="outline" size="sm" onClick={loadData} disabled={loading} className="w-fit">
                    <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            <Tabs defaultValue="pending" className="w-full">
                <TabsList className="grid w-full max-w-[400px] grid-cols-2">
                    <TabsTrigger value="pending" className="relative">
                        Pending Settlements
                        {pendingRows.length > 0 && (
                            <Badge variant="destructive" className="ml-2 absolute -top-1 -right-2 px-1.5 py-0.5 text-[10px]">
                                {pendingRows.length}
                            </Badge>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="settled">Completed Settlements</TabsTrigger>
                </TabsList>

                {/* --- PENDING SETTLEMENTS TAB --- */}
                <TabsContent value="pending" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Pending Manual Settlements</CardTitle>
                            <CardDescription>
                                Members who have been retired or deactivated. Settle their net balance manually and mark them as settled here to close out their outstanding loans.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="flex flex-col items-center justify-center py-12 gap-2">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                    <p className="text-sm text-muted-foreground">Loading pending settlements...</p>
                                </div>
                            ) : pendingRows.length === 0 ? (
                                <div className="text-center py-12 border border-dashed rounded-lg">
                                    <Handshake className="mx-auto h-12 w-12 text-muted-foreground" />
                                    <p className="mt-4 text-lg font-semibold">No Pending Settlements</p>
                                    <p className="text-muted-foreground text-sm mt-1">All retired or deactivated member accounts are currently settled.</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Date Initiated</TableHead>
                                                <TableHead>Member</TableHead>
                                                <TableHead>Type</TableHead>
                                                <TableHead className="text-right">Fund Balance (SF+GF+TF)</TableHead>
                                                <TableHead className="text-right">Outstanding Loan</TableHead>
                                                <TableHead className="text-right">Net Settlement Instruction</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {pendingRows.map((row) => {
                                                const date = new Date(row.createdAt).toLocaleDateString();
                                                const isPayout = row.settlementBalance >= 0;
                                                return (
                                                    <TableRow key={row._id}>
                                                        <TableCell>{date}</TableCell>
                                                        <TableCell>
                                                            <div className="font-semibold">{row.user?.name || "Unknown Member"}</div>
                                                            <div className="text-xs text-muted-foreground">
                                                                MB #: {row.user?.membershipNumber || "N/A"} | A/C: {row.user?.bankAccountNumber || "N/A"}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge variant={row.type === 'retirement' ? 'default' : 'secondary'} className="capitalize">
                                                                {row.type}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="text-right">₹{row.totalFunds.toLocaleString()}</TableCell>
                                                        <TableCell className="text-right">₹{row.totalOutstandingLoan.toLocaleString()}</TableCell>
                                                        <TableCell className="text-right">
                                                            {isPayout ? (
                                                                <div className="flex flex-col items-end">
                                                                    <Badge variant="outline" className="border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-400 font-bold">
                                                                        PAY USER: ₹{row.settlementBalance.toLocaleString()}
                                                                    </Badge>
                                                                    <span className="text-[10px] text-muted-foreground mt-1">Admin pays member</span>
                                                                </div>
                                                            ) : (
                                                                <div className="flex flex-col items-end">
                                                                    <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400 font-bold">
                                                                        COLLECT: ₹{Math.abs(row.settlementBalance).toLocaleString()}
                                                                    </Badge>
                                                                    <span className="text-[10px] text-muted-foreground mt-1">Member pays admin</span>
                                                                </div>
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <div className="flex justify-end gap-2">
                                                                <Button size="sm" variant="ghost" className="text-destructive hover:bg-destructive/10" onClick={() => setRevertDialog(row)}>
                                                                    Revert
                                                                </Button>
                                                                <Button size="sm" variant="outline" onClick={() => handleOpenEdit(row)}>
                                                                    Edit
                                                                </Button>
                                                                <Button size="sm" variant={isPayout ? "default" : "secondary"} onClick={() => setConfirmDialog(row)}>
                                                                    Mark as Settled
                                                                </Button>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* --- COMPLETED SETTLEMENTS TAB --- */}
                <TabsContent value="settled" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Completed Settlements History</CardTitle>
                            <CardDescription>
                                A record of retired or deactivated member accounts that have been manually settled and closed.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="flex flex-col items-center justify-center py-12 gap-2">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                    <p className="text-sm text-muted-foreground">Loading completed settlements...</p>
                                </div>
                            ) : settledRows.length === 0 ? (
                                <div className="text-center py-12 border border-dashed rounded-lg">
                                    <Info className="mx-auto h-12 w-12 text-muted-foreground" />
                                    <p className="mt-4 text-lg font-semibold">No Settlement History</p>
                                    <p className="text-muted-foreground text-sm mt-1">No completed settlements found in records.</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Date Settled</TableHead>
                                                <TableHead>Member</TableHead>
                                                <TableHead>Type</TableHead>
                                                <TableHead className="text-right">Original Fund Balance</TableHead>
                                                <TableHead className="text-right">Settled Loan Amt</TableHead>
                                                <TableHead className="text-right">Settled Balance</TableHead>
                                                <TableHead>Settled By</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {settledRows.map((row) => {
                                                const date = row.settledAt ? new Date(row.settledAt).toLocaleDateString() : 'N/A';
                                                const isPayout = row.settlementBalance >= 0;
                                                return (
                                                    <TableRow key={row._id}>
                                                        <TableCell>{date}</TableCell>
                                                        <TableCell>
                                                            <div className="font-semibold">{row.user?.name || "Unknown Member"}</div>
                                                            <div className="text-xs text-muted-foreground">
                                                                MB #: {row.user?.membershipNumber || "N/A"} | A/C: {row.user?.bankAccountNumber || "N/A"}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge variant={row.type === 'retirement' ? 'default' : 'secondary'} className="capitalize">
                                                                {row.type}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="text-right">₹{row.totalFunds.toLocaleString()}</TableCell>
                                                        <TableCell className="text-right">₹{row.totalOutstandingLoan.toLocaleString()}</TableCell>
                                                        <TableCell className="text-right">
                                                            <span className={isPayout ? "text-green-600 dark:text-green-400 font-semibold" : "text-amber-600 dark:text-amber-400 font-semibold"}>
                                                                {isPayout ? '+' : '-'}₹{Math.abs(row.settlementBalance).toLocaleString()}
                                                            </span>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center gap-1.5">
                                                                <CheckCircle2 className="size-3.5 text-green-600" />
                                                                <span>{row.settledBy || "Admin"}</span>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* --- EDIT SETTLEMENT DIALOG --- */}
            {editDialog && (
                <Dialog open={editDialog !== null} onOpenChange={(open) => !open && setEditDialog(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Edit className="size-5" />
                                Edit Settlement Amounts
                            </DialogTitle>
                            <DialogDescription>
                                Adjust the calculated amounts for <strong>{editDialog.user?.name}</strong>. Updating the outstanding loan will also modify their active loan principal(s) in the database, updating the bank's accrued interest revenue.
                            </DialogDescription>
                        </DialogHeader>
                        
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="edit-funds">Total Fund Balance (SF + GF + TF)</Label>
                                <Input
                                    id="edit-funds"
                                    type="number"
                                    value={editTotalFunds}
                                    onChange={(e) => setEditTotalFunds(e.target.value)}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="edit-loan">Total Outstanding Loan Principal</Label>
                                <Input
                                    id="edit-loan"
                                    type="number"
                                    value={editOutstandingLoan}
                                    onChange={(e) => setEditOutstandingLoan(e.target.value)}
                                />
                            </div>
                            
                            <div className="p-3 bg-muted rounded-lg space-y-1.5 text-xs text-muted-foreground mt-2">
                                <div className="flex justify-between font-bold text-sm text-foreground">
                                    <span>Recalculated Net Settlement:</span>
                                    {(() => {
                                        const f = Number(editTotalFunds) || 0;
                                        const l = Number(editOutstandingLoan) || 0;
                                        const bal = f - l;
                                        return (
                                            <span className={bal >= 0 ? "text-green-600 font-bold" : "text-amber-600 font-bold"}>
                                                {bal >= 0 ? "PAY USER: " : "COLLECT: "} ₹{Math.abs(bal).toLocaleString()}
                                            </span>
                                        );
                                    })()}
                                </div>
                            </div>
                        </div>
                        
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setEditDialog(null)}>Cancel</Button>
                            <Button onClick={handleSaveEdit} disabled={isPending}>
                                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save Changes
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}

            {/* --- REVERT/CANCEL SETTLEMENT DIALOG --- */}
            <AlertDialog open={revertDialog !== null} onOpenChange={(open) => !open && setRevertDialog(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                            <AlertTriangle className="size-5" />
                            Revert Settlement & Reactivate Member?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="space-y-3 mt-2 text-foreground/90">
                            <p>
                                Are you sure you want to revert the deactivation/retirement for <strong>{revertDialog?.user?.name}</strong>?
                            </p>
                            <p>
                                This will change their status back to <strong>Active</strong> and restore their original fund balances:
                            </p>
                            <div className="p-3.5 bg-muted rounded-lg space-y-1.5 text-xs text-muted-foreground">
                                <div className="flex justify-between">
                                    <span>Share Fund:</span>
                                    <span className="font-semibold text-foreground">₹{revertDialog?.shareFund.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Guaranteed Fund:</span>
                                    <span className="font-semibold text-foreground">₹{revertDialog?.guaranteedFund.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Thrift Fund:</span>
                                    <span className="font-semibold text-foreground">₹{revertDialog?.thriftFund.toLocaleString()}</span>
                                </div>
                                <div className="border-t pt-1.5 flex justify-between font-bold text-sm text-foreground">
                                    <span>Total Restored Funds:</span>
                                    <span className="text-green-600 font-bold">₹{revertDialog?.totalFunds.toLocaleString()}</span>
                                </div>
                            </div>
                            <p className="text-xs text-muted-foreground italic">
                                The pending settlement record will be deleted, and the member will be fully reactivated with their original funds.
                            </p>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setRevertDialog(null)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction asChild>
                            <Button variant="destructive" onClick={handleRevert} disabled={isPending}>
                                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Revert & Reactivate
                            </Button>
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* --- CONFIRM SETTLEMENT DIALOG --- */}
            <AlertDialog open={confirmDialog !== null} onOpenChange={(open) => !open && setConfirmDialog(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-amber-600">
                            <AlertTriangle className="size-5" />
                            Confirm Manual Settlement
                        </AlertDialogTitle>
                        <AlertDialogDescription className="space-y-3 mt-2 text-foreground/90">
                            <p>
                                Are you sure you want to mark the account of <strong>{confirmDialog?.user?.name}</strong> as fully settled?
                            </p>
                            <div className="p-3.5 bg-muted rounded-lg space-y-1.5 text-xs text-muted-foreground">
                                <div className="flex justify-between">
                                    <span>Total Funds (SF+GF+TF):</span>
                                    <span className="font-semibold text-foreground">₹{confirmDialog?.totalFunds.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Total Outstanding Loan:</span>
                                    <span className="font-semibold text-destructive">₹{confirmDialog?.totalOutstandingLoan.toLocaleString()}</span>
                                </div>
                                <div className="border-t pt-1.5 flex justify-between font-bold text-sm text-foreground">
                                    <span>{confirmDialog && confirmDialog.settlementBalance >= 0 ? "Net Payout (Pay User):" : "Net Collection (Collect):"}</span>
                                    <span className={confirmDialog && confirmDialog.settlementBalance >= 0 ? "text-green-600 font-bold" : "text-amber-600 font-bold"}>
                                        ₹{confirmDialog && Math.abs(confirmDialog.settlementBalance).toLocaleString()}
                                    </span>
                                </div>
                            </div>
                            <p className="text-xs text-muted-foreground italic">
                                This action will permanently zero out all outstanding loan principal records for this member and create the corresponding payment transactions. This cannot be undone.
                            </p>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setConfirmDialog(null)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction asChild>
                            <Button onClick={handleSettle} disabled={isPending}>
                                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Settle Account
                            </Button>
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}


import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getPendingLoans, approveLoan, rejectLoan } from "./actions";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import Link from 'next/link';

export default async function LoanApprovalsPage() {
  const pendingLoans = await getPendingLoans();

  const ApprovalForm = ({ loanId, action, children, variant }: { loanId: string, action: (formData: FormData) => void, children: React.ReactNode, variant: "default" | "destructive" }) => (
    <form action={action}>
        <input type="hidden" name="loanId" value={loanId} />
        <Button size="sm" variant={variant}>
            {children}
        </Button>
    </form>
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>Loan Approvals</CardTitle>
        <CardDescription>
          Review and process all pending loan applications.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {pendingLoans.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Applicant</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Loan Amount</TableHead>
              <TableHead>Share Fund</TableHead>
              <TableHead>Guaranteed Fund</TableHead>
              <TableHead>Applied On</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pendingLoans.map((loan) => (
              <TableRow key={loan._id}>
                <TableCell className="font-medium">
                  <Link href={`/admin/users/${loan.user._id}`} className="text-primary hover:underline">
                    {loan.user.name}
                  </Link>
                </TableCell>
                <TableCell>{loan.user.email}</TableCell>
                <TableCell>₹{loan.loanAmount.toLocaleString()}</TableCell>
                <TableCell>₹{loan.user.shareFund.toLocaleString()}</TableCell>
                <TableCell>₹{loan.user.guaranteedFund.toLocaleString()}</TableCell>
                <TableCell>{new Date(loan.createdAt).toLocaleDateString()}</TableCell>
                <TableCell className="flex justify-end gap-2">
                    <ApprovalForm loanId={loan._id} action={approveLoan} variant="default">
                        <Check className="mr-2 size-4" /> Approve
                    </ApprovalForm>
                     <ApprovalForm loanId={loan._id} action={rejectLoan} variant="destructive">
                        <X className="mr-2 size-4" /> Reject
                    </ApprovalForm>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        ) : (
            <div className="text-center text-muted-foreground py-12">
                <p>There are no pending loan applications to review.</p>
            </div>
        )}
      </CardContent>
    </Card>
  );
}

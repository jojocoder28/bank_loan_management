
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getPendingLoans, getPendingMemberships, getPendingModifications } from "./actions";
import { LoanApprovals } from "./_components/loan-approvals";
import { MembershipApprovals } from "./_components/membership-approvals";
import { ModificationApprovals } from "./_components/modification-approvals";


export default async function ApprovalsPage() {
  const pendingLoans = await getPendingLoans();
  const pendingUsers = await getPendingMemberships();
  const pendingModifications = await getPendingModifications();

  return (
    <Tabs defaultValue="memberships" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="memberships">Membership Applications ({pendingUsers.length})</TabsTrigger>
        <TabsTrigger value="loans">Loan Applications ({pendingLoans.length})</TabsTrigger>
        <TabsTrigger value="modifications">Loan Modifications ({pendingModifications.length})</TabsTrigger>
      </TabsList>
      <TabsContent value="memberships">
        <Card>
          <CardHeader>
            <CardTitle>Membership Approvals</CardTitle>
            <CardDescription>
              Review and approve new membership applications. Approving a user changes their role to 'member'.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MembershipApprovals pendingUsers={pendingUsers} />
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="loans">
        <Card>
          <CardHeader>
            <CardTitle>Loan Approvals</CardTitle>
            <CardDescription>
              Review and process all pending loan applications for active members.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LoanApprovals pendingLoans={pendingLoans} />
          </CardContent>
        </Card>
      </TabsContent>
        <TabsContent value="modifications">
        <Card>
          <CardHeader>
            <CardTitle>Loan Modification Approvals</CardTitle>
            <CardDescription>
              Review and process member requests to change their active loans.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ModificationApprovals pendingModifications={pendingModifications} />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>

  );
}

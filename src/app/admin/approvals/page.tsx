
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getPendingLoans, getPendingMemberships } from "./actions";
import { LoanApprovals } from "./_components/loan-approvals";
import { MembershipApprovals } from "./_components/membership-approvals";


export default async function ApprovalsPage() {
  const pendingLoans = await getPendingLoans();
  const pendingMemberships = await getPendingMemberships();

  return (
    <Tabs defaultValue="memberships" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="memberships">Membership Applications ({pendingMemberships.length})</TabsTrigger>
        <TabsTrigger value="loans">Loan Applications ({pendingLoans.length})</TabsTrigger>
      </TabsList>
      <TabsContent value="memberships">
        <Card>
          <CardHeader>
            <CardTitle>Membership Approvals</CardTitle>
            <CardDescription>
              Review and approve new membership applications. Approved users will become active members.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MembershipApprovals pendingMemberships={pendingMemberships} />
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
    </Tabs>

  );
}

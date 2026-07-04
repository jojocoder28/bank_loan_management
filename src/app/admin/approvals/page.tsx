
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getPendingLoans, getPendingMemberships, getPendingModifications, getPendingProfileModifications } from "./actions";
import { LoanApprovals } from "./_components/loan-approvals";
import { MembershipApprovals } from "./_components/membership-approvals";
import { ModificationApprovals } from "./_components/modification-approvals";
import { ProfileApprovals } from "./_components/profile-approvals";

export default async function ApprovalsPage() {
  const pendingLoans = await getPendingLoans();
  const pendingUsers = await getPendingMemberships();
  const pendingModifications = await getPendingModifications();
  const pendingProfileModifications = await getPendingProfileModifications();

  return (
    <Tabs defaultValue="memberships" className="w-full">
      <TabsList className="flex flex-col md:grid w-full md:grid-cols-4 h-auto gap-1 bg-muted p-1">
        <TabsTrigger value="memberships" className="w-full justify-start md:justify-center py-2">Membership Applications ({pendingUsers.length})</TabsTrigger>
        <TabsTrigger value="loans" className="w-full justify-start md:justify-center py-2">Loan Applications ({pendingLoans.length})</TabsTrigger>
        <TabsTrigger value="modifications" className="w-full justify-start md:justify-center py-2">Loan Modifications ({pendingModifications.length})</TabsTrigger>
        <TabsTrigger value="profiles" className="w-full justify-start md:justify-center py-2">Profile Updates ({pendingProfileModifications.length})</TabsTrigger>
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
      <TabsContent value="profiles">
        <Card>
          <CardHeader>
            <CardTitle>Profile Update Approvals</CardTitle>
            <CardDescription>
              Review and process member requests to change their addresses and nominee details.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProfileApprovals pendingRequests={pendingProfileModifications} />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>

  );
}

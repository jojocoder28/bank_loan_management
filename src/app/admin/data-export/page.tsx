
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Download, Users } from "lucide-react";
import { getSubmittedData } from "./actions";
import { DataTable } from "./_components/data-table";
import { columns } from "./_components/columns";


export default async function DataExportPage() {
    const data = await getSubmittedData();

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Download />
                    Export Member Data for Bulk Import
                </CardTitle>
                <CardDescription>
                    Review the data submitted by users via the public form. Once you have verified the information, download the `Members.xlsx` file. You will then need to manually create the `Fund_Balances.xlsx` and `Loans.xlsx` files before proceeding to the Bulk Import tool.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <DataTable columns={columns} data={data} />
            </CardContent>
        </Card>
    );
}

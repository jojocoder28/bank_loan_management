
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Settings as SettingsIcon } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="flex justify-center items-start pt-8">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SettingsIcon className="size-6" />
            Settings
          </CardTitle>
          <CardDescription>
            Manage your account and application settings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-12">
            <p>This page is under construction.</p>
            <p className="text-sm">Account settings will be available here soon.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

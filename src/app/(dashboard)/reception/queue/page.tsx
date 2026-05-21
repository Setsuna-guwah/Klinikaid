import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { ClipboardList } from "lucide-react";

export const dynamic = "force-dynamic";

export default function ReceptionQueuePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Reception Queue</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Manage patient arrivals and triage wait times</p>
      </div>
      <Card className="border border-slate-200/80 dark:border-slate-800 shadow-md">
        <CardHeader className="flex flex-row items-center gap-4 bg-slate-50/55 dark:bg-slate-900/30 pb-4">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400">
            <ClipboardList className="h-5 w-5" />
          </div>
          <div>
            <CardTitle>Patient Waiting List</CardTitle>
            <CardDescription>Real-time queue tracking and check-in</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <p className="text-sm text-slate-500 dark:text-slate-400 italic">No patients currently in the queue. Complete implementation in Phase 4.</p>
        </CardContent>
      </Card>
    </div>
  );
}

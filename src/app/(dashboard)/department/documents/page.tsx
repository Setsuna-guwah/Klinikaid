import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { ClipboardList } from "lucide-react";

export const dynamic = "force-dynamic";

export default function DepartmentDocumentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Documents Queue</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">View diagnostic referral scripts routed to this department</p>
      </div>
      <Card className="border border-slate-200/80 dark:border-slate-800 shadow-md">
        <CardHeader className="flex flex-row items-center gap-4 bg-slate-50/55 dark:bg-slate-900/30 pb-4">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-indigo-100 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400">
            <ClipboardList className="h-5 w-5" />
          </div>
          <div>
            <CardTitle>Department Referral Scripts</CardTitle>
            <CardDescription>View doctor requests and OCR verification info</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <p className="text-sm text-slate-500 dark:text-slate-400 italic">No diagnostic referrals assigned to this department. Complete implementation in Phase 5.</p>
        </CardContent>
      </Card>
    </div>
  );
}

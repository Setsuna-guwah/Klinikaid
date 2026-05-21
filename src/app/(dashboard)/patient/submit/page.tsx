import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Upload } from "lucide-react";

export const dynamic = "force-dynamic";

export default function PatientSubmitPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Submit Document</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Upload referral files or doctor request scripts securely</p>
      </div>
      <Card className="border border-slate-200/80 dark:border-slate-800 shadow-md">
        <CardHeader className="flex flex-row items-center gap-4 bg-slate-50/55 dark:bg-slate-900/30 pb-4">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400">
            <Upload className="h-5 w-5" />
          </div>
          <div>
            <CardTitle>File Upload Portal</CardTitle>
            <CardDescription>Upload PDF or image scan of doctor referral script</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <p className="text-sm text-slate-500 dark:text-slate-400 italic">File upload interface loaded. Complete implementation in Phase 9.</p>
        </CardContent>
      </Card>
    </div>
  );
}

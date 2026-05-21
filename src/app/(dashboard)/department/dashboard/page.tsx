import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { FileSpreadsheet, FileText, ClipboardList } from "lucide-react";

export const dynamic = "force-dynamic";

export default function DepartmentDashboardPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Department Dashboard</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Clinical laboratory and imaging records execution
        </p>
      </div>

      {/* Main Welcome Card */}
      <Card className="border border-slate-200/80 dark:border-slate-800 shadow-md">
        <CardHeader className="flex flex-row items-center gap-4 bg-slate-50/55 dark:bg-slate-900/30 pb-4">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-purple-100 text-purple-600 dark:bg-purple-950/30 dark:text-purple-400">
            <FileSpreadsheet className="h-5 w-5" />
          </div>
          <div>
            <CardTitle>Welcome back, Medical Technologist</CardTitle>
            <CardDescription>Clinical results logging and reference validation is active</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            Record patient test results, view diagnostic request documents, and manage your specific department&apos;s workspace. RLS guards restrict your actions strictly to your assigned clinical department.
          </p>

          {/* Quick Metrics Stubs */}
          <div className="grid gap-4 md:grid-cols-3 pt-2">
            <div className="p-4 border border-slate-200/60 dark:border-slate-850 rounded-lg space-y-2">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                <ClipboardList className="h-4 w-4 text-purple-500" />
                Requests Queue
              </div>
              <p className="text-2xl font-bold">--</p>
            </div>
            <div className="p-4 border border-slate-200/60 dark:border-slate-850 rounded-lg space-y-2">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                <FileText className="h-4 w-4 text-emerald-500" />
                Entries Completed
              </div>
              <p className="text-2xl font-bold">--</p>
            </div>
            <div className="p-4 border border-slate-200/60 dark:border-slate-850 rounded-lg space-y-2">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                <FileSpreadsheet className="h-4 w-4 text-indigo-500" />
                Auto-flagged Reports
              </div>
              <p className="text-2xl font-bold">--</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

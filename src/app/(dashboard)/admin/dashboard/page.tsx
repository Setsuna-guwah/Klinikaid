import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Activity, Shield, Users, Terminal } from "lucide-react";

export const dynamic = "force-dynamic";

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Admin Dashboard</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Clinic administrative control and oversight panel
        </p>
      </div>

      {/* Main Welcome Card */}
      <Card className="border border-slate-200/80 dark:border-slate-800 shadow-md">
        <CardHeader className="flex flex-row items-center gap-4 bg-slate-50/55 dark:bg-slate-900/30 pb-4">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-red-100 text-red-600 dark:bg-red-950/30 dark:text-red-400">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <CardTitle>Welcome back, Administrator</CardTitle>
            <CardDescription>Full system oversight and access control is active</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            This administrative control panel houses the features for staff management, vector KBs, audit trail analysis, and department configurations. Select a module from the sidebar navigation to get started.
          </p>

          {/* Quick Metrics Stubs */}
          <div className="grid gap-4 md:grid-cols-3 pt-2">
            <div className="p-4 border border-slate-200/60 dark:border-slate-850 rounded-lg space-y-2">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                <Users className="h-4 w-4 text-blue-500" />
                Active Staff
              </div>
              <p className="text-2xl font-bold">--</p>
            </div>
            <div className="p-4 border border-slate-200/60 dark:border-slate-850 rounded-lg space-y-2">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                <Activity className="h-4 w-4 text-emerald-500" />
                Today&apos;s Patients
              </div>
              <p className="text-2xl font-bold">--</p>
            </div>
            <div className="p-4 border border-slate-200/60 dark:border-slate-850 rounded-lg space-y-2">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                <Terminal className="h-4 w-4 text-indigo-500" />
                Audit Logs
              </div>
              <p className="text-2xl font-bold">--</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

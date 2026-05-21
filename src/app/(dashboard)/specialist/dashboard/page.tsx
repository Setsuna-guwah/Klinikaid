import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { UserCheck, LineChart } from "lucide-react";

export const dynamic = "force-dynamic";

export default function SpecialistDashboardPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Specialist Dashboard</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Medical specialist diagnostics review and longitudinal analytics
        </p>
      </div>

      {/* Main Welcome Card */}
      <Card className="border border-slate-200/80 dark:border-slate-800 shadow-md">
        <CardHeader className="flex flex-row items-center gap-4 bg-slate-50/55 dark:bg-slate-900/30 pb-4">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-indigo-100 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400">
            <LineChart className="h-5 w-5" />
          </div>
          <div>
            <CardTitle>Welcome back, Doctor</CardTitle>
            <CardDescription>Longitudinal diagnostics analysis and read-only reports are active</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            Search patient clinical records, trace historical laboratory progress against reference baselines, and review medical records. Access is strictly read-only per capstone specification (no AI diagnostics are active).
          </p>

          {/* Quick Metrics Stubs */}
          <div className="grid gap-4 md:grid-cols-2 pt-2">
            <div className="p-4 border border-slate-200/60 dark:border-slate-850 rounded-lg space-y-2">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                <UserCheck className="h-4 w-4 text-indigo-500" />
                Assigned Patients
              </div>
              <p className="text-2xl font-bold">--</p>
            </div>
            <div className="p-4 border border-slate-200/60 dark:border-slate-850 rounded-lg space-y-2">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                <LineChart className="h-4 w-4 text-emerald-500" />
                Longitudinal Charts
              </div>
              <p className="text-2xl font-bold">--</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

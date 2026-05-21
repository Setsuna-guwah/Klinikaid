import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Heart, Bot, Upload, Search, FileText } from "lucide-react";

export const dynamic = "force-dynamic";

export default function PatientDashboardPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Patient Dashboard</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Your personal health results portal
        </p>
      </div>

      {/* Main Welcome Card */}
      <Card className="border border-slate-200/80 dark:border-slate-800 shadow-md">
        <CardHeader className="flex flex-row items-center gap-4 bg-slate-50/55 dark:bg-slate-900/30 pb-4">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400">
            <Heart className="h-5 w-5 fill-emerald-600" />
          </div>
          <div>
            <CardTitle>Welcome to KlinikAid</CardTitle>
            <CardDescription>Your personal health results, records, and chatbot</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            Welcome to your patient portal. Here you can submit diagnostic request files for laboratory processing, track verification progress, view test results, and communicate with the clinic&apos;s RAG-assisted AI assistant for routine medical lab questions.
          </p>

          {/* Quick Actions Shortcuts */}
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 pt-2">
            <div className="p-4 border border-slate-200/60 dark:border-slate-850 rounded-lg space-y-2 text-center flex flex-col items-center">
              <Bot className="h-6 w-6 text-blue-500" />
              <span className="text-xs font-semibold uppercase text-slate-500">AI Assistant</span>
              <p className="text-xl font-bold">--</p>
            </div>
            <div className="p-4 border border-slate-200/60 dark:border-slate-850 rounded-lg space-y-2 text-center flex flex-col items-center">
              <Upload className="h-6 w-6 text-emerald-500" />
              <span className="text-xs font-semibold uppercase text-slate-500">Submit Referral</span>
              <p className="text-xl font-bold">--</p>
            </div>
            <div className="p-4 border border-slate-200/60 dark:border-slate-850 rounded-lg space-y-2 text-center flex flex-col items-center">
              <Search className="h-6 w-6 text-indigo-500" />
              <span className="text-xs font-semibold uppercase text-slate-500">Submissions</span>
              <p className="text-xl font-bold">--</p>
            </div>
            <div className="p-4 border border-slate-200/60 dark:border-slate-850 rounded-lg space-y-2 text-center flex flex-col items-center">
              <FileText className="h-6 w-6 text-purple-500" />
              <span className="text-xs font-semibold uppercase text-slate-500">My Results</span>
              <p className="text-xl font-bold">--</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

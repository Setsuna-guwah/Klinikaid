import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Bot } from "lucide-react";

export const dynamic = "force-dynamic";

export default function PatientChatPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">AI Assistant</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Ask the clinic chatbot regarding rules, schedules, and clinical tests</p>
      </div>
      <Card className="border border-slate-200/80 dark:border-slate-800 shadow-md">
        <CardHeader className="flex flex-row items-center gap-4 bg-slate-50/55 dark:bg-slate-900/30 pb-4">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <CardTitle>RAG Inquiry Assistant</CardTitle>
            <CardDescription>Get answers dynamically matched with clinic knowledge</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <p className="text-sm text-slate-500 dark:text-slate-400 italic">Chat interface is initialized. Complete implementation in Phase 9.</p>
        </CardContent>
      </Card>
    </div>
  );
}
